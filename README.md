# jguymon-website

Source for [jayguymon.com](https://jayguymon.com): a React + TypeScript single-page app served by an
ASP.NET Core backend-for-frontend (BFF), shipped as one Docker image.

## Architecture

- **`client/`**: React 19 + TypeScript, built with Vite. Tabbed layout with case studies, an embedded
  resume, and a contact form.
- **`server/`**: .NET 10 minimal API. Serves the built SPA as static files from the same origin and
  exposes `/api/*` routes. The only route today is `POST /api/contact`, which validates input, drops
  honeypot submissions, and sends mail through AWS SES v2.
- **Single image**: a multi-stage `Dockerfile` builds the client, publishes the server, and copies
  `dist/` into the server's `wwwroot`. Production and `docker compose up` run the same topology.
- **Hosting**: a VPS running Docker Compose behind Caddy, which handles automatic HTTPS.

### Design notes

- **Testable endpoint**: `ContactForm.cs` splits validation, email construction, and sending into
  pure, parameter-injected functions. The tests mock `IAmazonSimpleEmailServiceV2` and never start an
  ASP.NET host.
- **Lazy SES client**: the SES client resolves inside the handler body rather than as a delegate
  parameter, so honeypot and validation rejections never touch AWS credential resolution.
- **Scoped security headers**: `X-Frame-Options` and CSP apply only to HTML responses. A global
  `DENY` broke the page's same-origin PDF embed in production.
- **No stored cloud credentials in CI**: deploy settings live in GitHub secrets and variables.

## Running locally

```bash
# Full stack, production topology
docker compose up --build        # http://localhost:8080

# Or run the halves separately
cd server && dotnet run          # BFF + Swagger UI in Development
cd client && npm ci && npm run dev   # Vite dev server, proxies /api to the BFF
```

Sending real email from `/api/contact` needs AWS credentials with `ses:SendEmail`, provided through
the standard AWS SDK credential chain. Without them, the endpoint returns `502` after validation
passes.

## Tests

```bash
dotnet test server.Tests/server.Tests.csproj   # xUnit + Moq
cd client && npm test                          # Vitest + Testing Library
```

CI (`.github/workflows/deploy.yml`) runs both suites on every PR and push to `main`. The deploy job
runs only after both pass, and only when a deploy target is configured.

### Deploy configuration

| Kind     | Name                 | Purpose                                         |
|----------|----------------------|-------------------------------------------------|
| variable | `DEPLOY_HOST`        | Server hostname or IP; deploy is skipped if unset |
| variable | `DEPLOY_USER`        | SSH user                                        |
| variable | `DEPLOY_PATH`        | Directory holding the server's compose file     |
| variable | `DEPLOY_SERVICE`     | Compose service to update (default `app`)       |
| secret   | `DEPLOY_SSH_KEY`     | Private key for the deploy user                 |
| secret   | `DEPLOY_KNOWN_HOSTS` | Pinned host key line(s) for the server          |
