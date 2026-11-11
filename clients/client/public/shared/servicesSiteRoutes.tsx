import {lazy, Suspense} from "react";
import {Navigate, Route, Routes, useSearchParams} from "react-router-dom";
import ErrorBoundary from "@coreModule/components/custom/errors/errorBoundary.tsx";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import SitePageLayout from "@coreModule/clients/portal/shared/sitePageLayout.tsx";
import {RequireSession} from "@coreModule/clients/portal/shared/sessionRoutes.tsx";
import {ServicesConfigProvider} from "@marketplaceModule/clients/client/public/shared/servicesConfigContext.tsx";

const ServicePage = lazy(() => import("@marketplaceModule/clients/client/public/service/index.tsx"));
const ProviderPage = lazy(() => import("@marketplaceModule/clients/client/public/provider/index.tsx"));
const AccountLayout = lazy(() => import("@marketplaceModule/clients/client/public/account/accountLayout.tsx"));
const ServiceOrdersPage = lazy(() => import("@marketplaceModule/clients/client/public/account/serviceOrders/index.tsx"));
const ServiceOrderDetailPage = lazy(() => import("@marketplaceModule/clients/client/public/account/serviceOrders/serviceOrderDetail.tsx"));
const JobsPage = lazy(() => import("@marketplaceModule/clients/client/public/account/jobs/index.tsx"));
const NewJobPage = lazy(() => import("@marketplaceModule/clients/client/public/account/jobs/newJob.tsx"));
const NotFoundPage = lazy(() => import("@coreModule/clients/portal/notFound/index.tsx"));
const JobDetailPage = lazy(() => import("@marketplaceModule/clients/client/public/account/jobs/jobDetail.tsx"));

/**
 * The services' browse page is the portal's home catalog. `/services` and `/services/services` (which merchants
 * also link to) open it on the service kind, with their category and search.
 */
function ServicesCatalog() {
    const [params] = useSearchParams();
    const catalog = new URLSearchParams({kind: "service"});
    const category = params.get("category");
    const search = params.get("search");
    if (category) catalog.set("f.category", category);
    if (search) catalog.set("q", search);
    return <Navigate to={`/?${catalog}`} replace />;
}

/**
 * The services marketplace, under `/services` on every host: one company's services on its own site, every listed
 * provider company's on the apex.
 */
export default function ServicesSiteRoutes() {
    return (
        <ServicesConfigProvider>
            <Suspense fallback={<Loader />}>
                <Routes>
                    <Route element={<SitePageLayout />}>
                        <Route index element={<ServicesCatalog />} />
                        <Route path="services" element={<ServicesCatalog />} />
                        <Route path="service" element={<ErrorBoundary><ServicePage /></ErrorBoundary>} />
                        <Route path="provider" element={<ErrorBoundary><ProviderPage /></ErrorBoundary>} />
                        <Route path="account" element={<RequireSession />}>
                            <Route element={<AccountLayout />}>
                                <Route index element={<Navigate to="orders" replace />} />
                                <Route path="orders" element={<ErrorBoundary><ServiceOrdersPage /></ErrorBoundary>} />
                                <Route path="orders/:orderId" element={<ErrorBoundary><ServiceOrderDetailPage /></ErrorBoundary>} />
                                <Route path="jobs" element={<ErrorBoundary><JobsPage /></ErrorBoundary>} />
                                <Route path="jobs/new" element={<ErrorBoundary><NewJobPage /></ErrorBoundary>} />
                                <Route path="jobs/:jobId" element={<ErrorBoundary><JobDetailPage /></ErrorBoundary>} />
                            </Route>
                        </Route>
                        <Route path="*" element={<ErrorBoundary><NotFoundPage /></ErrorBoundary>} />
                    </Route>
                </Routes>
            </Suspense>
        </ServicesConfigProvider>
    );
}
