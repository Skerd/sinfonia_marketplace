# marketplace Module (Sinfonia)

Panel pages of the Arpeggio services marketplace (listings, task requests, bids, services orders and their milestones, deliveries, revisions, bookings, reviews, disputes, provider profiles, settings) and its public portal section `services` (service and provider pages, the buyer's service orders and jobs).

Contracts live in armonia at `armonia/src/modules/marketplace/`; the runtime in maestro at `maestro/modules/marketplace/`. Depends on `core` and `finance` only (D142). API calls target `/api/marketplace/*`; panel routes are `/marketplace/...`.

## Contributions

- **Sidebar** (`order: 36`): the "Marketplace" group.
- **Routes** (`order: 41`): `/marketplace/<resource>` and, under Tenancy → Configurations, `marketplacesettings`, `listingcategories`, `providerprofiles`.
- **Widgets**: the marketplace cards and sheets (`#ListingCard`, `#OrderCard`, `#BidCard`, …).
- **Tenancy settings**, **site rooms**, **account settings and nav** (the provider profile).
- **Portal** (`clients/portal/portalContribution.tsx`): section `services` at `/services`, catalog kind `service` with its category filter, and the account links. The site's pages (`clients/client/public/`) load `/api/marketplace/servicesConfig` once (`servicesConfigContext.tsx`); the seller card, inline sign-in, status pill, star row and money formatting are core portal parts.

| Services site path | Page |
|--------------------|------|
| `/services` | The home catalog on the service kind |
| `/services/service?id=` | A service listing |
| `/services/provider?id=` | A provider's page |
| `/services/account/orders`, `/orders/:orderId` | The buyer's service orders |
| `/services/account/jobs`, `/jobs/new`, `/jobs/:jobId` | The buyer's posted jobs and their bids |
