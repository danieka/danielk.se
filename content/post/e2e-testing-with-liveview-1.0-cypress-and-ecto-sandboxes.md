---
title: "E2E testing with LiveView 1.0, Cypress and Ecto sandboxes"
description: ""
date: "2025-02-11"
categories:
  - "Professional"
tags: ["practices"]
summary: How to set up E2E testing with LiveView 1.0, Cypress and Ecto sandboxes
---

# E2E testing with LiveView 1.0, Cypress and Ecto sandboxes

One of my main goals as tech lead at Flinker was that software development should be "boring". And by that I meant that it should be predictable and without surprises. To me, there is nothing more stressful than releasing critical bugs to production. So for at least the last ten years I've championed testing, especially end-to-end testing. End-to-end tests require the most effort to write and maintain but also give the highest confidence. Writing end-to-end tests is a direct investment in peace of mind and sleep quality. Cypress is the best end-to-end testing tool that I've worked with, but still, writing tests is somewhat complicated and tedious. The two biggest problems are slow-running tests and managing database state. This article is about how you can use Ecto sandboxes to run each test in an isolated database sandbox which always resets to a known state and does not interfere with other concurrent tests. You can follow along in the [example repository](https://github.com/danieka/liveview-cypress-example) and this [commit](https://github.com/danieka/liveview-cypress-example/commit/885c890ee50780b22f3a8a4fe2bbf9bc05f27adb) contains all changes needed to set up sandboxes.

So let's write a test for LiveView using Cypress. Here is an example of a test for creating an account. It's the simplest, but still useful, example that I could conceive of.

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

It works, but only once. The second time I try to run the test I get an error message: "This email has already been taken". Makes sense since we just created a user with that email. One of the basic rules of testing is that tests should be isolated.<sup>1</sup>. The tests currently mutates the database which prevents us from running it twice and it may also interfere with other tests. If the tests fail it may not be possible to rerun it since the database will not be in the same state as when the test was first run.

We can solve this issue in a number of ways:

1. We could generate a random email for each run as a test. This gets annoying after a while as the database fills up with bogus data from old test runs.
2. We could truncate all database tables between runs. This works fine, but truncating tables can be slow, especially if you have many tables. And after we have truncated the tables we probably need to reload a fixture of some kind. And with this approach it is impossible to run tests concurrently.
3. Ecto sandboxes!

Sandboxes allows us to isolate tests even if we're running them concurrently. All database changes made during tests are rolled back after the test is over, so each test starts from a known, good, database fixture.

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

Any tests not associated with a sandbox will mutate the database as any ordinary request would. HTTP requests are associated with a sandbox in the plug above, as long as the `x-session-id` header is set. But we also need to associate LiveView websocket connections with a sandbox. I did this using the `mount_current_user` plug, but a more proper way would be to add the logic to a separate plug to separate authentication and sandbox setup.

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

Now that we have the backend plumbing set up, we need to configure Cypress to use the sandbox. First we need to create a sandbox, then we need to associate the sandbox ID with each request sent from Cypress. We also need to add the sandbox ID as a param to the websocket connections that LiveView use. We are forced to pass them as params instead of headers, since it's not possible to send custom headers via Websockets.

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

We are nearly done! The last step is to do teardown after each test. We need to destroy the sandbox associated with each test. If we forget to do this, we will start getting errors along the line of `[error] Postgrex.Protocol (#PID<0.343.0>) disconnected: ** (DBConnection.ConnectionError) owner #PID<0.776.0> timed out because it owned the connection for longer than 120000ms (set via the :ownership_timeout option)` which we want to avoid.

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

We're all done! The test should now run in a sandbox. But remember that sandboxes only reset the database to the state the database was in when the sandbox was created! If you created a user with the email above you will need to remove it from the database or the test will still fail with the same messages"

One interesting use case for sandboxes and Cypress is running many e2e tests concurrently against one backend server. That backend server could even be an ordinary testing or staging server, so long as it has sandboxes enabled this way.

And lastly, writing E2E tests for LiveView is truly a pleasure. One amazing aspect is how _fast_ the tests run. When compared with a Vue + Java app that I've worked on the LiveView tests are at least 10x faster.

<div class="mt-16" />

Thanks to Andreas for providing feedback on this article.

1. Test-Driven Development by Kent Beck, p. 125, Isolated Test
