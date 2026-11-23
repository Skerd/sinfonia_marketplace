import type {PortalContribution, PortalPrefetchTarget} from "@coreModule/helpers/types/portalContribution.types.ts";
import type {HttpRequest} from "@coreModule/helpers/types/httpRequest.types.ts";
import {prefetchHttpRequest} from "@coreModule/helpers/apiClient/responseCache.ts";
import {SERVICES_CONFIG_REQUEST} from "@marketplaceModule/clients/client/public/shared/servicesConfigContext.tsx";
import {LISTING_REQUEST} from "@marketplaceModule/clients/client/public/service/serviceRequest.ts";
import {TASK_REQUEST} from "@marketplaceModule/clients/client/public/tasks/taskRequest.ts";
import {SERVICE_ORDERS_REQUEST, serviceOrdersRequestBody} from "@marketplaceModule/clients/client/public/account/serviceOrders/serviceOrdersRequest.ts";
import {JOBS_REQUEST, jobsRequestBody} from "@marketplaceModule/clients/client/public/account/jobs/jobsRequest.ts";
import ServicesSiteRoutes from "@marketplaceModule/clients/client/public/shared/servicesSiteRoutes.tsx";
import TasksSiteRoutes from "@marketplaceModule/clients/client/public/tasks/tasksSiteRoutes.tsx";
import ServicesAccountLinks from "./servicesAccountLinks.tsx";
import TasksAccountLinks from "./tasksAccountLinks.tsx";
import ShopServiceFilters from "./shopServiceFilters.tsx";
import TaskFilters from "./taskFilters.tsx";
import PostJobBanner from "./postJobBanner.tsx";
import {IconTool} from "@tabler/icons-react";
import BusinessTypeSummary from "./businessTypeSummary.tsx";

/** A link to one of the sections' item pages (`/<page>?id=…`) about to be followed: the page's code, the services site's settings and the item. */
function prefetchItem({path, params}: PortalPrefetchTarget, page: string, loadPage: () => Promise<unknown>, request: HttpRequest) {
    const id = params.get("id");
    if (path !== page || !id) return;
    void loadPage();
    prefetchHttpRequest(SERVICES_CONFIG_REQUEST);
    prefetchHttpRequest(request, {id});
}

/** One of the buyer's own pages (behind sign-in): its code, and the first page of the list it opens with. */
type AccountPage = {matches: (path: string) => boolean; load: () => Promise<unknown>; list?: (params: URLSearchParams) => void};

const JOB_PAGES: AccountPage[] = [
    {
        matches: (path) => path === "/account/jobs",
        load: () => import("@marketplaceModule/clients/client/public/account/jobs/index.tsx"),
        list: (params) => prefetchHttpRequest(JOBS_REQUEST, jobsRequestBody(params)),
    },
    {matches: (path) => path === "/account/jobs/new", load: () => import("@marketplaceModule/clients/client/public/account/jobs/newJob.tsx")},
    {matches: (path) => /^\/account\/jobs\/[^/]+$/.test(path), load: () => import("@marketplaceModule/clients/client/public/account/jobs/jobDetail.tsx")},
];

const SERVICE_ACCOUNT_PAGES: AccountPage[] = [
    {
        matches: (path) => path === "/account/orders",
        load: () => import("@marketplaceModule/clients/client/public/account/serviceOrders/index.tsx"),
        list: (params) => prefetchHttpRequest(SERVICE_ORDERS_REQUEST, serviceOrdersRequestBody(params)),
    },
    {matches: (path) => /^\/account\/orders\/[^/]+$/.test(path), load: () => import("@marketplaceModule/clients/client/public/account/serviceOrders/serviceOrderDetail.tsx")},
    ...JOB_PAGES,
];

/** A link to one of the buyer's own pages about to be followed: the account area's code, the page's, the settings and its list. */
function prefetchAccountPage({path, params}: PortalPrefetchTarget, loadLayout: () => Promise<unknown>, pages: readonly AccountPage[]) {
    const page = pages.find((candidate) => candidate.matches(path));
    if (!page) return;
    void loadLayout();
    void page.load();
    prefetchHttpRequest(SERVICES_CONFIG_REQUEST);
    page.list?.(params);
}

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
    prefetch: (target) => {
        prefetchItem(target, "/service", () => import("@marketplaceModule/clients/client/public/service/index.tsx"), LISTING_REQUEST);
        prefetchAccountPage(target, () => import("@marketplaceModule/clients/client/public/account/accountLayout.tsx"), SERVICE_ACCOUNT_PAGES);
    },
    // A person may create this kind of business on the portal (D178); the API declares the same key.
    businessType: {key: "marketplace", Icon: IconTool, Summary: BusinessTypeSummary},
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
    prefetch: (target) => {
        prefetchItem(target, "/task", () => import("@marketplaceModule/clients/client/public/tasks/taskPage.tsx"), TASK_REQUEST);
        prefetchAccountPage(target, () => import("@marketplaceModule/clients/client/public/tasks/tasksAccountLayout.tsx"), JOB_PAGES);
    },
};

export default [services, tasks];
