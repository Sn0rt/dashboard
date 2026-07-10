# Resource-first dashboard foundation with tRPC

## Status

Proposed

## Context

The dashboard already uses a TypeScript monorepo and tRPC for its UI contract. New dashboard features also need to model Kubernetes and Volcano resources consistently across list, detail, mutation, streaming, and future transport adapters.

Keeping Kubernetes calls and resource semantics inside individual tRPC procedures would make procedure shapes the domain model and would encourage duplicated logic if another transport is added later.

## Decision

- Keep `apps/web`, `packages/trpc`, and tRPC as the Dashboard UI transport.
- Represent resource identity independently from transport using API group, version, resource, namespace, name, and optional subresource.
- Put Kubernetes client calls, pagination, validation, and error mapping in `packages/trpc/server/resources`.
- Keep tRPC routers focused on input validation and adapting the shared resource layer to the existing `AppRouter` contract.
- Preserve existing tRPC procedure names and response shapes during this refactor.
- Use dedicated Route Handlers or WebSockets only for protocol-oriented flows such as log streaming, Terminal, and SSO callbacks. Those adapters must reuse the shared resource layer.
- Treat a future REST/OpenAPI surface as an optional adapter over the same layer, not as a second implementation.

The dashboard page hierarchy is organized by product area:

- `/dashboard`
- `/scheduling/jobs`
- `/scheduling/podgroups`
- `/scheduling/queues`
- `/workload/pods`

Additional scheduling and system pages will be added with the feature PR that implements them.

## PR 1 parity checklist

### Routes

- Baseline: `/dashboard`, `/scheduling/*`, `/workload/*`, `/system/*`, and `/documentation`.
- Current upstream: `/`, `/jobs`, `/podgroups`, `/queues`, and `/pods`.
- This PR: move the existing pages to `/dashboard`, `/scheduling/jobs`, `/scheduling/podgroups`, `/scheduling/queues`, and `/workload/pods`; redirect `/` to `/dashboard`.
- Deferred: CronJobs, configuration, cluster information, and documentation pages remain with their feature PRs.

### Components

- Baseline: grouped Dashboard navigation and breadcrumbs.
- Current upstream: a flat sidebar backed by `navItems`.
- This PR: group existing navigation entries into Overview, Scheduling, and Workloads and highlight nested routes correctly.
- Deferred: responsive drawer redesign, account controls, read-only banner, and feature-specific UI.

### Resource behavior

- Baseline: resource operations share Kubernetes-aware identity and behavior.
- Current upstream: Jobs, Pods, PodGroups, Queues, and Dashboard routers call Kubernetes clients directly.
- This PR: move resource operations behind shared services while retaining the existing tRPC contract.
- Deferred: new YAML, Events, Queue metrics, logs, Terminal, and authentication operations.

### Files to change

- `packages/trpc/server/resources/**`
- `packages/trpc/server/router/**`
- `apps/web/constants/index.ts`
- `apps/web/src/app/**/page.tsx`
- `apps/web/src/components/navigation-menu.tsx`
- `docs/adr/0001-resource-first-trpc-foundation.md`

## Consequences

- Feature PRs can add resource behavior without binding the domain model to a transport.
- Existing UI callers continue to use tRPC without a coordinated client migration.
- New transports must adapt the shared layer instead of duplicating Kubernetes operations.
- The first PR is primarily a compatibility refactor and route move; feature behavior remains in later PRs.
