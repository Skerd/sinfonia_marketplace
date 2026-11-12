import {useEffect, useState} from "react";
import {Link, useSearchParams} from "react-router-dom";
import {compose} from "redux";
import {IconChevronLeft, IconChevronRight, IconPlus} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {DATE_FORMATS, formatDate} from "@coreModule/helpers/general/dateTime.ts";
import {useServicesConfig} from "@marketplaceModule/clients/client/public/shared/servicesConfigContext.tsx";
import ServiceStatus from "@marketplaceModule/clients/client/public/shared/serviceStatus.tsx";
import type {BuyerTaskRequest} from "armonia/src/modules/marketplace/api/marketplace/private/taskRequest/taskRequest.dto.ts";
import {useSectionBase} from "@coreModule/clients/portal/shared/sectionBase.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";

const LANGUAGE_PATH = "src/modules/marketplace/clients/client/public/account/jobs/index.tsx";

const PAGE_SIZE = 10;

const LIST_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/taskRequest/my"};

function JobsPage({resolveLanguageKey}: WithLanguageType) {
    const base = useSectionBase();
    const {formatMoney} = useServicesConfig();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Math.max(1, Number(searchParams.get("page")) || 1);

    const [listCount, setListCount] = useState(0);
    useEffect(() => {
        setListCount((count) => count + 1);
    }, [page]);
    const list = useHttpRequest<{data: BuyerTaskRequest[]; total: number}>(LIST_REQUEST, {page, limit: PAGE_SIZE}, listCount);
    const jobs: BuyerTaskRequest[] = list.error ? [] : list.data?.data ?? [];
    const total = list.data?.total ?? 0;
    const loading = list.loading || listCount === 0;

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const goToPage = (next: number) => setSearchParams(next > 1 ? {page: String(next)} : {});

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="font-display text-3xl font-bold tracking-tight">{resolveLanguageKey("title")}</h1>
                    <p className="text-sm text-muted-foreground">{resolveLanguageKey("lead")}</p>
                </div>
                <Button asChild size="lg"><Link to={`${base}/account/jobs/new`}>
                    <IconPlus className="h-4 w-4" aria-hidden />
                    {resolveLanguageKey("postJob")}
                </Link></Button>
            </div>

            {loading ? (
                <div className="flex flex-col gap-3" aria-busy="true" aria-label={resolveLanguageKey("loading")}>
                    {Array.from({length: 3}, (_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}
                </div>
            ) : jobs.length === 0 ? (
                <div className="flex flex-col items-center gap-4 rounded-3xl bg-muted px-6 py-16 text-center">
                    <p className="font-display text-xl font-semibold">{resolveLanguageKey("emptyTitle")}</p>
                    <p className="max-w-md text-muted-foreground">{resolveLanguageKey("emptyMessage")}</p>
                    <Button asChild size="lg"><Link to={`${base}/account/jobs/new`}>{resolveLanguageKey("postJob")}</Link></Button>
                </div>
            ) : (
                <ul className="flex flex-col gap-3">
                    {jobs.map(job => (
                        <li key={job._id}>
                            <Link
                                to={`${base}/account/jobs/${job._id}`}
                                className="group flex items-center gap-4 rounded-2xl border border-border p-4 transition-colors hover:border-foreground sm:p-5"
                            >
                                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <span className="truncate font-semibold">{job.title}</span>
                                        <ServiceStatus kind="jobStatus" value={job.status} />
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        {[
                                            job.category?.name,
                                            job.budgetMax != null ? resolveLanguageKey("budgetUpTo").replace("{amount}", formatMoney(job.budgetMax, job.currency)) : undefined,
                                            job.expiresAt && job.status === "open"
                                                ? resolveLanguageKey("expiresOn").replace("{date}", formatDate(job.expiresAt, {format: DATE_FORMATS.date}))
                                                : undefined,
                                        ].filter(Boolean).join(" · ")}
                                    </span>
                                </div>
                                <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-sm font-medium tabular-nums">
                                    {resolveLanguageKey(job.bidCount === 1 ? "bidCountOne" : "bidCount").replace("{count}", String(job.bidCount ?? 0))}
                                </span>
                                <IconChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            {totalPages > 1 && (
                <nav className="flex items-center justify-center gap-3" aria-label={resolveLanguageKey("pagination")}>
                    <Button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => goToPage(page - 1)}
                        variant="ghost" size="icon-lg"
                        aria-label={resolveLanguageKey("previousPage")}
                    >
                        <IconChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        {resolveLanguageKey("pageOf").replace("{page}", String(page)).replace("{total}", String(totalPages))}
                    </span>
                    <Button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => goToPage(page + 1)}
                        variant="ghost" size="icon-lg"
                        aria-label={resolveLanguageKey("nextPage")}
                    >
                        <IconChevronRight className="h-4 w-4" />
                    </Button>
                </nav>
            )}
        </div>
    );
}

export default compose(
    withLanguage(LANGUAGE_PATH),
    withDebug(true, true),
)(JobsPage);
