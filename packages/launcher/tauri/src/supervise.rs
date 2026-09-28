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
    for candidate in [
        dir.join("../Resources/prefix"),
        dir.join("Resources/prefix"),
        dir.join("prefix"),
    ] {
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
    let candidates = node_candidates(path_env, home);
    // Pi is an optional global peer. Prefer a Node that actually has it so a
    // saved `runtimeProvider: pi` can boot. Otherwise keep the first Node.
    candidates
        .iter()
        .find(|node| has_pi_peer(node, home))
        .cloned()
        .or_else(|| candidates.into_iter().next())
}

fn node_candidates(path_env: &str, home: &Path) -> Vec<PathBuf> {
    let mut found = Vec::new();
    let mut push = |candidate: PathBuf| {
        if is_exec(&candidate) && !found.iter().any(|item| item == &candidate) {
            found.push(candidate);
        }
    };
    for dir in path_env.split(path_sep()).filter(|dir| !dir.is_empty()) {
        push(Path::new(dir).join(node_file_name()));
    }
    #[cfg(unix)]
    {
        for node in nvm_nodes(home) {
            push(node);
        }
    }
    #[cfg(windows)]
    {
        for node in nvm_windows_nodes(home) {
            push(node);
        }
        if let Some(programs) = std::env::var_os("ProgramFiles") {
            push(PathBuf::from(programs).join("nodejs").join("node.exe"));
        }
    }
    for dir in ["/opt/homebrew/bin", "/usr/local/bin"] {
        push(Path::new(dir).join(node_file_name()));
    }
    found
}

/// Global module roots for one Node. Unix installs use `lib/node_modules`.
/// Windows installs use the directory beside `node.exe`, and npm's user prefix.
fn module_roots(node: &Path, home: &Path) -> Vec<PathBuf> {
    let mut roots = Vec::new();
    if let Some(dir) = node.parent() {
        if let Some(prefix) = dir.parent() {
            roots.push(prefix.join("lib/node_modules"));
        }
        roots.push(dir.join("node_modules"));
        roots.push(dir.join("lib/node_modules"));
    }
    roots.push(home.join("AppData").join("Roaming").join("npm").join("node_modules"));
    if let Some(appdata) = std::env::var_os("APPDATA") {
        let prefixed = PathBuf::from(appdata).join("npm").join("node_modules");
        if !roots.iter().any(|item| item == &prefixed) {
            roots.push(prefixed);
        }
    }
    roots
}

fn has_pi_peer(node: &Path, home: &Path) -> bool {
    module_roots(node, home)
        .iter()
        .any(|global| pi_package(global, "pi-coding-agent").is_some())
}

fn pi_package(global: &Path, pkg: &str) -> Option<PathBuf> {
    let direct = global.join("@earendil-works").join(pkg);
    if direct.is_dir() {
        return Some(direct);
    }
    let nested = global
        .join("@earendil-works/pi-coding-agent/node_modules/@earendil-works")
        .join(pkg);
    nested.is_dir().then_some(nested)
}

fn version_nodes(root: &Path, file_name: &str) -> Vec<PathBuf> {
    let Ok(entries) = fs::read_dir(root) else {
        return Vec::new();
    };
    let mut names: Vec<_> = entries.filter_map(|entry| entry.ok()).collect();
    names.sort_by_key(|entry| entry.file_name());
    names.reverse();
    names
        .into_iter()
        .filter_map(|entry| {
            let name = entry.file_name();
            let name = name.to_string_lossy();
            if !(name.starts_with("v22") || name.starts_with("v24")) {
                return None;
            }
            let candidate = entry.path().join(file_name);
            is_exec(&candidate).then_some(candidate)
        })
        .collect()
}

#[cfg(unix)]
fn nvm_nodes(home: &Path) -> Vec<PathBuf> {
    version_nodes(&home.join(".nvm/versions/node"), "node")
}

#[cfg(windows)]
fn nvm_windows_nodes(home: &Path) -> Vec<PathBuf> {
    let mut roots = Vec::new();
    if let Some(nvm_home) = std::env::var_os("NVM_HOME") {
        roots.push(PathBuf::from(nvm_home));
    }
    roots.push(home.join("AppData").join("Roaming").join("nvm"));
    if let Some(programs) = std::env::var_os("ProgramFiles") {
        roots.push(PathBuf::from(programs).join("nvm"));
    }
    let mut nodes = Vec::new();
    for root in roots {
        nodes.extend(version_nodes(&root, "node.exe"));
    }
    nodes
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
    link_pi_peers(prefix, &node, &home, &base_path);
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

fn link_pi_peers(prefix: &Path, node: &Path, home: &Path, path_env: &str) {
    let dest_root = prefix.join("node_modules/@earendil-works");
    if fs::create_dir_all(&dest_root).is_err() {
        return;
    }
    let roots = pi_search_roots(node, home, path_env);
    for pkg in ["pi-coding-agent", "pi-ai"] {
        let dest = dest_root.join(pkg);
        if let Some(src) = roots.iter().find_map(|global| pi_package(global, pkg)) {
            place_peer_link(&dest, &src);
        }
    }
}

fn pi_search_roots(node: &Path, home: &Path, path_env: &str) -> Vec<PathBuf> {
    let mut roots = module_roots(node, home);
    let mut push = |root: PathBuf| {
        if root.is_dir() && !roots.iter().any(|item| item == &root) {
            roots.push(root);
        }
    };
    for candidate in node_candidates(path_env, home) {
        for root in module_roots(&candidate, home) {
            push(root);
        }
    }
    #[cfg(unix)]
    if let Ok(entries) = fs::read_dir(home.join(".nvm/versions/node")) {
        for entry in entries.flatten() {
            push(entry.path().join("lib/node_modules"));
        }
    }
    roots
}

fn remove_peer_link(dest: &Path) {
    let Ok(meta) = dest.symlink_metadata() else {
        return;
    };
    if meta.file_type().is_symlink() {
        let _ = fs::remove_file(dest);
        return;
    }
    // A Windows junction is a directory reparse point, not a symlink.
    // remove_dir drops the link and leaves the target.
    let _ = fs::remove_dir(dest);
}

fn place_peer_link(dest: &Path, src: &Path) {
    remove_peer_link(dest);
    #[cfg(unix)]
    {
        let _ = std::os::unix::fs::symlink(src, dest);
    }
    #[cfg(windows)]
    {
        if !junction(dest, src) {
            let _ = std::os::windows::fs::symlink_dir(src, dest);
        }
    }
}

#[cfg(windows)]
fn junction(dest: &Path, src: &Path) -> bool {
    Command::new("cmd")
        .args(["/C", "mklink", "/J"])
        .arg(dest)
        .arg(src)
        .status()
        .map(|status| status.success())
        .unwrap_or(false)
}

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
    let child = cmd
        .spawn()
        .map_err(|error| format!("could not start Node: {error}"))?;
    // process_group(0) keeps grandchildren killable, but then a dead parent
    // does not take the sidecar with it. A watcher notices that and kills the group.
    spawn_parent_watch(child.id());
    Ok(child)
}

fn spawn_parent_watch(child_pid: u32) {
    let parent = std::process::id();
    #[cfg(unix)]
    {
        let script = format!(
            "while kill -0 {parent} 2>/dev/null; do sleep 0.2; done; kill -TERM -{child_pid} 2>/dev/null; kill -KILL -{child_pid} 2>/dev/null"
        );
        // Own process group so a SIGKILL of Mohou does not take the watcher with it.
        let _ = {
            use std::os::unix::process::CommandExt;
            Command::new("/bin/sh")
                .arg("-c")
                .arg(script)
                .stdin(Stdio::null())
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .process_group(0)
                .spawn()
        };
    }
    #[cfg(windows)]
    {
        let script = format!(
            "while (Get-Process -Id {parent} -ErrorAction SilentlyContinue) {{ Start-Sleep -Milliseconds 200 }}; taskkill /PID {child_pid} /T /F | Out-Null"
        );
        let _ = Command::new("powershell")
            .args(["-NoProfile", "-WindowStyle", "Hidden", "-Command", &script])
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn();
    }
}

enum OriginRead {
    Ready(Url, mpsc::Receiver<Url>),
    Exited(Option<i32>),
    TimedOut,
}

fn follow_origins(app: AppHandle, follow: mpsc::Receiver<Url>) {
    thread::spawn(move || {
        while let Ok(next) = follow.recv() {
            let app_nav = app.clone();
            let _ = app.run_on_main_thread(move || {
                if let Some(window) = app_nav.get_webview_window("main") {
                    let _ = window.navigate(next);
                }
            });
        }
    });
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
            Ok(url) => return OriginRead::Ready(url, rx),
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

/// Sidecar writes this, then exits 75. Install after it has released native modules.
fn apply_pending_update(prefix: &Path, gui: bool) {
    let path = prefix.join("update.json");
    let Ok(text) = fs::read_to_string(&path) else {
        return;
    };
    let value: serde_json::Value = match serde_json::from_str(&text) {
        Ok(value) => value,
        Err(_) => {
            let _ = fs::remove_file(&path);
            return;
        }
    };
    let Some(args) = value.get("args").and_then(|item| item.as_array()) else {
        let _ = fs::remove_file(&path);
        return;
    };
    let args: Vec<String> = args.iter().filter_map(|item| item.as_str().map(str::to_string)).collect();
    let npm = if cfg!(windows) { "npm.cmd" } else { "npm" };
    let status = Command::new(npm).args(&args).current_dir(prefix).status();
    let _ = fs::remove_file(&path);
    if !status.map(|item| item.success()).unwrap_or(false) {
        tell_user("Mohou could not install the update.", gui);
    }
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
        apply_pending_update(&prefix, gui);
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
            OriginRead::Ready(url, follow) => {
                follow_origins(app.clone(), follow);
                url
            }
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

        let win = root.join("win/Mohou.exe");
        let win_prefix = root.join("win/Resources/prefix/node_modules/@mini-app/shell/src");
        fs::create_dir_all(&win_prefix).unwrap();
        fs::write(win_prefix.join("dev.ts"), "export {}\n").unwrap();
        fs::create_dir_all(win.parent().unwrap()).unwrap();
        fs::write(&win, "").unwrap();
        let win_found = prefix_from_exe(&win).unwrap();
        assert!(is_app_bundle(&win_found));
        assert_eq!(
            runtime_dir(&win_found, None, Path::new("/Users/me")),
            Path::new("/Users/me/.mini-app/runtime")
        );
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

        let plain = root.join("plain/bin");
        let with_pi = root.join("with-pi/bin");
        fs::create_dir_all(&plain).unwrap();
        fs::create_dir_all(&with_pi).unwrap();
        let plain_node = plain.join("node");
        let pi_node = with_pi.join("node");
        fs::write(&plain_node, "").unwrap();
        fs::write(&pi_node, "").unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            for path in [&plain_node, &pi_node] {
                let mut permissions = fs::metadata(path).unwrap().permissions();
                permissions.set_mode(0o755);
                fs::set_permissions(path, permissions).unwrap();
            }
        }
        fs::create_dir_all(
            root.join("with-pi/lib/node_modules/@earendil-works/pi-coding-agent"),
        )
        .unwrap();
        let path = format!("{}:{}", plain.display(), with_pi.display());
        assert_eq!(find_node(&path, &root).unwrap(), pi_node);
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn finds_pi_in_the_windows_user_npm_prefix() {
        let root = std::env::temp_dir().join(format!("mohou-npm-prefix-{}", std::process::id()));
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
        let home = root.join("home");
        fs::create_dir_all(
            home.join("AppData/Roaming/npm/node_modules/@earendil-works/pi-coding-agent"),
        )
        .unwrap();
        assert_eq!(find_node(&bin.display().to_string(), &home).unwrap(), node);
        let _ = fs::remove_dir_all(&root);
    }
}
