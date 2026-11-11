import {compose} from "redux";
import {useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import SheetNameTitle from "@coreModule/components/entityPage/sheet/sheetNameTitle.tsx";
import StatusBadge from "@coreModule/components/entityPage/sheet/statusBadge.tsx";
import {getName} from "@coreModule/helpers/general/names.ts";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import type {Order} from "armonia/src/modules/marketplace/api/marketplace/private/order/order.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import type {OrderStatus} from "armonia/src/modules/marketplace/api/marketplace/private/order/order.schema-def.ts";
import AcceptOrderDropdown from "@marketplaceModule/clients/panel/private/orders/center/actions/acceptOrderDropdown.tsx";
import StartOrderDropdown from "@marketplaceModule/clients/panel/private/orders/center/actions/startOrderDropdown.tsx";
import CancelOrderDropdown from "@marketplaceModule/clients/panel/private/orders/center/actions/cancelOrderDropdown.tsx";
import ExtendOrderDropdown from "@marketplaceModule/clients/panel/private/orders/center/actions/extendOrderDropdown.tsx";
import SubmitOrderDeliveryDropdown from "@marketplaceModule/clients/panel/private/orders/center/actions/submitOrderDeliveryDropdown.tsx";
import AcceptOrderDeliveryDropdown from "@marketplaceModule/clients/panel/private/orders/center/actions/acceptOrderDeliveryDropdown.tsx";
import RaiseDisputeDropdown from "@marketplaceModule/clients/panel/private/orders/center/actions/raiseDisputeDropdown.tsx";
import OrderActionConfirmAction from "@marketplaceModule/components/custom/orders/orderActionConfirmAction.tsx";
import SubmitOrderDeliveryAction from "@marketplaceModule/components/custom/orders/submitOrderDeliveryAction.tsx";
import OrderExtendAction from "@marketplaceModule/components/custom/orders/orderExtendAction.tsx";
import RequestRevisionAction from "@marketplaceModule/components/custom/orders/requestRevisionAction.tsx";
import RaiseDisputeAction from "@marketplaceModule/components/custom/disputes/raiseDisputeAction.tsx";
import type {OrderConfirmActionKey} from "@marketplaceModule/components/custom/orders/orderActionConfirmAction.tsx";
import RequestRevisionDropdown from "@marketplaceModule/clients/panel/private/orders/center/actions/requestRevisionDropdown.tsx";
import CreateMilestoneDropdown from "@marketplaceModule/clients/panel/private/orders/center/actions/createMilestoneDropdown.tsx";
import ReleaseMilestoneDropdown from "@marketplaceModule/clients/panel/private/orders/center/actions/releaseMilestoneDropdown.tsx";
import CreateMilestoneAction from "@marketplaceModule/components/custom/orders/createMilestoneAction.tsx";
import ReleaseMilestoneAction from "@marketplaceModule/components/custom/orders/releaseMilestoneAction.tsx";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";

const ORDER_SINGLE_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/order/single"};

export type OrderSheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order?: Order;
    hideActions?: boolean;
    onDelete?: (response?: DeletedData) => void;
    onRestore?: () => void;
    onOrderUpdated?: (order: Order) => void;
    onSheetRowPatched?: (patch: Partial<Order>) => void;
    fetchId?: string;
};

function OrderSheetView({
    open,
    onOpenChange,
    order: orderProp,
    resolveLanguageKey,
    hideActions = false,
    onDelete = () => {},
    onRestore = () => {},
    onOrderUpdated,
    onSheetRowPatched,
    fetchId,
}: OrderSheetViewOwnProps & WithLanguageType) {
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(orderProp || {_id: fetchId});
    const [action, setAction] = useState("");
    const access = useAccess("orders");
    const viewConfig = useViewConfig("orders", "sheet");

    useEffect(() => {
        if (!orderProp) return;
        setSheetData(orderProp);
    }, [orderProp]);

    useEffect(() => {
        if (!open) setAction("");
    }, [open]);

    const entityId = orderProp?._id ?? fetchId;
    const asOrder = sheetData as Order;

    /** Re-reads the order after an action that changes its deliveries, milestones or revisions. */
    const [reloadCount, setReloadCount] = useState(0);
    useHttpRequest<Order>(ORDER_SINGLE_REQUEST, {_id: entityId}, reloadCount, true, {
        success: (order) => {
            setSheetData(order);
            onOrderUpdated?.(order);
        },
    });
    const reloadOrder = () => setReloadCount((count) => count + 1);
    const displayLabel = asOrder.listing?.title || asOrder.taskRequest?.title || String(entityId ?? "");

    if (!viewConfig) return null;
    if (!entityId) return null;

    const applyOrderUpdate = (patch: Partial<Order>) => {
        setSheetData((prev) => {
            const updated = {...(prev as Order), ...patch};
            onSheetRowPatched?.(patch);
            onOrderUpdated?.(updated);
            return updated;
        });
    };


    return (
        <>
            <SheetViewRenderer
                config={viewConfig}
                url="/api/marketplace/order/single"
                fetchId={fetchId ?? entityId}
                onDataFetched={(data) => setSheetData(data)}
                onSheetRowPatched={onSheetRowPatched}
                data={sheetData}
                open={open}
                onOpenChange={onOpenChange}
                resolveLanguageKey={resolveLanguageKey}
                // What was ordered and by whom, the order number as a badge and the status in tone (UX-01, UX-02).
                headerTitle={<SheetNameTitle name={[asOrder.listing?.title || asOrder.taskRequest?.title, getName(asOrder.customer)].filter(Boolean).join(" · ")} code={asOrder.name} typeLabel={String(resolveLanguageKey("order"))} />}
                headerDescription={<StatusBadge tableConfigKey="orders" field="status" value={asOrder.status} label={String(resolveLanguageKey(`orderStatus.${asOrder.status}`))} />}
                access={access}
                hideActions={hideActions}
                onDelete={onDelete}
                onRestore={onRestore}
                hideEdit
                actionMenuAllowCustomChildren
                actionMenuChildren={
                    <>
                        <AcceptOrderDropdown order={asOrder} onAction={setAction} />
                        <StartOrderDropdown order={asOrder} onAction={setAction} />
                        <CancelOrderDropdown order={asOrder} onAction={setAction} />
                        <ExtendOrderDropdown order={asOrder} onAction={setAction} />
                        <SubmitOrderDeliveryDropdown order={asOrder} onAction={setAction} />
                        <AcceptOrderDeliveryDropdown order={asOrder} onAction={setAction} />
                        <RequestRevisionDropdown order={asOrder} onAction={setAction} />
                        <CreateMilestoneDropdown order={asOrder} onAction={setAction} />
                        <ReleaseMilestoneDropdown order={asOrder} onAction={setAction} />
                        <RaiseDisputeDropdown order={asOrder} onAction={setAction} />
                    </>
                }
            />
            {(action === "accept" || action === "start" || action === "cancel" || action === "acceptDelivery") && (
                <OrderActionConfirmAction
                    orderId={String(asOrder._id)}
                    displayName={displayLabel}
                    actionKey={action as OrderConfirmActionKey}
                    openAlert
                    url={`/api/marketplace/order/${action}`}
                    onSuccess={(newStatus: OrderStatus) => {
                        applyOrderUpdate({status: newStatus});
                        if (action === "acceptDelivery") reloadOrder();
                        setAction("");
                    }}
                    onCancel={() => setAction("")}
                />
            )}
            {action === "submitDelivery" && (
                <SubmitOrderDeliveryAction
                    orderId={String(asOrder._id)}
                    displayName={displayLabel}
                    openAlert
                    url="/api/marketplace/order/submitDelivery"
                    onSuccess={() => {
                        reloadOrder();
                        setAction("");
                    }}
                    onCancel={() => setAction("")}
                />
            )}
            {action === "extend" && (
                <OrderExtendAction
                    orderId={String(asOrder._id)}
                    displayName={displayLabel}
                    currentDueDate={asOrder.deliveryDueDate}
                    orderCreatedAt={asOrder.createdAt}
                    openAlert
                    url="/api/marketplace/order/extend"
                    onSuccess={(newDueDate: string) => {
                        applyOrderUpdate({deliveryDueDate: newDueDate});
                        setAction("");
                    }}
                    onCancel={() => setAction("")}
                />
            )}
            {action === "requestRevision" && (
                <RequestRevisionAction
                    orderId={String(asOrder._id)}
                    displayName={displayLabel}
                    openAlert
                    url="/api/marketplace/order/requestRevision"
                    onSuccess={() => {
                        reloadOrder();
                        setAction("");
                    }}
                    onCancel={() => setAction("")}
                />
            )}
            {action === "createMilestone" && (
                <CreateMilestoneAction
                    orderId={String(asOrder._id)}
                    displayName={displayLabel}
                    currency={asOrder.currency}
                    onSuccess={() => {
                        reloadOrder();
                        setAction("");
                    }}
                    onCancel={() => setAction("")}
                />
            )}
            {action === "releaseMilestone" && (
                <ReleaseMilestoneAction
                    milestones={(asOrder.milestones ?? []).filter((milestone) => milestone.status === "pending")}
                    displayName={displayLabel}
                    onSuccess={() => {
                        reloadOrder();
                        setAction("");
                    }}
                    onCancel={() => setAction("")}
                />
            )}
            {action === "raiseDispute" && (
                <RaiseDisputeAction
                    orderId={String(asOrder._id)}
                    displayName={displayLabel}
                    openAlert
                    url="/api/marketplace/dispute"
                    onSuccess={() => {
                        applyOrderUpdate({hasActiveDispute: true});
                        setAction("");
                    }}
                    onCancel={() => setAction("")}
                />
            )}
        </>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/orders/center/sheetView/orderSheetView.tsx"),
    withDebug(true, true, "orders"),
)(OrderSheetView);
