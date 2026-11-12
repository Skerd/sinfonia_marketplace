import type {PortalContribution} from "@coreModule/helpers/types/portalContribution.types.ts";
import ServicesSiteRoutes from "@marketplaceModule/clients/client/public/shared/servicesSiteRoutes.tsx";
import ServicesAccountLinks from "./servicesAccountLinks.tsx";
import ShopServiceFilters from "./shopServiceFilters.tsx";
import PostJobBanner from "./postJobBanner.tsx";

/**
 * The services marketplace on the portal: every listed provider company's services on the apex, one company's on its
 * own site, with "post a job" on top of the services tab.
 */
const contribution: PortalContribution = {
    id: "services",
    order: 15,
    section: "services",
    path: "services",
    SectionSite: ServicesSiteRoutes,
    catalogs: [{kind: "service", Filters: ShopServiceFilters, Intro: PostJobBanner}],
    AccountSection: ServicesAccountLinks,
};

export default contribution;
