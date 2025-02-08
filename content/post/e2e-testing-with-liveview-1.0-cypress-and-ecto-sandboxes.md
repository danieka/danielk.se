---
title: "E2E testing with LiveView 1.0, Cypress and Ecto sandboxes"
description: ""
date: "2025-02-05"
categories:
  - "Professional"
tags: ["practices"]
summary: How to set up E2E testing with LiveView 1.0, Cypress and Ecto sandboxes
unlisted: true
---

# E2E testing with LiveView 1.0, Cypress and Ecto sandboxes

Tests are great, and when it comes to confidence and peace of mind nothing is better than end-to-end tests. So let's write a test for LiveView using Cypress. Here is the simplest, useful, test that I could conceive of.

`cypress/e2e/spec.cy.js`

```javascript
describe("create account", () => {
  it("passes", () => {
    cy.visit("http://localhost:4000");
    cy.contains("Register").click();

    cy.contains("form div", "Email")
      .find("input")
      .type("userexample@mailinator.com");
    cy.contains("form div", "Password")
      .find("input")
      .type("areallylongpassword");

    cy.contains("Create an account").click();
    cy.contains("Account created successfully").should("be.visible");
  });
});
```

You can follow along in the [example repository](https://github.com/danieka/liveview-cypress-example) and run this test if you want. It works, but only once. The second time I try to run the test I get an error message: "This email has already been taken". Makes sense since we just created a user with that email.

We could solve this by generating a random email for each run of the test. We could also truncate all tables between runs. Both approaches work but have drawbacks. Or we could use Ecto sandboxes. Sandboxes allows us to isolate tests even if we're running them concurrently. All database changes made during tests are rolled back after the test is over, so each test starts from a known, good, database fixture.

## Setting up sandboxes

I run Cypress tests locally using `npx cypress open` and use `mix phx.server` to run Phoenix. By default Ecto sandboxes are not activated in dev, so that's the first thing we need to change. The relevant commit where I add sandboxes are [here](https://github.com/danieka/liveview-cypress-example/commit/885c890ee50780b22f3a8a4fe2bbf9bc05f27adb).

`config/dev.exs`

```elixir
config :app, App.Repo,
  ...
+ pool: Ecto.Adapters.SQL.Sandbox
```

Ecto has premade endpoints for creating and destroying sandboxes which we need to add to our endpoint.

`lib/app_web/endpoint.ex`

```elixir
if Application.compile_env(:app, :dev_routes) do
  plug(Phoenix.Ecto.SQL.Sandbox,
    at: "/sandbox",
    header: "x-session-id",
    repo: App.Repo
  )
end
```

Now we need to associate each request with with a sandbox. I added the following code to the `mount_current_user` plug but it's probably nicer to add it in a separate plug.

`lib/app_web/user_auth.ex`

```elixir
Phoenix.Component.assign_new(socket, :phoenix_ecto_sandbox, fn ->
  if Phoenix.LiveView.connected?(socket) do
    metadata = Phoenix.LiveView.get_connect_params(socket)["x-session-id"]
    Phoenix.Ecto.SQL.Sandbox.allow(metadata, Ecto.Adapters.SQL.Sandbox)
    metadata
  end
end)
```

## Setting up the sandbox and intercepting requests in Cypress

Now that we have the backend plumbing set up we need to configure Cypress to use the sandbox. First we need to create a sandbox, then we will need to add the sandbox ID to each request sent from Cypress. We also need to add it as a param to websocket connections that LiveView uses. It needs to be a param since it's not possible to send custom headers on websockets.

`cypress/support/commands.js`

```javascript
beforeEach(() => {
  const promise = fetch("/sandbox", {
    cache: "no-store",
    method: "POST",
  })
    .then((response) => response.text())
    .then((sessionId) => {
      Cypress.on("window:before:load", (win) => {
        win.sessionId = sessionId;
      });
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

## Wrapping up

The test should now run in a sandbox. But remember that if you created a user with the email above you will need to remove it from the database or the test will still fail with the same messages. Sandboxes only reset the database to the state the database was in when the sandbox was created.

One interesting use case for sandboxes and Cypress is running many e2e tests concurrently against one backend server. That backend server could even be an ordinary testing or staging server that has sandboxes enabled in this way.

And lastly, writing E2E tests for LiveView is truly a pleasure. One amazing aspect is how _fast_ the tests run. When compared with a Vue + Java app that I've worked on the LiveView tests are at least 10x faster.
