import {compose} from "redux";
import {useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import SheetNameTitle from "@coreModule/components/entityPage/sheet/sheetNameTitle.tsx";
import StatusBadge from "@coreModule/components/entityPage/sheet/statusBadge.tsx";
import {DATE_FORMATS, formatDate} from "@coreModule/helpers/general/dateTime.ts";
import {useCompanyTimeZone} from "@coreModule/helpers/hooks/useCompanyTimeZone.ts";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import type {OrderDelivery} from "armonia/src/modules/marketplace/api/marketplace/private/orderDelivery/orderDelivery.dto.ts";

/** Read-only: delivery rows are written by order actions, never edited or deleted from the panel. */
type OrderDeliverySheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    delivery?: OrderDelivery;
    fetchId?: string;
};

function OrderDeliverySheetView({
    open,
    onOpenChange,
    delivery: deliveryProp,
    resolveLanguageKey,
    fetchId,
}: OrderDeliverySheetViewOwnProps & WithLanguageType) {
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(deliveryProp || {_id: fetchId});
    const access = useAccess("orderDeliveries");
    const viewConfig = useViewConfig("orderdeliveries", "sheet");
    const companyZone = useCompanyTimeZone();

    useEffect(() => {
        if (!deliveryProp) return;
        setSheetData(deliveryProp);
    }, [deliveryProp]);

    const entityId = deliveryProp?._id ?? fetchId;

    if (!viewConfig || !entityId) return null;
    const delivery = sheetData as OrderDelivery;
    const orderTitle = delivery.order?.listing?.title || delivery.order?.taskRequest?.title;
    const submittedOn = formatDate(delivery.createdAt, {timeZone: companyZone, format: DATE_FORMATS.mediumDate});

    return (
        <SheetViewRenderer
            config={viewConfig}
            url="/api/marketplace/orderDelivery/single"
            fetchId={fetchId ?? entityId}
            onDataFetched={(data) => setSheetData(data)}
            data={sheetData}
            open={open}
            onOpenChange={onOpenChange}
            resolveLanguageKey={resolveLanguageKey}
            // The order's listing and the day it was delivered, the order number as a badge (UX-01, UX-02).
            headerTitle={<SheetNameTitle name={[orderTitle, submittedOn].filter(Boolean).join(" · ")} code={delivery.order?.name} typeLabel={String(resolveLanguageKey("orderDeliverySubtitle"))} />}
            headerDescription={<StatusBadge tableConfigKey="orderdeliveries" field="status" value={delivery.status} label={String(resolveLanguageKey(`orderDeliveryStatus.${delivery.status}`))} />}
            access={access}
            hideEdit
            hideDelete
            hideRestore
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/orderDeliveries/center/sheetView/orderDeliverySheetView.tsx"),
    withDebug(true, true, "orderDeliveries"),
)(OrderDeliverySheetView);
