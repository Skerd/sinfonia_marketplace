import {lazy, Suspense} from "react";
import {Navigate, Route, Routes, useSearchParams} from "react-router-dom";
import ErrorBoundary from "@coreModule/components/custom/errors/errorBoundary.tsx";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import SitePageLayout from "@coreModule/clients/portal/shared/sitePageLayout.tsx";
import {RequireSession} from "@coreModule/clients/portal/shared/sessionRoutes.tsx";
import {ServicesConfigProvider} from "@marketplaceModule/clients/client/public/shared/servicesConfigContext.tsx";

const TaskPage = lazy(() => import("@marketplaceModule/clients/client/public/tasks/taskPage.tsx"));
const TasksAccountLayout = lazy(() => import("@marketplaceModule/clients/client/public/tasks/tasksAccountLayout.tsx"));
const JobsPage = lazy(() => import("@marketplaceModule/clients/client/public/account/jobs/index.tsx"));
const NewJobPage = lazy(() => import("@marketplaceModule/clients/client/public/account/jobs/newJob.tsx"));
const JobDetailPage = lazy(() => import("@marketplaceModule/clients/client/public/account/jobs/jobDetail.tsx"));
const NotFoundPage = lazy(() => import("@coreModule/clients/portal/notFound/index.tsx"));

/** The board's browse page is the portal's home catalog, on the task kind, with its category and search. */
function TasksCatalog() {
    const [params] = useSearchParams();
    const catalog = new URLSearchParams({kind: "task"});
    const category = params.get("category");
    const search = params.get("search");
    if (category) catalog.set("f.category", category);
    if (search) catalog.set("q", search);
    return <Navigate to={`/?${catalog}`} replace />;
}

/**
 * The public task board (D172), under `/tasks` on the apex and the operator's own site: the board, one task, and the
 * buyer's own tasks (the same pages as under `/services`, which a provider's own site keeps for its private tasks).
 */
export default function TasksSiteRoutes() {
    return (
        <ServicesConfigProvider>
            <Suspense fallback={<Loader />}>
                <Routes>
                    <Route element={<SitePageLayout />}>
                        <Route index element={<TasksCatalog />} />
                        <Route path="task" element={<ErrorBoundary><TaskPage /></ErrorBoundary>} />
                        <Route path="account" element={<RequireSession />}>
                            <Route element={<TasksAccountLayout />}>
                                <Route index element={<Navigate to="jobs" replace />} />
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
