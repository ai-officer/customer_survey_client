# Contributing

Thanks for working on the Customer Survey client. This document covers branch naming, commit format, local checks, and how to open a pull request.

## Branch naming

Use a short, kebab-case slug prefixed by the change type:

- `feature/<slug>` — new user-facing capability (e.g. `feature/qr-invite-flow`)
- `fix/<slug>` — bug fix (e.g. `fix/login-redirect-loop`)
- `chore/<slug>` — tooling, dependencies, infra, non-user-facing cleanup
- `test/<slug>` — adding or updating tests
- `docs/<slug>` — documentation-only change
- `refactor/<slug>` — internal restructuring with no behavior change

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/). The first line is `<type>(optional scope): <imperative summary>`. Allowed types:

- `feat:` — new feature
- `fix:` — bug fix
- `chore:` — tooling, deps, infra
- `test:` — tests only
- `docs:` — docs only
- `refactor:` — internal refactor

Examples:

```
feat(survey): add QR-code invite scanner
fix(auth): keep redirect target across login refreshes
chore(infra): polish README and tighten .gitignore
```

Keep commits focused; squash WIP commits before opening a PR when it improves the history.

## Run checks locally

Before pushing:

```bash
yarn install --frozen-lockfile
yarn lint       # tsc --noEmit, must pass with no new errors
yarn build      # optional, sanity-check the production build
```

If you touch UI flows, run `yarn dev` and walk through the affected screens manually until automated tests are wired up.

## Opening a pull request

1. Push your branch to the remote.
2. Open a PR against `main`.
3. Fill out the PR template (`.github/pull_request_template.md`) — summary, type of change, test plan, and screenshots for UI changes.
4. Link any related issues and request a review from a CODEOWNER.
5. Make sure `yarn lint` passes locally and CI (when added) is green before merging.
