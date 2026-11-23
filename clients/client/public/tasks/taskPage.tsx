import {useEffect, useMemo, useState} from "react";
import {Link, useSearchParams} from "react-router-dom";
import {compose} from "redux";
import {IconChevronRight, IconMapPin, IconPhotoOff, IconWorld} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {DATE_FORMATS, formatDate} from "@coreModule/helpers/general/dateTime.ts";
import {resolvePublicMediaUrl} from "@coreModule/clients/portal/shared/portalMedia.ts";
import {usePortalSession} from "@coreModule/clients/portal/shared/portalSession.tsx";
import {usePortalSite} from "@coreModule/clients/portal/shared/portalSiteContext.tsx";
import {usePortalTitle} from "@coreModule/clients/portal/shared/portalTitle.ts";
import PortalSellerCard from "@coreModule/clients/portal/shared/portalSellerCard.tsx";
import {useSectionBase} from "@coreModule/clients/portal/shared/sectionBase.tsx";
import SheetLocationMap from "@coreModule/components/viewEngine/widgets/addresses/sheetLocationMap.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {useServicesConfig} from "@marketplaceModule/clients/client/public/shared/servicesConfigContext.tsx";
import ServiceStatus from "@marketplaceModule/clients/client/public/shared/serviceStatus.tsx";
import PortalQuotePanel from "./portalQuotePanel.tsx";
import {TASK_REQUEST} from "./taskRequest.ts";
import {useTaskUpdates} from "@marketplaceModule/helpers/hooks/useTaskLiveUpdates.ts";
import {taskRoom} from "armonia/src/modules/marketplace/websocket/types.ts";
import {JOB_AREA_RADIUS_M} from "armonia/src/modules/marketplace/helpers/jobArea.ts";
import type {ShopTaskResponse} from "armonia/src/modules/marketplace/api/marketplace/public/shopTask/shopTask.types.ts";
import {PortalKeepButton} from "@coreModule/clients/portal/shared/portalSaved.tsx";

const LANGUAGE_PATH = "src/modules/marketplace/clients/client/public/tasks/taskPage.tsx";

/**
 * One task of the public board (D172), for anyone: what the client needs, where roughly (the D148 area, never the
 * address), the budget, until when, and how the quoting goes (the count, and the average from three quotes on). On the
 * apex it names the board it is posted on and the companies that quoted, each with its site, like any seller.
 */
function TaskPage({resolveLanguageKey}: WithLanguageType) {
    const base = useSectionBase();
    const {formatMoney} = useServicesConfig();
    const {isAuthenticated} = usePortalSession();
    const {site} = usePortalSite();
    const [params] = useSearchParams();
    const id = params.get("id") ?? "";

    const [fetchCount, setFetchCount] = useState(0);
    useEffect(() => {
        if (id) setFetchCount((count) => count + 1);
    }, [id]);
    const body = useMemo(() => ({id}), [id]);
    const request = useHttpRequest<ShopTaskResponse>(TASK_REQUEST, body, fetchCount);
    // Live (D172): its count, average and status follow the quotes as they arrive, for signed-in visitors.
    useTaskUpdates(id ? taskRoom(id) : null, (update) => {
        if (update.taskId === id) setFetchCount((count) => count + 1);
    });
    const task = request.error ? null : request.data?.data ?? null;
    const gallery = useMemo(() => [task?.mainImage?._id, ...(task?.imageGallery ?? []).map((media) => media._id)]
        .filter((mediaId): mediaId is string => !!mediaId), [task]);
    const [activeImage, setActiveImage] = useState<string | undefined>();
    useEffect(() => setActiveImage(gallery[0]), [gallery]);

    // A refresh (a live quote, D172) keeps the task on screen; only a task not shown yet waits behind the placeholder.
    const showsThisTask = task?._id === id;
    usePortalTitle(showsThisTask ? task.title : request.loading || (fetchCount === 0 && id) ? undefined : resolveLanguageKey("notFoundTitle"));
    if ((request.loading && !showsThisTask) || (fetchCount === 0 && id)) {
        return <div className="h-96 animate-pulse rounded-3xl bg-muted" aria-busy="true" aria-label={resolveLanguageKey("loading")} />;
    }
    if (!task) {
        return (
            <div className="flex flex-col items-center gap-4 rounded-3xl bg-muted px-6 py-16 text-center">
                <p className="font-display text-xl font-semibold">{resolveLanguageKey("notFoundTitle")}</p>
                <p className="max-w-md text-muted-foreground">{resolveLanguageKey("notFoundMessage")}</p>
                <Button asChild size="lg"><Link to={base}>{resolveLanguageKey("browseTasks")}</Link></Button>
            </div>
        );
    }

    const place = task.address?.city?.name;
    const quotes = task.quotes.count === 0
        ? resolveLanguageKey("quotesNone")
        : resolveLanguageKey(task.quotes.count === 1 ? "quotesOne" : "quotesOther").replace("{count}", String(task.quotes.count));
    const postTarget = `${base}/account/jobs/new`;

    return (
        <div className="flex flex-col gap-6">
            <nav aria-label={resolveLanguageKey("breadcrumb")} className="text-sm text-muted-foreground">
                <ol className="flex flex-wrap items-center gap-1.5">
                    <li><Link to={base} className="hover:text-foreground">{resolveLanguageKey("tasks")}</Link></li>
                    {task.category && (
                        <>
                            <li aria-hidden><IconChevronRight className="h-3.5 w-3.5" /></li>
                            <li><Link to={`${base}?category=${encodeURIComponent(task.category.slug ?? "")}`} className="hover:text-foreground">{task.category.name}</Link></li>
                        </>
                    )}
                    <li aria-hidden><IconChevronRight className="h-3.5 w-3.5" /></li>
                    <li aria-current="page" className="max-w-[16rem] truncate text-foreground">{task.title}</li>
                </ol>
            </nav>

            {/* Columns may shrink below their content (minmax(0, …), min-w-0): the area map sizes itself to its box and would
                otherwise widen the page without end. */}
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-x-14">
                <div className="flex min-w-0 flex-col gap-10">
                    <div className="flex flex-col gap-3">
                        <div className="aspect-[4/3] w-full overflow-hidden rounded-3xl bg-muted">
                            {activeImage ? (
                                <img src={resolvePublicMediaUrl(activeImage)} alt={task.title} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                                    <IconPhotoOff className="h-8 w-8" aria-hidden />
                                    <span className="text-sm">{resolveLanguageKey("noImage")}</span>
                                </div>
                            )}
                        </div>
                        {gallery.length > 1 && (
                            <ul className="flex gap-2 overflow-x-auto">
                                {gallery.map((image, index) => (
                                    <li key={image} className="shrink-0">
                                        <Button
                                            type="button"
                                            variant="bare"
                                            onClick={() => setActiveImage(image)}
                                            aria-label={resolveLanguageKey("imageOf").replace("{number}", String(index + 1)).replace("{total}", String(gallery.length))}
                                            aria-pressed={activeImage === image}
                                            className={cn("block h-16 w-24 overflow-hidden rounded-xl border-2 transition-colors", activeImage === image ? "border-foreground" : "border-transparent hover:border-border")}
                                        >
                                            <img src={resolvePublicMediaUrl(image)} alt="" className="h-full w-full object-cover" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    {task.description && (
                        <section className="flex flex-col gap-3" aria-labelledby="public-task-about">
                            <h2 id="public-task-about" className="font-display text-2xl font-semibold tracking-tight">{resolveLanguageKey("about")}</h2>
                            <p className="whitespace-pre-line text-[16px] leading-relaxed text-muted-foreground">{task.description}</p>
                        </section>
                    )}
                </div>

                <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
                    <div className="flex flex-col gap-5 rounded-3xl border border-border p-6">
                        <div className="flex flex-col gap-2">
                            <ServiceStatus kind="jobStatus" value={task.status} />
                            <div className="flex items-start justify-between gap-4">
                                <h1 className="font-display text-3xl font-bold tracking-tight">{task.title}</h1>
                                {/* The task as the catalog's card lists it, for its heart (TD-F148). */}
                                <PortalKeepButton item={{kind: "task", id: task._id, section: "tasks", path: `/task?${new URLSearchParams({id: task._id})}`, title: task.title}} />
                            </div>
                            {task.category?.name ? <p className="text-sm text-muted-foreground">{task.category.name}</p> : null}
                        </div>
                        <PortalSellerCard sectionPath="tasks" seller={task.seller} kind="task" size="card" />
                        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
                            <dt className="text-muted-foreground">{resolveLanguageKey("where")}</dt>
                            <dd className="flex items-center justify-end gap-1.5 text-right">
                                {place ? <IconMapPin className="h-4 w-4 shrink-0" aria-hidden /> : <IconWorld className="h-4 w-4 shrink-0" aria-hidden />}
                                {place ? resolveLanguageKey("roughlyIn").replace("{city}", place) : resolveLanguageKey("online")}
                            </dd>
                            <dt className="text-muted-foreground">{resolveLanguageKey("budget")}</dt>
                            <dd className="text-right tabular-nums">
                                {task.budgetMax != null ? resolveLanguageKey("budgetUpTo").replace("{amount}", formatMoney(task.budgetMax, task.currency)) : resolveLanguageKey("budgetOpen")}
                            </dd>
                            {task.expiresAt ? (
                                <>
                                    <dt className="text-muted-foreground">{resolveLanguageKey("openUntil")}</dt>
                                    <dd className="text-right">{formatDate(task.expiresAt, {format: DATE_FORMATS.date})}</dd>
                                </>
                            ) : null}
                            <dt className="text-muted-foreground">{resolveLanguageKey("quotes")}</dt>
                            <dd className="text-right tabular-nums">
                                {task.quotes.average != null
                                    ? resolveLanguageKey("quotesAverage").replace("{quotes}", quotes).replace("{average}", formatMoney(task.quotes.average, task.currency))
                                    : quotes}
                            </dd>
                        </dl>
                        {task.approxPoint ? (
                            // Drawn like the lead sheet's map (D148): an absolute box inside a fixed-height frame, so Leaflet frames
                            // the area for the size the frame really has.
                            <div className="relative h-56 w-full min-w-0">
                                <SheetLocationMap
                                    address={{_id: task._id, ...task.approxPoint}}
                                    areaRadiusM={JOB_AREA_RADIUS_M}
                                    className="absolute inset-0 h-full w-full overflow-hidden rounded-2xl"
                                />
                            </div>
                        ) : null}
                        {task.approxPoint ? <p className="text-xs text-muted-foreground">{resolveLanguageKey("areaNote")}</p> : null}
                    </div>
                    {/* Who quoted, never at what price (sealed quotes, D172); the apex only, where every seller is named. */}
                    {site?.scope === "platform" && task.quotedBy.length > 0 ? (
                        <section className="flex flex-col gap-3" aria-labelledby="public-task-quoted-by">
                            <div className="flex flex-col gap-1">
                                <h2 id="public-task-quoted-by" className="font-display text-lg font-semibold tracking-tight">{resolveLanguageKey("quotedByTitle")}</h2>
                                <p className="text-xs text-muted-foreground">{resolveLanguageKey("quotedByNote")}</p>
                            </div>
                            <ul className="flex flex-col gap-2">
                                {task.quotedBy.map((company) => (
                                    <li key={company._id}>
                                        <PortalSellerCard sectionPath="services" seller={company} kind="quote" size="card" />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ) : null}
                    <PortalQuotePanel task={task} onQuoted={() => setFetchCount((count) => count + 1)} />
                    <div className="flex flex-col gap-3 rounded-3xl bg-muted p-6">
                        <p className="font-medium">{resolveLanguageKey("similarTitle")}</p>
                        <p className="text-sm text-muted-foreground">{resolveLanguageKey("similarMessage")}</p>
                        <Button asChild variant="outline" className="self-start">
                            <Link to={isAuthenticated ? postTarget : `/login?next=${encodeURIComponent(postTarget)}`}>{resolveLanguageKey("postTask")}</Link>
                        </Button>
                    </div>
                </aside>
            </div>
        </div>
    );
}

export default compose(withLanguage(LANGUAGE_PATH), withDebug(true, true))(TaskPage);
