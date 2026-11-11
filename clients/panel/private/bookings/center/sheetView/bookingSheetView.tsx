import {compose} from "redux";
import {useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import type {Booking} from "armonia/src/modules/marketplace/api/marketplace/private/booking/booking.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import {getName} from "@coreModule/helpers/general/names.ts";
import SheetNameTitle from "@coreModule/components/entityPage/sheet/sheetNameTitle.tsx";
import StatusBadge from "@coreModule/components/entityPage/sheet/statusBadge.tsx";

type BookingSheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    booking?: Booking;
    hideActions?: boolean;
    onDelete?: (response?: DeletedData) => void;
    onRestore?: () => void;
    onSheetRowPatched?: (patch: Partial<Booking>) => void;
    fetchId?: string;
};

function BookingSheetView({
    open,
    onOpenChange,
    booking: bookingProp,
    resolveLanguageKey,
    hideActions = false,
    onDelete = () => {},
    onRestore = () => {},
    onSheetRowPatched,
    fetchId,
}: BookingSheetViewOwnProps & WithLanguageType) {
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(bookingProp || {_id: fetchId});
    const access = useAccess("bookings");
    const viewConfig = useViewConfig("bookings", "sheet");

    useEffect(() => {
        if (!bookingProp) return;
        setSheetData(bookingProp);
    }, [bookingProp]);

    const entityId = bookingProp?._id ?? fetchId;
    if (!viewConfig || !entityId) return null;
    const booking = sheetData as Booking;
    // A booking has no status of its own: the order it schedules carries it.
    const orderStatus = booking.order?.status;

    return (
        <SheetViewRenderer
            config={viewConfig}
            url="/api/marketplace/booking/single"
            fetchId={fetchId ?? entityId}
            onDataFetched={(data) => setSheetData(data)}
            data={sheetData}
            open={open}
            onOpenChange={onOpenChange}
            resolveLanguageKey={resolveLanguageKey}
            access={access}
            hideActions={hideActions}
            onDelete={onDelete}
            onRestore={onRestore}
            hideEdit
            editPath=""
            // What is booked and for whom, with the order number as a badge (UX-01).
            headerTitle={<SheetNameTitle name={[booking.order?.listing?.title || booking.order?.taskRequest?.title, getName(booking.order?.customer)].filter(Boolean).join(" · ")} code={booking.order?.name} typeLabel={String(resolveLanguageKey("bookingSubtitle"))} />}
            headerDescription={<StatusBadge tableConfigKey="orders" field="status" value={orderStatus} label={String(resolveLanguageKey(`orderStatus.${orderStatus}`))} />}
            onSheetRowPatched={(row) => {
                setSheetData(row);
                onSheetRowPatched?.(row as Partial<Booking>);
            }}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/bookings/center/sheetView/bookingSheetView.tsx"),
    withDebug(true, true, "bookings"),
)(BookingSheetView);
