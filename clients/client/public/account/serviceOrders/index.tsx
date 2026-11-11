import {useEffect, useState} from "react";
import {Link, useSearchParams} from "react-router-dom";
import {compose} from "redux";
import {IconBellRinging, IconChevronLeft, IconChevronRight, IconClock} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {DATE_FORMATS, formatDate} from "@coreModule/helpers/general/dateTime.ts";
import {resolvePublicMediaUrl} from "@coreModule/clients/portal/shared/portalMedia.ts";
import {useServicesConfig} from "@marketplaceModule/clients/client/public/shared/servicesConfigContext.tsx";
import ServiceStatus from "@marketplaceModule/clients/client/public/shared/serviceStatus.tsx";
import {orderStatuses} from "armonia/src/modules/marketplace/api/marketplace/private/order/order.schema-def.ts";
import type {BuyerServiceOrder} from "armonia/src/modules/marketplace/api/marketplace/private/order/order.dto.ts";
import {useSectionBase} from "@coreModule/clients/portal/shared/sectionBase.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";

const LANGUAGE_PATH = "src/modules/marketplace/clients/client/public/account/serviceOrders/index.tsx";

const PAGE_SIZE = 10;

/** What the order is for: the listing, or the job a bid won. */
export function serviceOrderTitle(order: BuyerServiceOrder): string {
    return order.listing?.title ?? order.taskRequest?.title ?? order.name;
}

const LIST_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/order/my"};

function ServiceOrdersPage({resolveLanguageKey}: WithLanguageType) {
    const base = useSectionBase();
    const {formatMoney} = useServicesConfig();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const requestedStatus = searchParams.get("status");
    const status = orderStatuses.find(value => value === requestedStatus);

    const [listCount, setListCount] = useState(0);
    useEffect(() => {
        setListCount((count) => count + 1);
    }, [page, status]);
    const list = useHttpRequest<{data: BuyerServiceOrder[]; total: number}>(LIST_REQUEST, {page, limit: PAGE_SIZE, status}, listCount);
    const orders: BuyerServiceOrder[] = list.error ? [] : list.data?.data ?? [];
    const total = list.data?.total ?? 0;
    const loading = list.loading || listCount === 0;

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const goTo = (next: {page?: number; status?: string}) => {
        const params: Record<string, string> = {};
        if (next.status) params.status = next.status;
        if (next.page && next.page > 1) params.page = String(next.page);
        setSearchParams(params);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <h1 className="font-display text-3xl font-bold tracking-tight">{resolveLanguageKey("title")}</h1>
                <Link to={`${base}/services`} className="text-sm font-medium text-primary hover:underline underline-offset-4">{resolveLanguageKey("browse")}</Link>
            </div>

            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" aria-label={resolveLanguageKey("filterLabel")}>
                {[undefined, ...orderStatuses].map(value => (
                    <li key={value ?? "all"}>
                        <Button
                            type="button"
                            onClick={() => goTo({status: value})}
                            aria-pressed={status === value}
                            variant={status === value ? "default" : "outline"}
                            size="lg"
                        >
                            {value ? resolveLanguageKey(`statusFilter.${value}`) : resolveLanguageKey("allStatuses")}
                        </Button>
                    </li>
                ))}
            </ul>

            {loading ? (
                <div className="flex flex-col gap-3" aria-busy="true" aria-label={resolveLanguageKey("loading")}>
                    {Array.from({length: 3}, (_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}
                </div>
            ) : orders.length === 0 ? (
                <div className="flex flex-col items-center gap-4 rounded-3xl bg-muted px-6 py-16 text-center">
                    <p className="font-display text-xl font-semibold">{resolveLanguageKey("emptyTitle")}</p>
                    <p className="text-muted-foreground">{resolveLanguageKey(status ? "emptyFiltered" : "emptyMessage")}</p>
                    <Button asChild size="lg"><Link to={`${base}/services`}>{resolveLanguageKey("browse")}</Link></Button>
                </div>
            ) : (
                <ul className="flex flex-col gap-3">
                    {orders.map(order => {
                        const imageUrl = resolvePublicMediaUrl(order.listingImage);
                        const needsAction = order.deliverySubmitted && order.status === "in_progress";
                        return (
                            <li key={order._id}>
                                <Link
                                    to={`${base}/account/orders/${order._id}`}
                                    className="group flex items-center gap-4 rounded-2xl border border-border p-4 transition-colors hover:border-foreground sm:p-5"
                                >
                                    <div className="hidden h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:block" aria-hidden>
                                        {imageUrl && <img src={imageUrl} alt="" className="h-full w-full object-cover" />}
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <span className="truncate font-semibold">{serviceOrderTitle(order)}</span>
                                            {order.status && <ServiceStatus kind="serviceStatus" value={order.status} />}
                                        </div>
                                        <span className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                                            <span>{order.name}</span>
                                            {order.provider && <span>· {[order.provider.name, order.provider.surname].filter(Boolean).join(" ")}</span>}
                                            {order.deliveryDueDate && order.status !== "completed" && order.status !== "cancelled" && (
                                                <span className="inline-flex items-center gap-1">
                                                    · <IconClock className="h-3.5 w-3.5" aria-hidden />
                                                    {resolveLanguageKey("dueOn").replace("{date}", formatDate(order.deliveryDueDate, {format: DATE_FORMATS.date}))}
                                                </span>
                                            )}
                                        </span>
                                        {needsAction && (
                                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                                                <IconBellRinging className="h-4 w-4" aria-hidden />
                                                {resolveLanguageKey("deliveryWaiting")}
                                            </span>
                                        )}
                                    </div>
                                    <span className="font-display font-semibold tabular-nums">{formatMoney(order.amount, order.currency)}</span>
                                    <IconChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}

            {totalPages > 1 && (
                <nav className="flex items-center justify-center gap-3" aria-label={resolveLanguageKey("pagination")}>
                    <Button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => goTo({page: page - 1, status})}
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
                        onClick={() => goTo({page: page + 1, status})}
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
)(ServiceOrdersPage);
