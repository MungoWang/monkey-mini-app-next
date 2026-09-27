# Versioning

The host keeps one commit tree per app (`runtime/apps/<appId>/.git`).

A successful `mini_app_reload` of a dirty tree commits. The message is the reload tool description. The agent writes source with its own file tools, then reloads.

| Tool | Purpose |
|---|---|
| `mini_app_history_commit({ appId, message })` | Close a `commit: false` batch; `message` is required |
| `mini_app_history_list({ appId })` | List commits |
| `mini_app_history_reset({ appId, commitId })` | Point main at a commit and keep a backup ref |

There is no revert tool. Reset does not delete objects. Single branch. Snapshots exclude `storage/`, `.git/`, `node_modules/`.

A whole-app delete is a panel action. There is no unregister tool.
