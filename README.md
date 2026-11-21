# marketplace Module (Sinfonia)

Panel pages of the Arpeggio services marketplace (listings, task requests, bids, services orders and their milestones, deliveries, revisions, bookings, reviews, disputes, provider profiles, settings) and its public portal section `services` (service and provider pages, the buyer's service orders and jobs).

Contracts live in armonia at `armonia/src/modules/marketplace/`; the runtime in maestro at `maestro/modules/marketplace/`. Depends on `core` and `finance` only (D142). API calls target `/api/marketplace/*`; panel routes are `/marketplace/...`.

## Contributions

- **Sidebar** (`order: 36`): the "Marketplace" group.
- **Routes** (`order: 41`): `/marketplace/<resource>` and, under Tenancy → Configurations, `marketplacesettings`, `listingcategories`, `providerprofiles`.
- **Widgets**: the marketplace cards and sheets (`#ListingCard`, `#OrderCard`, `#BidCard`, …).
- **Tenancy settings**, **site rooms**, **account settings and nav** (the provider profile).
- **Portal** (`clients/portal/portalContribution.tsx`, two sections): section `services` at `/services`, catalog kind `service` with its category filter, and the account links; section `tasks` at `/tasks` (D172), the public task board on the apex and the operator's own site, catalog kind `task` with category and on-site/online filters (`taskFilters.tsx`), the post-a-job band, a public task page and the buyer's own tasks (the same pages as `/services/account/jobs`, which a provider's own site keeps for its private jobs). The site's pages (`clients/client/public/`) load `/api/marketplace/servicesConfig` once (`servicesConfigContext.tsx`); the seller card, inline sign-in, status pill, star row and money formatting are core portal parts.

| Services site path | Page |
|--------------------|------|
| `/services` | The home catalog on the service kind |
| `/services/service?id=` | A service listing |
| `/services/provider?id=` | A provider's page |
| `/services/account/orders`, `/orders/:orderId` | The buyer's service orders |
| `/services/account/jobs`, `/jobs/new`, `/jobs/:jobId` | The buyer's posted jobs and their bids |
| `/tasks` | The home catalog on the task kind (D172) |
| `/tasks/task?id=` | One task of the public board: facts, the approximate area, the quote count (average from three); on the apex "Posted on" the board and "Companies that quoted" (core seller cards, kinds `task` and `quote`, no prices) |
| `/tasks/account/jobs`, `/jobs/new`, `/jobs/:jobId` | The buyer's own tasks, under the board |
| panel `/marketplace/taskboard` | The task board in the panel: open public tasks, "Send a quote" (D172) |
