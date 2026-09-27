//! The packaged app is this binary. It spawns the shell sidecar and owns the window.
//! Exit code 75 starts the sidecar again. Any other exit stops the app.

use std::fs;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::mpsc::{self, RecvTimeoutError};
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};

use tauri::{AppHandle, Manager};
use url::Url;

use crate::admit_origin;

pub const RESTART_EXIT: i32 = 75;
const READY_LIMIT: Duration = Duration::from_secs(60);

pub enum ChildStop {
    Restart,
    Exit(i32),
}

pub fn child_stop(code: Option<i32>) -> ChildStop {
    match code {
        Some(RESTART_EXIT) => ChildStop::Restart,
        Some(code) => ChildStop::Exit(code),
        None => ChildStop::Exit(1),
    }
}

pub fn shell_entry(prefix: &Path) -> PathBuf {
    prefix.join("node_modules/@mini-app/shell/src/dev.ts")
}

/// `Contents/MacOS/<exe>` uses `Contents/Resources/prefix`. A sibling `prefix/` is the local layout.
pub fn prefix_from_exe(exe: &Path) -> Option<PathBuf> {
    let dir = exe.parent()?;
    for candidate in [dir.join("../Resources/prefix"), dir.join("prefix")] {
        if shell_entry(&candidate).is_file() {
            return Some(fs::canonicalize(&candidate).unwrap_or(candidate));
        }
    }
    None
}

pub fn is_app_bundle(prefix: &Path) -> bool {
    prefix
        .parent()
        .and_then(|parent| parent.file_name())
        .is_some_and(|name| name == "Resources")
}

pub fn runtime_dir(prefix: &Path, override_value: Option<&str>, home: &Path) -> PathBuf {
    if let Some(value) = override_value {
        if !value.is_empty() {
            return PathBuf::from(value);
        }
    }
    if is_app_bundle(prefix) {
        home.join(".mini-app").join("runtime")
    } else {
        prefix
            .parent()
            .unwrap_or(prefix)
            .join("runtime")
    }
}

fn node_file_name() -> &'static str {
    if cfg!(windows) { "node.exe" } else { "node" }
}

fn path_sep() -> char {
    if cfg!(windows) { ';' } else { ':' }
}

fn is_exec(path: &Path) -> bool {
    if !path.is_file() {
        return false;
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        return path
            .metadata()
            .map(|meta| meta.permissions().mode() & 0o111 != 0)
            .unwrap_or(false);
    }
    #[cfg(not(unix))]
    {
        true
    }
}

pub fn find_node(path_env: &str, home: &Path) -> Option<PathBuf> {
    for dir in path_env.split(path_sep()).filter(|dir| !dir.is_empty()) {
        let candidate = Path::new(dir).join(node_file_name());
        if is_exec(&candidate) {
            return Some(candidate);
        }
    }
    #[cfg(unix)]
    if let Some(nvm) = nvm_node(home) {
        return Some(nvm);
    }
    for dir in ["/opt/homebrew/bin", "/usr/local/bin"] {
        let candidate = Path::new(dir).join(node_file_name());
        if is_exec(&candidate) {
            return Some(candidate);
        }
    }
    let _ = home;
    None
}

#[cfg(unix)]
fn nvm_node(home: &Path) -> Option<PathBuf> {
    let root = home.join(".nvm/versions/node");
    let entries = fs::read_dir(&root).ok()?;
    let mut names: Vec<_> = entries.filter_map(|entry| entry.ok()).collect();
    names.sort_by_key(|entry| entry.file_name());
    names.into_iter().rev().find_map(|entry| {
        let name = entry.file_name();
        let name = name.to_string_lossy();
        if !(name.starts_with("v22") || name.starts_with("v24")) {
            return None;
        }
        let candidate = entry.path().join("bin").join("node");
        is_exec(&candidate).then_some(candidate)
    })
}

pub fn prepend_path(path: &str, dir: &str) -> String {
    if dir.is_empty() || !Path::new(dir).is_dir() {
        return path.to_string();
    }
    if path.split(path_sep()).any(|item| item == dir) {
        return path.to_string();
    }
    if path.is_empty() {
        dir.to_string()
    } else {
        format!("{dir}{sep}{path}", sep = path_sep())
    }
}

struct Launch {
    node: PathBuf,
    path: String,
    entry: PathBuf,
    runtime: PathBuf,
    panel: PathBuf,
    gui: bool,
}

fn launch_plan(prefix: &Path) -> Result<Launch, String> {
    let entry = shell_entry(prefix);
    if !entry.is_file() {
        return Err(format!("shell entry is missing: {}", entry.display()));
    }
    let home = home_dir();
    let gui = is_app_bundle(prefix);
    let inherited = std::env::var("PATH").unwrap_or_default();
    let base_path = if gui {
        login_path().unwrap_or_else(|| {
            let mut path = "/usr/bin:/bin:/usr/sbin:/sbin".to_string();
            path = prepend_path(&path, "/opt/homebrew/bin");
            path = prepend_path(&path, "/usr/local/bin");
            path = prepend_path(&path, &home.join(".local/bin").display().to_string());
            prepend_path(&path, &home.join(".cargo/bin").display().to_string())
        })
    } else {
        let mut path = inherited;
        path = prepend_path(&path, "/opt/homebrew/bin");
        path = prepend_path(&path, "/usr/local/bin");
        prepend_path(&path, &home.join(".local/bin").display().to_string())
    };
    let node = find_node(&base_path, &home).ok_or_else(|| {
        "Mohou needs Node.js 22+ . Install it from https://nodejs.org and open Mohou again.".to_string()
    })?;
    let node_bin = node
        .parent()
        .map(|dir| dir.display().to_string())
        .unwrap_or_default();
    let path = prepend_path(&base_path, &node_bin);
    let runtime = runtime_dir(prefix, std::env::var("MINI_APP_RUNTIME").ok().as_deref(), &home);
    fs::create_dir_all(&runtime).map_err(|error| format!("could not create runtime: {error}"))?;
    link_pi_peers(prefix, &node);
    Ok(Launch {
        node,
        path,
        entry,
        runtime,
        panel: prefix.join("node_modules/@mini-app/shell/dist"),
        gui,
    })
}

fn home_dir() -> PathBuf {
    std::env::var_os("HOME")
        .or_else(|| std::env::var_os("USERPROFILE"))
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("."))
}

fn login_path() -> Option<String> {
    let shell = if Path::new("/bin/zsh").is_file() {
        "/bin/zsh"
    } else if Path::new("/bin/bash").is_file() {
        "/bin/bash"
    } else {
        return None;
    };
    let print = if shell.ends_with("zsh") {
        "print -r -- \"$PATH\""
    } else {
        "printf %s \"$PATH\""
    };
    let output = Command::new(shell).args(["-lc", print]).output().ok()?;
    let text = String::from_utf8_lossy(&output.stdout);
    text.lines()
        .rev()
        .find(|line| line.contains('/'))
        .map(|line| line.to_string())
}

#[cfg(unix)]
fn link_pi_peers(prefix: &Path, node: &Path) {
    let Some(global) = node
        .parent()
        .and_then(|bin| bin.parent())
        .map(|root| root.join("lib/node_modules"))
    else {
        return;
    };
    let dest_root = prefix.join("node_modules/@earendil-works");
    if fs::create_dir_all(&dest_root).is_err() {
        return;
    }
    for pkg in ["pi-coding-agent", "pi-ai"] {
        let dest = dest_root.join(pkg);
        let candidates = [
            global.join("@earendil-works").join(pkg),
            global
                .join("@earendil-works/pi-coding-agent/node_modules/@earendil-works")
                .join(pkg),
        ];
        if let Some(src) = candidates.iter().find(|path| path.is_dir()) {
            let _ = fs::remove_file(&dest);
            let _ = std::os::unix::fs::symlink(src, &dest);
        } else if dest
            .symlink_metadata()
            .map(|meta| meta.file_type().is_symlink())
            .unwrap_or(false)
        {
            let _ = fs::remove_file(&dest);
        }
    }
}

#[cfg(not(unix))]
fn link_pi_peers(_prefix: &Path, _node: &Path) {}

fn spawn_sidecar(prefix: &Path) -> Result<Child, String> {
    let launch = launch_plan(prefix)?;
    if launch.gui && !launch.node.is_file() {
        return Err("Mohou needs Node.js 22+ . Install it from https://nodejs.org and open Mohou again.".to_string());
    }
    let mut cmd = Command::new(&launch.node);
    cmd.arg("--import")
        .arg("tsx")
        .arg(&launch.entry)
        .current_dir(prefix)
        .env("PATH", &launch.path)
        .env("MINI_APP_SUPERVISED", "1")
        .env("MINI_APP_PANEL", &launch.panel)
        .env("MINI_APP_RUNTIME", &launch.runtime)
        .env(
            "NODE_USE_SYSTEM_CA",
            std::env::var("NODE_USE_SYSTEM_CA").unwrap_or_else(|_| "1".to_string()),
        )
        .env_remove("MINI_APP_SKIP_WINDOW")
        .env_remove("MINI_APP_WINDOW")
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::inherit());
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        cmd.process_group(0);
    }
    cmd.spawn()
        .map_err(|error| format!("could not start Node: {error}"))
}

enum OriginRead {
    Ready(Url),
    Exited(Option<i32>),
    TimedOut,
}

fn read_origin(stdout: impl std::io::Read + Send + 'static, child: &mut Child) -> OriginRead {
    let (tx, rx) = mpsc::channel();
    thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            let Ok(line) = line else { break };
            let trimmed = line.trim();
            if let Ok(url) = admit_origin(trimmed) {
                let _ = tx.send(url);
            } else if !trimmed.is_empty() {
                eprintln!("{trimmed}");
            }
        }
    });
    let started = Instant::now();
    loop {
        match rx.recv_timeout(Duration::from_millis(200)) {
            Ok(url) => return OriginRead::Ready(url),
            Err(RecvTimeoutError::Timeout) => {
                if started.elapsed() > READY_LIMIT {
                    return OriginRead::TimedOut;
                }
                match child.try_wait() {
                    Ok(Some(status)) => return OriginRead::Exited(status.code()),
                    Ok(None) => {}
                    Err(_) => return OriginRead::Exited(None),
                }
            }
            Err(RecvTimeoutError::Disconnected) => match child.try_wait() {
                Ok(Some(status)) => return OriginRead::Exited(status.code()),
                Ok(None) => return OriginRead::Exited(None),
                Err(_) => return OriginRead::Exited(None),
            },
        }
    }
}

#[cfg(unix)]
pub fn watch_signals(pid: Arc<AtomicU32>, closing: Arc<AtomicBool>, app: AppHandle) {
    let Ok(mut signals) = signal_hook::iterator::Signals::new([
        signal_hook::consts::SIGINT,
        signal_hook::consts::SIGTERM,
    ]) else {
        return;
    };
    for _ in signals.forever() {
        closing.store(true, Ordering::SeqCst);
        stop_process(pid.load(Ordering::SeqCst));
        app.exit(0);
        break;
    }
}

pub fn stop_process(pid: u32) {
    if pid == 0 {
        return;
    }
    #[cfg(unix)]
    unsafe {
        libc::kill(-(pid as i32), libc::SIGTERM);
    }
    #[cfg(windows)]
    {
        let _ = Command::new("taskkill")
            .args(["/PID", &pid.to_string(), "/T", "/F"])
            .status();
    }
    thread::spawn(move || {
        thread::sleep(Duration::from_secs(2));
        #[cfg(unix)]
        unsafe {
            libc::kill(-(pid as i32), libc::SIGKILL);
        }
    });
}

fn tell_user(message: &str, gui: bool) {
    eprintln!("{message}");
    if !gui {
        return;
    }
    #[cfg(target_os = "macos")]
    {
        let text = message.replace('"', "'");
        let script = format!(
            "display dialog \"{text}\" buttons {{\"OK\"}} default button 1 with title \"Mohou\""
        );
        let _ = Command::new("osascript").arg("-e").arg(script).status();
    }
}

pub fn supervise(
    prefix: PathBuf,
    pid: Arc<AtomicU32>,
    closing: Arc<AtomicBool>,
    origin_slot: Arc<Mutex<Option<Url>>>,
    app: AppHandle,
) {
    let gui = is_app_bundle(&prefix);
    loop {
        if closing.load(Ordering::SeqCst) {
            app.exit(0);
            return;
        }
        let mut child = match spawn_sidecar(&prefix) {
            Ok(child) => child,
            Err(message) => {
                tell_user(&message, gui);
                app.exit(1);
                return;
            }
        };
        pid.store(child.id(), Ordering::SeqCst);
        if closing.load(Ordering::SeqCst) {
            stop_process(child.id());
            let _ = child.wait();
            app.exit(0);
            return;
        }
        let Some(stdout) = child.stdout.take() else {
            tell_user("could not read the sidecar", gui);
            app.exit(1);
            return;
        };
        let url = match read_origin(stdout, &mut child) {
            OriginRead::Ready(url) => url,
            OriginRead::Exited(code) => {
                pid.store(0, Ordering::SeqCst);
                match child_stop(code) {
                    ChildStop::Restart => continue,
                    ChildStop::Exit(code) => {
                        tell_user("Mohou's sidecar exited before it was ready.", gui);
                        app.exit(code);
                        return;
                    }
                }
            }
            OriginRead::TimedOut => {
                stop_process(child.id());
                let _ = child.wait();
                tell_user("Mohou did not become ready.", gui);
                app.exit(1);
                return;
            }
        };
        if let Ok(mut slot) = origin_slot.lock() {
            *slot = Some(url.clone());
        }
        let app_nav = app.clone();
        let url_nav = url;
        let _ = app.run_on_main_thread(move || {
            if let Some(window) = app_nav.get_webview_window("main") {
                let _ = window.navigate(url_nav);
            }
        });
        let status = child.wait();
        pid.store(0, Ordering::SeqCst);
        if closing.load(Ordering::SeqCst) {
            app.exit(0);
            return;
        }
        let code = status.ok().and_then(|status| status.code());
        match child_stop(code) {
            ChildStop::Restart => continue,
            ChildStop::Exit(code) => {
                app.exit(code);
                return;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{child_stop, find_node, is_app_bundle, prefix_from_exe, prepend_path, runtime_dir, shell_entry, ChildStop, RESTART_EXIT};
    use std::fs;
    use std::path::Path;

    #[test]
    fn restart_code_is_75_and_a_signal_exits() {
        assert_eq!(RESTART_EXIT, 75);
        assert!(matches!(child_stop(Some(75)), ChildStop::Restart));
        assert!(matches!(child_stop(Some(0)), ChildStop::Exit(0)));
        assert!(matches!(child_stop(None), ChildStop::Exit(1)));
    }

    #[test]
    fn prefix_follows_the_app_bundle_and_a_sibling_directory() {
        let root = std::env::temp_dir().join(format!("mohou-prefix-{}", std::process::id()));
        let _ = fs::remove_dir_all(&root);
        let bundle = root.join("Mohou.app/Contents/Resources/prefix/node_modules/@mini-app/shell/src");
        fs::create_dir_all(&bundle).unwrap();
        fs::write(bundle.join("dev.ts"), "export {}\n").unwrap();
        let exe = root.join("Mohou.app/Contents/MacOS/Mohou");
        fs::create_dir_all(exe.parent().unwrap()).unwrap();
        fs::write(&exe, "").unwrap();
        let found = prefix_from_exe(&exe).unwrap();
        assert!(shell_entry(&found).is_file());
        assert!(is_app_bundle(&found));
        assert_eq!(
            runtime_dir(&found, None, Path::new("/Users/me")),
            Path::new("/Users/me/.mini-app/runtime")
        );
        assert_eq!(
            runtime_dir(&found, Some("/tmp/rt"), Path::new("/Users/me")),
            Path::new("/tmp/rt")
        );

        let local = root.join("local/prefix/node_modules/@mini-app/shell/src");
        fs::create_dir_all(&local).unwrap();
        fs::write(local.join("dev.ts"), "export {}\n").unwrap();
        let local_exe = root.join("local/Mohou");
        fs::write(&local_exe, "").unwrap();
        let sibling = prefix_from_exe(&local_exe).unwrap();
        assert!(!is_app_bundle(&sibling));
        let runtime = runtime_dir(&sibling, None, Path::new("/Users/me"));
        assert_eq!(runtime.file_name().unwrap(), "runtime");
        assert_eq!(runtime.parent().unwrap().file_name().unwrap(), "local");
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn finds_an_executable_node_and_prepends_its_bin() {
        let root = std::env::temp_dir().join(format!("mohou-node-{}", std::process::id()));
        let _ = fs::remove_dir_all(&root);
        let bin = root.join("bin");
        fs::create_dir_all(&bin).unwrap();
        let node = bin.join(if cfg!(windows) { "node.exe" } else { "node" });
        fs::write(&node, "").unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mut permissions = fs::metadata(&node).unwrap().permissions();
            permissions.set_mode(0o755);
            fs::set_permissions(&node, permissions).unwrap();
        }
        let found = find_node(&bin.display().to_string(), &root).unwrap();
        assert_eq!(found, node);
        let joined = prepend_path("/usr/bin", &bin.display().to_string());
        assert!(joined.starts_with(&bin.display().to_string()));
        assert_eq!(prepend_path(&joined, &bin.display().to_string()), joined);
        let _ = fs::remove_dir_all(&root);
    }
}
