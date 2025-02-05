---
title: "E2E testing with LiveView 1.0, Cypress and Ecto sandboxes"
description: ""
date: "2025-02-05"
categories:
  - "Professional"
tags: ["practices"]
summary: Using swap can degrade performance so badly that the server might as well be down. Better to let it crash with OOM.
draft: true
---

# E2E testing with LiveView 1.0, Cypress and Ecto sandboxes

Conventitonal wisdom states that Given how fast LiveView is, writing tests in Cypress actually becomes fun. I was helped by the [sandbox documentation](https://hexdocs.pm/phoenix_ecto/Phoenix.Ecto.SQL.Sandbox.html) but was unable to get that approach to work.

# Setting up sandboxes

I run Cypress tests locally using `mix phx.server` to run Phoenix. By default Ecto sandboxes are not activated in dev, so that's the first thing we need to change.

`config/dev.exs`

```elixir

config :app, App.Repo,
  ...
+ pool: Ecto.Adapters.SQL.Sandbox
```

Ecto has premade endpoints for creating and destroying sandboxes which we need to add to our endpoint.

`lib/repejo_web/endpoint.ex`

```elixir
if Application.compile_env(:repejo, :dev_routes) do
  plug(Phoenix.Ecto.SQL.Sandbox,
    at: "/sandbox",
    header: "x-session-id",
    repo: Repejo.Repo
  )
end
```

Now we need to associate each request with with a sandbox. I added the following code to the `mount_current_user` plug.

`lib/repejo_web/user_auth.ex`

```elixir
Phoenix.Component.assign_new(socket, :phoenix_ecto_sandbox, fn ->
  if Phoenix.LiveView.connected?(socket) do
    metadata = Phoenix.LiveView.get_connect_params(socket)["x-session-id"]
    Phoenix.Ecto.SQL.Sandbox.allow(metadata, Ecto.Adapters.SQL.Sandbox)
    metadata
  end
end)
```

# Setting up the sandbox and intercepting requests in Cypress

Now that we have the backend plumbing set up we need to configure Cypress to use the sandbox. First we need to create a sandbox, then we will need to add the sandbox ID to each request sent from Cypress. We also need to add it to websocket connections.

`cypress/support/commands.ts`

```typescript
beforeEach(() => {
  const promise = fetch("/sandbox", {
    cache: "no-store",
    method: "POST",
  })
    .then((response) => response.text())
    .then((sessionId) => {
      // Store the ID on the window object so we can use that when connecting the LiveView socket
      Cypress.sessionId = sessionId;
      Cypress.env("sessionId", sessionId);
    });

  cy.wrap(promise).intercept("*", (req) => {
    req.headers["x-session-id"] = Cypress.env("sessionId");
  });
});
```

`assets/js/app.js`

```javascript
let liveSocket = new LiveSocket("/live", Socket, {
  longPollFallbackMs: 2500,
- params: { _csrf_token: csrfToken },
+ params: { _csrf_token: csrfToken, "x-session-id": window.sessionId },
});
```

Lastly we need to do teardown after each test. If you start getting errors along the line of `[error] Postgrex.Protocol (#PID<0.343.0>) disconnected: ** (DBConnection.ConnectionError) owner #PID<0.776.0> timed out because it owned the connection for longer than 120000ms (set via the :ownership_timeout option)` you probably have a problem with sandboxes not being destroyed correctly after each test.

`cypress/support/commands.ts`

```typescript
afterEach(async () => {
  cy.wrap(
    fetch("/sandbox", {
      method: "DELETE",
      headers: { "x-session-id": Cypress.env("sessionId") },
    })
  );
});
```
