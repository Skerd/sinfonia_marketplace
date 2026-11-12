import {useCallback, useEffect, useMemo, useState, type FormEvent} from "react";
import {Link, useParams, useSearchParams} from "react-router-dom";
import {compose} from "redux";
import {toast} from "sonner";
import {IconArrowLeft, IconCalendarMonth, IconCheck, IconCircleCheck, IconDownload, IconLock, IconStar} from "@tabler/icons-react";
import {loadStripe} from "@stripe/stripe-js";
import {Elements, PaymentElement, useElements, useStripe} from "@stripe/react-stripe-js";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {downloadFromApi} from "@coreModule/helpers/media/downloadFromApi.ts";
import {handleError} from "@coreModule/helpers/general/errors.ts";
import {DATE_FORMATS, formatDate} from "@coreModule/helpers/general/dateTime.ts";
import {resolvePublicMediaUrl} from "@coreModule/clients/portal/shared/portalMedia.ts";
import {ShopProviderAvatar} from "@marketplaceModule/clients/client/public/shared/shopMarketplace.tsx";
import {useServicesConfig} from "@marketplaceModule/clients/client/public/shared/servicesConfigContext.tsx";
import ServiceStatus from "@marketplaceModule/clients/client/public/shared/serviceStatus.tsx";
import {serviceOrderTitle} from "./index.tsx";
import ServiceOrderBookingForm from "./serviceOrderBookingForm.tsx";
import type {BuyerServiceOrder} from "armonia/src/modules/marketplace/api/marketplace/private/order/order.dto.ts";
import type {Media} from "armonia/src/modules/core/types/index.ts";
import {useSectionBase} from "@coreModule/clients/portal/shared/sectionBase.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {Textarea} from "@coreModule/components/ui/textarea.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {fromMinor, sumMinor, toMinor} from "armonia/src/modules/core/helpers/money.ts";

const LANGUAGE_PATH = "src/modules/marketplace/clients/client/public/account/serviceOrders/serviceOrderDetail.tsx";

/** The happy path an order walks; cancelled orders show their own banner instead. */
const STEPS = ["pending", "accepted", "in_progress", "completed"] as const;

const REVISION_REASON_MIN = 10;

type Panel = "cancel" | "revision" | "dispute" | "review" | "booking" | "milestone" | null;

function EscrowPayForm({
    clientSecret,
    payLabel,
    processingLabel,
    failedLabel,
    onPaid,
}: {
    clientSecret: string;
    payLabel: string;
    processingLabel: string;
    failedLabel: string;
    onPaid: () => Promise<void>;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [busy, setBusy] = useState(false);

    async function handlePay() {
        if (!stripe || !elements) return;
        setBusy(true);
        try {
            const {paymentIntent} = await stripe.retrievePaymentIntent(clientSecret);
            if (paymentIntent?.status === "succeeded") {
                await onPaid();
                return;
            }
            const result = await stripe.confirmPayment({
                elements,
                confirmParams: {return_url: window.location.href},
                redirect: "if_required",
            });
            if (result.error) {
                toast.error(result.error.message ?? failedLabel);
                return;
            }
            await onPaid();
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <PaymentElement />
            <Button size="lg" type="button" onClick={() => void handlePay()} disabled={!stripe || busy} className="w-full">
                <IconLock className="h-4 w-4" aria-hidden />
                {busy ? processingLabel : payLabel}
            </Button>
        </div>
    );
}

const ORDER_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/order/mySingle"};
const MARKETPLACE_URL = "/api/marketplace";

/** Delivery files are tenant media: fetched with the session token, then saved from memory. */
function downloadMedia(media: Media) {
    return downloadFromApi({url: `/api/auxiliary/media/${media._id}`, fileName: media.name || media._id});
}

function ServiceOrderDetailPage({resolveLanguageKey}: WithLanguageType) {
    const base = useSectionBase();
    const {orderId = ""} = useParams();
    const [searchParams] = useSearchParams();
    const justPlaced = searchParams.get("placed") === "1";
    const {config, formatMoney} = useServicesConfig();
    const stripePromise = useMemo(
        () => (config?.stripePublishableKey ? loadStripe(config.stripePublishableKey) : null),
        [config?.stripePublishableKey],
    );

    const [panel, setPanel] = useState<Panel>(null);
    const [text, setText] = useState("");
    const [rating, setRating] = useState(5);
    const [milestoneAmount, setMilestoneAmount] = useState("");
    const [orderCount, setOrderCount] = useState(0);
    const load = useCallback(() => setOrderCount((count) => count + 1), []);
    useEffect(() => {
        load();
    }, [load, orderId]);
    const orderRequest = useHttpRequest<{data: BuyerServiceOrder}>(ORDER_REQUEST, {_id: orderId}, orderCount);
    const order: BuyerServiceOrder | null = orderRequest.error ? null : orderRequest.data?.data ?? null;
    // The skeleton shows while this order loads, not while it reloads after an action.
    const loading = orderCount === 0 || (orderRequest.loading && order?._id !== orderId);

    function openPanel(next: Panel) {
        setPanel(next);
        setText("");
        setRating(5);
        setMilestoneAmount("");
    }

    /** Runs one buyer action, then reloads the order so every block reflects the new state. */
    const [action, setAction] = useState<{request: HttpRequest; body: Record<string, unknown>; successKey: string; count: number}>(
        {request: {method: "POST", url: MARKETPLACE_URL}, body: {}, successKey: "", count: 0},
    );
    const {loading: busy} = useHttpRequest(action.request, action.body, action.count, true, {
        success: () => {
            toast.success(resolveLanguageKey(action.successKey));
            setPanel(null);
            load();
        },
        error: (err) => handleError(err, {context: "ServiceOrder", showToast: true, fallbackMessage: resolveLanguageKey("actionError")}),
    });
    const run = (method: "POST" | "PUT", path: string, body: Record<string, unknown>, successKey: string) =>
        setAction((current) => ({request: {method, url: `${MARKETPLACE_URL}/${path}`}, body, successKey, count: current.count + 1}));

    if (loading) {
        return <div className="h-96 animate-pulse rounded-2xl bg-muted" aria-busy="true" aria-label={resolveLanguageKey("loading")} />;
    }

    if (!order) {
        return (
            <div className="flex flex-col items-start gap-4">
                <h1 className="font-display text-3xl font-bold tracking-tight">{resolveLanguageKey("notFound")}</h1>
                <Button asChild variant="link" className="h-auto p-0"><Link to={`${base}/account/orders`}>{resolveLanguageKey("backToOrders")}</Link></Button>
            </div>
        );
    }

    const status = order.status ?? "pending";
    const isFinal = status === "completed" || status === "cancelled";
    const canCancel = (status === "pending" || status === "accepted") && !order.hasActiveDispute;
    const canAnswerDelivery = status === "in_progress" && Boolean(order.deliverySubmitted);
    const canDispute = !isFinal && !order.hasActiveDispute;
    const canReview = status === "completed" && !order.reviewed;
    const stepIndex = STEPS.indexOf(status as (typeof STEPS)[number]);
    const providerName = [order.provider?.name, order.provider?.surname].filter(Boolean).join(" ");
    const imageUrl = resolvePublicMediaUrl(order.listingImage);
    const deliveries = order.deliveries ?? [];
    const revisions = order.revisions ?? [];
    const milestones = order.milestones ?? [];
    const bookings = order.bookings ?? [];
    // The server's booking rule: one booking per accepted or in-progress order
    const canBook = (status === "accepted" || status === "in_progress") && bookings.length === 0;
    // TD-B190: the buyer splits the escrow into milestones; together they never exceed the order (the server's rule).
    const decimals = order.currency?.decimalPlaces ?? 2;
    const unsplit = toMinor(order.amount ?? 0, decimals) - sumMinor(milestones.map(milestone => toMinor(milestone.amount, decimals)));
    const canSplit = (status === "accepted" || status === "in_progress") && !order.hasActiveDispute && unsplit > 0n;

    function submitPanel(event: FormEvent) {
        event.preventDefault();
        if (!order) return;
        if (panel === "revision") {
            run("POST", "order/requestRevision", {_id: order._id, reason: text.trim()}, "revisionSent");
        } else if (panel === "dispute") {
            run("PUT", "dispute/createMine", {order: order._id, reason: text.trim()}, "disputeOpened");
        } else if (panel === "review") {
            run("PUT", "review/createMine", {order: order._id, rating, comment: text.trim() || undefined}, "reviewThanks");
        } else if (panel === "milestone") {
            run("POST", "order/createMilestone", {order: order._id, name: text.trim(), amount: Number(milestoneAmount)}, "milestoneAdded");
        } else if (panel === "cancel") {
            run("POST", "order/cancel", {_id: order._id}, "cancelled");
        }
    }

    return (
        <div className="flex flex-col gap-8">
            <Link to={`${base}/account/orders`} className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground">
                <IconArrowLeft className="h-4 w-4" aria-hidden />
                {resolveLanguageKey("backToOrders")}
            </Link>

            {justPlaced && (
                <div className="flex gap-4 rounded-2xl bg-muted p-6" role="status">
                    <IconCircleCheck className="h-7 w-7 shrink-0 text-success" aria-hidden />
                    <div className="flex flex-col gap-1">
                        <p className="font-display text-xl font-semibold">{resolveLanguageKey("placedTitle")}</p>
                        <p className="text-muted-foreground">{resolveLanguageKey("placedMessage")}</p>
                    </div>
                </div>
            )}

            {order.escrowClientSecret && stripePromise && (
                <section className="flex flex-col gap-4 rounded-2xl border border-border p-6" aria-labelledby="shop-escrow-pay">
                    <div className="flex flex-col gap-1">
                        <h2 id="shop-escrow-pay" className="font-display text-xl font-semibold">{resolveLanguageKey("payEscrowTitle")}</h2>
                        <p className="text-sm text-muted-foreground">{resolveLanguageKey("payEscrowHint")}</p>
                    </div>
                    <Elements stripe={stripePromise} options={{clientSecret: order.escrowClientSecret}}>
                        <EscrowPayForm
                            clientSecret={order.escrowClientSecret}
                            payLabel={resolveLanguageKey("payEscrowButton")}
                            processingLabel={resolveLanguageKey("payEscrowButton")}
                            failedLabel={resolveLanguageKey("payEscrowError")}
                            onPaid={async () => {
                                toast.success(resolveLanguageKey("payEscrowSuccess"));
                                load();
                            }}
                        />
                    </Elements>
                </section>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {imageUrl && (
                    <div className="h-20 w-28 shrink-0 overflow-hidden rounded-2xl bg-muted">
                        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                )}
                <div className="flex min-w-0 flex-col gap-2">
                    <h1 className="font-display text-3xl font-bold tracking-tight">{serviceOrderTitle(order)}</h1>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>{order.name}</span>
                        {order.createdAt && <span>· {resolveLanguageKey("placedOn").replace("{date}", formatDate(order.createdAt, {format: DATE_FORMATS.date}))}</span>}
                        <ServiceStatus kind="serviceStatus" value={status} />
                        {order.hasActiveDispute && (
                            <span className="inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
                                {resolveLanguageKey("disputeOpen")}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {status === "cancelled" ? (
                <p className="rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700">{resolveLanguageKey("cancelledBanner")}</p>
            ) : (
                <ol className="grid grid-cols-4 gap-2" aria-label={resolveLanguageKey("progressLabel")}>
                    {STEPS.map((step, index) => {
                        const done = index <= stepIndex;
                        return (
                            <li key={step} className="flex flex-col gap-2" aria-current={index === stepIndex ? "step" : undefined}>
                                <span className={cn("h-1.5 rounded-full", done ? "bg-foreground" : "bg-accent")} aria-hidden />
                                <span className={cn("text-xs font-medium sm:text-sm", done ? "text-foreground" : "text-muted-foreground")}>
                                    {resolveLanguageKey(`steps.${step}`)}
                                </span>
                            </li>
                        );
                    })}
                </ol>
            )}

            <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
                <div className="flex flex-col gap-8">
                    {canAnswerDelivery && panel === null && (
                        <div className="flex flex-col gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-5">
                            <div className="flex flex-col gap-1">
                                <p className="font-semibold">{resolveLanguageKey("deliveryReadyTitle")}</p>
                                <p className="text-sm text-muted-foreground">{resolveLanguageKey("deliveryReadyMessage")}</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Button size="lg"
                                    type="button"
                                    disabled={busy || order.hasActiveDispute}
                                    onClick={() => run("POST", "order/acceptDelivery", {_id: order._id}, "deliveryAccepted")}
                                    
                                >
                                    <IconCheck className="h-4 w-4" aria-hidden />
                                    {resolveLanguageKey("acceptDelivery")}
                                </Button>
                                <Button variant="outline" size="lg" type="button" disabled={busy} onClick={() => openPanel("revision")} >
                                    {resolveLanguageKey("requestRevision")}
                                </Button>
                            </div>
                        </div>
                    )}

                    {panel === "booking" && (
                        <ServiceOrderBookingForm
                            orderId={order._id}
                            availability={order.providerAvailability}
                            onBooked={() => {
                                setPanel(null);
                                load();
                            }}
                            onCancel={() => setPanel(null)}
                        />
                    )}

                    {panel && panel !== "booking" && (
                        <form onSubmit={submitPanel} className="flex flex-col gap-4 rounded-2xl bg-muted p-5">
                            <p className="font-semibold">{resolveLanguageKey(`panel.${panel}.title`)}</p>
                            <p className="text-sm text-muted-foreground">{resolveLanguageKey(`panel.${panel}.message`)}</p>
                            {panel === "review" && (
                                <fieldset>
                                    <legend className="mb-2 text-sm font-medium">{resolveLanguageKey("ratingLabel")}</legend>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <Button
                                                key={n}
                                                type="button"
                                                onClick={() => setRating(n)}
                                                aria-label={resolveLanguageKey("starsOption").replace("{count}", String(n))}
                                                aria-pressed={n === rating}
                                                variant="ghost" size="icon-lg"
                                            >
                                                <IconStar className={cn("size-6", n <= rating ? "fill-foreground text-foreground" : "text-foreground/25")} />
                                            </Button>
                                        ))}
                                    </div>
                                </fieldset>
                            )}
                            {panel === "milestone" && (
                                <>
                                    <Label className="flex-col items-stretch gap-1.5">
                                        {resolveLanguageKey("panel.milestone.field")}
                                        <Input required maxLength={200} value={text} onChange={event => setText(event.target.value)} className="bg-card" />
                                    </Label>
                                    <Label className="flex-col items-stretch gap-1.5">
                                        {resolveLanguageKey("milestoneAmountLabel").replace("{max}", formatMoney(Number(fromMinor(unsplit, decimals)), order.currency))}
                                        <Input required type="number" min={0.01} max={fromMinor(unsplit, decimals)} step="0.01" inputMode="decimal" value={milestoneAmount} onChange={event => setMilestoneAmount(event.target.value)} className="bg-card" />
                                    </Label>
                                </>
                            )}
                            {panel !== "cancel" && panel !== "milestone" && (
                                <Label className="flex-col items-stretch gap-1.5">
                                    {resolveLanguageKey(`panel.${panel}.field`)}
                                    <Textarea
                    value={text}
                    onChange={event => setText(event.target.value)}
                    rows={4}
                    maxLength={2000}
                    required={panel !== "review"}
                    minLength={panel === "revision" ? REVISION_REASON_MIN : undefined}
                    className="h-auto bg-card py-2.5"
                  />
                                </Label>
                            )}
                            <div className="flex flex-wrap gap-3">
                                <Button size="lg" type="submit" disabled={busy} className={cn(panel === "cancel" && "bg-destructive hover:bg-destructive/90")}>
                                    {resolveLanguageKey(busy ? "working" : `panel.${panel}.submit`)}
                                </Button>
                                <Button variant="outline" size="lg" type="button" disabled={busy} onClick={() => setPanel(null)} >
                                    {resolveLanguageKey("back")}
                                </Button>
                            </div>
                        </form>
                    )}

                    {order.note && (
                        <section className="flex flex-col gap-2" aria-labelledby="shop-service-note">
                            <h2 id="shop-service-note" className="font-semibold">{resolveLanguageKey("noteTitle")}</h2>
                            <p className="whitespace-pre-line rounded-2xl border border-border p-4 text-[15px] text-muted-foreground">{order.note}</p>
                        </section>
                    )}

                    <section className="flex flex-col gap-3" aria-labelledby="shop-service-deliveries">
                        <h2 id="shop-service-deliveries" className="font-semibold">{resolveLanguageKey("deliveriesTitle")}</h2>
                        {deliveries.length === 0 ? (
                            <p className="text-sm text-muted-foreground">{resolveLanguageKey("noDeliveries")}</p>
                        ) : (
                            <ul className="flex flex-col gap-3">
                                {deliveries.map(delivery => (
                                    <li key={delivery._id} className="flex flex-col gap-3 rounded-2xl border border-border p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <ServiceStatus kind="deliveryStatus" value={delivery.status} />
                                            {delivery.createdAt && <span className="text-xs text-muted-foreground">{formatDate(delivery.createdAt, {format: DATE_FORMATS.dateTime})}</span>}
                                        </div>
                                        {delivery.message && <p className="whitespace-pre-line text-[15px] text-muted-foreground">{delivery.message}</p>}
                                        {delivery.attachments.length > 0 && (
                                            <ul className="flex flex-wrap gap-2">
                                                {delivery.attachments.map(file => (
                                                    <li key={file._id}>
                                                        <Button variant="outline" size="lg"
                                                            type="button"
                                                            onClick={() => void downloadMedia(file)}
                                                            className="h-9 px-4"
                                                        >
                                                            <IconDownload className="h-4 w-4" aria-hidden />
                                                            {file.name || resolveLanguageKey("attachment")}
                                                        </Button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {revisions.length > 0 && (
                        <section className="flex flex-col gap-3" aria-labelledby="shop-service-revisions">
                            <h2 id="shop-service-revisions" className="font-semibold">{resolveLanguageKey("revisionsTitle")}</h2>
                            <ul className="flex flex-col gap-2">
                                {revisions.map(revision => (
                                    <li key={revision._id} className="flex flex-col gap-1 rounded-2xl bg-muted/60 p-4">
                                        <span className="text-xs text-muted-foreground">
                                            {formatDate(revision.createdAt, {format: DATE_FORMATS.dateTime})} · {resolveLanguageKey(`revisionStatus.${revision.status}`)}
                                        </span>
                                        <p className="whitespace-pre-line text-[15px]">{revision.reason}</p>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {(milestones.length > 0 || canSplit) && (
                        <section className="flex flex-col gap-3" aria-labelledby="shop-service-milestones">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h2 id="shop-service-milestones" className="font-semibold">{resolveLanguageKey("milestonesTitle")}</h2>
                                {canSplit && panel === null && (
                                    <Button variant="outline" size="lg" type="button" onClick={() => openPanel("milestone")} className="h-9 px-4">
                                        {resolveLanguageKey("addMilestone")}
                                    </Button>
                                )}
                            </div>
                            {milestones.length === 0 && <p className="text-sm text-muted-foreground">{resolveLanguageKey("milestonesHint")}</p>}
                            {milestones.length > 0 && <ul className="divide-y divide-border border-y border-border">
                                {milestones.map(milestone => (
                                    <li key={milestone._id} className="flex flex-wrap items-center gap-3 py-3">
                                        <span className="flex-1 font-medium">{milestone.name}</span>
                                        <span className="tabular-nums">{formatMoney(milestone.amount, milestone.currency)}</span>
                                        <ServiceStatus kind="milestoneStatus" value={milestone.status} />
                                        {milestone.status === "pending" && status === "in_progress" && (
                                            <Button variant="outline" size="lg"
                                                type="button"
                                                disabled={busy}
                                                onClick={() => run("POST", "order/releaseMilestone", {milestone: milestone._id}, "milestoneReleased")}
                                                className="h-9 px-4"
                                            >
                                                {resolveLanguageKey("releaseMilestone")}
                                            </Button>
                                        )}
                                    </li>
                                ))}
                            </ul>}
                        </section>
                    )}

                    {bookings.length > 0 && (
                        <section className="flex flex-col gap-3" aria-labelledby="shop-service-bookings">
                            <h2 id="shop-service-bookings" className="font-semibold">{resolveLanguageKey("bookingsTitle")}</h2>
                            <ul className="flex flex-col gap-2">
                                {bookings.map(booking => (
                                    <li key={booking._id} className="flex items-center gap-3 rounded-2xl border border-border p-4 text-sm">
                                        <IconCalendarMonth className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                                        <span>
                                            {formatDate(booking.startAt, {format: DATE_FORMATS.dateTime, timeZone: booking.timezone})}
                                            {" – "}
                                            {formatDate(booking.endAt, {format: DATE_FORMATS.time, timeZone: booking.timezone})}
                                        </span>
                                        <span className="text-muted-foreground">{booking.timezone}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>

                <aside className="flex flex-col gap-6 rounded-2xl bg-muted p-6 lg:sticky lg:top-28">
                    {order.provider && (
                        <section className="flex items-center gap-3">
                            <ShopProviderAvatar name={providerName} />
                            <div className="flex min-w-0 flex-col">
                                <span className="text-xs text-muted-foreground">{resolveLanguageKey("provider")}</span>
                                <Link to={`${base}/provider?id=${encodeURIComponent(order.provider._id)}`} className="truncate font-semibold hover:underline underline-offset-4">
                                    {providerName}
                                </Link>
                            </div>
                        </section>
                    )}
                    <dl className="flex flex-col gap-2.5 border-t border-border pt-5 text-[15px]">
                        {order.deliveryDueDate && (
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">{resolveLanguageKey("dueDate")}</dt>
                                <dd>{formatDate(order.deliveryDueDate, {format: DATE_FORMATS.date})}</dd>
                            </div>
                        )}
                        <div className="flex items-baseline justify-between border-t border-border pt-3">
                            <dt className="font-semibold">{resolveLanguageKey("total")}</dt>
                            <dd className="font-display text-2xl font-semibold tabular-nums">{formatMoney(order.amount, order.currency)}</dd>
                        </div>
                    </dl>
                    {order.listing && (
                        <Button asChild variant="link" className="h-auto p-0 text-sm"><Link to={`${base}/service?id=${encodeURIComponent(order.listing._id)}`}>
                            {resolveLanguageKey("viewService")}
                        </Link></Button>
                    )}
                    {(canBook || canCancel || canDispute || canReview) && panel === null && (
                        <div className="flex flex-col gap-2 border-t border-border pt-5">
                            {canBook && (
                                <Button size="lg" type="button" onClick={() => openPanel("booking")}>
                                    <IconCalendarMonth className="h-4 w-4" aria-hidden />
                                    {resolveLanguageKey("bookSession")}
                                </Button>
                            )}
                            {canReview && (
                                <Button size="lg" type="button" onClick={() => openPanel("review")} >
                                    {resolveLanguageKey("leaveReview")}
                                </Button>
                            )}
                            {canDispute && (
                                <Button variant="outline" size="lg" type="button" onClick={() => openPanel("dispute")} className="bg-transparent">
                                    {resolveLanguageKey("reportProblem")}
                                </Button>
                            )}
                            {canCancel && (
                                <Button type="button" onClick={() => openPanel("cancel")} variant="ghost" size="lg" className="text-destructive hover:text-destructive">
                                    {resolveLanguageKey("cancelOrder")}
                                </Button>
                            )}
                        </div>
                    )}
                    {order.reviewed && <p className="text-sm text-muted-foreground">{resolveLanguageKey("reviewedNote")}</p>}
                </aside>
            </div>
        </div>
    );
}

export default compose(
    withLanguage(LANGUAGE_PATH),
    withDebug(true, true),
)(ServiceOrderDetailPage);
