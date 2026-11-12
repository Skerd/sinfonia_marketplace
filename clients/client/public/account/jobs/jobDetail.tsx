import {useCallback, useEffect, useState} from "react";
import {Link, useNavigate, useParams, useSearchParams} from "react-router-dom";
import {compose} from "redux";
import {toast} from "sonner";
import {IconArrowLeft, IconCircleCheck, IconClock, IconMapPin} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {handleError} from "@coreModule/helpers/general/errors.ts";
import {DATE_FORMATS, formatDate} from "@coreModule/helpers/general/dateTime.ts";
import {resolvePublicMediaUrl} from "@coreModule/clients/portal/shared/portalMedia.ts";
import {ShopProviderAvatar} from "@marketplaceModule/clients/client/public/shared/shopMarketplace.tsx";
import {StarRow} from "@coreModule/clients/portal/shared/starRow.tsx";
import {useServicesConfig} from "@marketplaceModule/clients/client/public/shared/servicesConfigContext.tsx";
import ServiceStatus from "@marketplaceModule/clients/client/public/shared/serviceStatus.tsx";
import type {BuyerTaskRequest} from "armonia/src/modules/marketplace/api/marketplace/private/taskRequest/taskRequest.dto.ts";
import {useSectionBase} from "@coreModule/clients/portal/shared/sectionBase.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";

const LANGUAGE_PATH = "src/modules/marketplace/clients/client/public/account/jobs/jobDetail.tsx";

const JOB_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/taskRequest/mySingle"};
const ACCEPT_BID_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/bid/accept"};
/** Decline a quote, close or reopen the job: the url is set per action. */
const JOB_ACTION_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace"};

function JobDetailPage({resolveLanguageKey}: WithLanguageType) {
    const base = useSectionBase();
    const {jobId = ""} = useParams();
    const [searchParams] = useSearchParams();
    const justPosted = searchParams.get("posted") === "1";
    // How many pros the new job reached (D143); absent on an older link.
    const notified = Number(searchParams.get("notified") ?? NaN);
    const navigate = useNavigate();
    const {formatMoney} = useServicesConfig();

    const [confirmBidId, setConfirmBidId] = useState<string | null>(null);

    const [jobCount, setJobCount] = useState(0);
    const load = useCallback(() => setJobCount((count) => count + 1), []);
    useEffect(() => {
        load();
    }, [load, jobId]);
    const jobRequest = useHttpRequest<{data: BuyerTaskRequest}>(JOB_REQUEST, {_id: jobId}, jobCount);
    const job: BuyerTaskRequest | null = jobRequest.error ? null : jobRequest.data?.data ?? null;
    // The skeleton shows while this job loads, not while it reloads after an action.
    const loading = jobCount === 0 || (jobRequest.loading && job?._id !== jobId);

    const actionError = (err: unknown) => handleError(err, {context: "Job", showToast: true, fallbackMessage: resolveLanguageKey("actionError")});
    const [action, setAction] = useState<{path: string; id: string; successKey: string; count: number}>({path: "", id: "", successKey: "", count: 0});
    const actionRequest = useHttpRequest(JOB_ACTION_REQUEST, {_id: action.id}, action.count, true, {
        success: () => {
            toast.success(resolveLanguageKey(action.successKey));
            setConfirmBidId(null);
            load();
        },
        error: actionError,
    }, {url: `${JOB_ACTION_REQUEST.url}/${action.path}`});
    const run = (path: string, id: string, successKey: string) =>
        setAction((current) => ({path, id, successKey, count: current.count + 1}));

    /** Accepting a quote opens the order with that pro (in their company, D143); send the buyer to it. */
    const [acceptCall, setAcceptCall] = useState({id: "", count: 0});
    const acceptRequest = useHttpRequest<{message: string; _id: string}>(ACCEPT_BID_REQUEST, {_id: acceptCall.id}, acceptCall.count, true, {
        success: (response) => {
            toast.success(resolveLanguageKey("bidAccepted"));
            navigate(`${base}/account/orders/${response._id}`);
        },
        error: actionError,
    });
    const acceptBid = (bidId: string) => setAcceptCall((current) => ({id: bidId, count: current.count + 1}));
    const busy = actionRequest.loading || acceptRequest.loading || (acceptCall.count > 0 && !!acceptRequest.data);

    if (loading) {
        return <div className="h-96 animate-pulse rounded-2xl bg-muted" aria-busy="true" aria-label={resolveLanguageKey("loading")} />;
    }

    if (!job) {
        return (
            <div className="flex flex-col items-start gap-4">
                <h1 className="font-display text-3xl font-bold tracking-tight">{resolveLanguageKey("notFound")}</h1>
                <Button asChild variant="link" className="h-auto p-0"><Link to={`${base}/account/jobs`}>{resolveLanguageKey("backToJobs")}</Link></Button>
            </div>
        );
    }

    const bids = job.bids ?? [];
    const isOpen = job.status === "open";
    const image = resolvePublicMediaUrl(job.mainImage?._id);
    const place = [job.address?.street, job.address?.postalCode, job.address?.city?.name, job.address?.country?.name].filter(Boolean).join(", ");

    return (
        <div className="flex flex-col gap-8">
            <Link to={`${base}/account/jobs`} className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground">
                <IconArrowLeft className="h-4 w-4" aria-hidden />
                {resolveLanguageKey("backToJobs")}
            </Link>

            {justPosted && (
                <div className="flex gap-4 rounded-2xl bg-muted p-6" role="status">
                    <IconCircleCheck className="h-7 w-7 shrink-0 text-success" aria-hidden />
                    <div className="flex flex-col gap-1">
                        <p className="font-display text-xl font-semibold">{resolveLanguageKey("postedTitle")}</p>
                        <p className="text-muted-foreground">
                            {Number.isNaN(notified)
                                ? resolveLanguageKey("postedMessage")
                                : notified === 0
                                    ? resolveLanguageKey("postedNobody")
                                    : resolveLanguageKey(notified === 1 ? "postedNotifiedOne" : "postedNotified").replace("{count}", String(notified))}
                        </p>
                    </div>
                </div>
            )}

            <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="font-display text-3xl font-bold tracking-tight">{job.title}</h1>
                            <ServiceStatus kind="jobStatus" value={job.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {[job.name, job.category?.name, job.createdAt ? formatDate(job.createdAt, {format: DATE_FORMATS.date}) : undefined].filter(Boolean).join(" · ")}
                        </p>
                        {job.description && <p className="whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">{job.description}</p>}
                    </div>

                    <section className="flex flex-col gap-4" aria-labelledby="shop-job-bids">
                        <h2 id="shop-job-bids" className="font-display text-2xl font-semibold tracking-tight">
                            {resolveLanguageKey(bids.length === 1 ? "bidsTitleOne" : "bidsTitle").replace("{count}", String(bids.length))}
                        </h2>
                        {bids.length === 0 ? (
                            <p className="rounded-2xl bg-muted px-5 py-6 text-muted-foreground">{resolveLanguageKey(isOpen ? "noBidsYet" : "noBids")}</p>
                        ) : (
                            <ul className="flex flex-col gap-3">
                                {bids.map(bid => {
                                    const bidderName = [bid.bidder?.name, bid.bidder?.surname].filter(Boolean).join(" ");
                                    const pending = bid.status === "pending";
                                    return (
                                        <li key={bid._id} className={cn("flex flex-col gap-4 rounded-2xl border p-5", bid.status === "accepted" ? "border-success" : "border-border")}>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <ShopProviderAvatar name={bidderName} />
                                                <div className="flex min-w-0 flex-1 flex-col">
                                                    <span className="font-semibold">{bidderName}</span>
                                                    {bid.bidderCompany?.name && <span className="text-sm text-muted-foreground">{bid.bidderCompany.name}{bid.listing?.title ? ` · ${bid.listing.title}` : ""}</span>}
                                                    {bid.listing && (
                                                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            {bid.listing.reviewCount ? (
                                                                <>
                                                                    <StarRow value={Math.round(bid.listing.avgRating ?? 0)} className="[&_svg]:h-3.5 [&_svg]:w-3.5" />
                                                                    {resolveLanguageKey("ratingValue").replace("{rating}", (bid.listing.avgRating ?? 0).toFixed(1)).replace("{count}", String(bid.listing.reviewCount))}
                                                                </>
                                                            ) : resolveLanguageKey("noReviews")}
                                                        </span>
                                                    )}
                                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                        <IconClock className="h-3.5 w-3.5" aria-hidden />
                                                        {resolveLanguageKey(bid.deliveryDays === 1 ? "deliveryDay" : "deliveryDays").replace("{days}", String(bid.deliveryDays))}
                                                    </span>
                                                </div>
                                                <span className="font-display text-xl font-semibold tabular-nums">{formatMoney(bid.amount, bid.currency)}</span>
                                                <ServiceStatus kind="bidStatus" value={bid.status} />
                                            </div>
                                            {bid.proposal && <p className="whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">{bid.proposal}</p>}
                                            {pending && isOpen && (
                                                confirmBidId === bid._id ? (
                                                    <div className="flex flex-col gap-3 rounded-xl bg-muted p-4">
                                                        <p className="text-sm">{resolveLanguageKey("confirmAccept").replace("{name}", bid.bidderCompany?.name ?? bidderName).replace("{amount}", formatMoney(bid.amount, bid.currency))}</p>
                                                        <div className="flex flex-wrap gap-3">
                                                            <Button size="lg" type="button" disabled={busy} onClick={() => acceptBid(bid._id)}>
                                                                {resolveLanguageKey(busy ? "working" : "confirmAcceptButton")}
                                                            </Button>
                                                            <Button variant="outline" size="lg" type="button" disabled={busy} onClick={() => setConfirmBidId(null)}>
                                                                {resolveLanguageKey("back")}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap gap-3">
                                                        <Button size="lg" type="button" disabled={busy} onClick={() => setConfirmBidId(bid._id)}>
                                                            {resolveLanguageKey("acceptBid")}
                                                        </Button>
                                                        <Button variant="outline" size="lg" type="button" disabled={busy} onClick={() => run("bid/reject", bid._id, "bidRejected")}>
                                                            {resolveLanguageKey("rejectBid")}
                                                        </Button>
                                                    </div>
                                                )
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>
                </div>

                <aside className="flex flex-col gap-5 rounded-2xl bg-muted p-6 lg:sticky lg:top-28">
                    {image && <img src={image} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />}
                    <dl className="flex flex-col gap-2.5 text-[15px]">
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">{resolveLanguageKey("budget")}</dt>
                            <dd className="text-right tabular-nums">{job.budgetMax != null ? resolveLanguageKey("budgetUpTo").replace("{amount}", formatMoney(job.budgetMax, job.currency)) : resolveLanguageKey("budgetOpen")}</dd>
                        </div>
                        {job.expiresAt && (
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">{resolveLanguageKey("expires")}</dt>
                                <dd>{formatDate(job.expiresAt, {format: DATE_FORMATS.date})}</dd>
                            </div>
                        )}
                    </dl>
                    {place && (
                        <p className="flex items-start gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
                            <IconMapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                            {place}
                        </p>
                    )}
                    {(job.status === "open" || job.status === "closed") && (
                        <Button variant="outline" size="lg"
                            type="button"
                            disabled={busy}
                            onClick={() => run(`taskRequest/${isOpen ? "close" : "reopen"}`, job._id, isOpen ? "jobClosed" : "jobReopened")}
                            className="bg-transparent"
                        >
                            {resolveLanguageKey(isOpen ? "closeJob" : "reopenJob")}
                        </Button>
                    )}
                </aside>
            </div>
        </div>
    );
}

export default compose(
    withLanguage(LANGUAGE_PATH),
    withDebug(true, true),
)(JobDetailPage);
