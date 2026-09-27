# Smoke tests

Use `mini_app_call({ appId, method, args })` or `calls: [{ method, args }]`. A batch is at most 20.

Do not curl the host. Do not bash against the loopback port. `ctx.http` is for the app talking to an external URL, not for the agent talking to Host.

`mini_app_reload` until `ok`. Then call the methods. Then `mini_app_open`. Then `mini_app_errors` and `mini_app_view_eval`. Compile green is not a running view.
