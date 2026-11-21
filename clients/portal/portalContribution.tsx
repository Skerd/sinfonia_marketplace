import type {PortalContribution} from "@coreModule/helpers/types/portalContribution.types.ts";
import ServicesSiteRoutes from "@marketplaceModule/clients/client/public/shared/servicesSiteRoutes.tsx";
import TasksSiteRoutes from "@marketplaceModule/clients/client/public/tasks/tasksSiteRoutes.tsx";
import ServicesAccountLinks from "./servicesAccountLinks.tsx";
import TasksAccountLinks from "./tasksAccountLinks.tsx";
import ShopServiceFilters from "./shopServiceFilters.tsx";
import TaskFilters from "./taskFilters.tsx";
import PostJobBanner from "./postJobBanner.tsx";

/**
 * The services marketplace on the portal: every listed provider company's services on the apex, one company's on its
 * own site, with "post a job" on top of the services tab.
 */
const services: PortalContribution = {
    id: "services",
    order: 15,
    section: "services",
    path: "services",
    SectionSite: ServicesSiteRoutes,
    catalogs: [{kind: "service", Filters: ShopServiceFilters, Intro: PostJobBanner}],
    AccountSection: ServicesAccountLinks,
};

/**
 * The public task board (D172): the open tasks clients posted, on the apex and the operator's own site, where anyone
 * browses them and posts one; services companies quote on them.
 */
const tasks: PortalContribution = {
    id: "tasks",
    order: 16,
    section: "tasks",
    path: "tasks",
    SectionSite: TasksSiteRoutes,
    catalogs: [{kind: "task", Filters: TaskFilters, Intro: PostJobBanner}],
    AccountSection: TasksAccountLinks,
};

export default [services, tasks];
