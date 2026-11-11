import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {IconCalendarEvent, IconUser} from "@tabler/icons-react";
import type {Booking} from "armonia/src/modules/marketplace/api/marketplace/private/booking/booking.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import BookingSheetView from "@marketplaceModule/clients/panel/private/bookings/center/sheetView/bookingSheetView.tsx";
import EntityCard from "@coreModule/components/entityPage/list/card/entityCard.tsx";
import EntityCardRow from "@coreModule/components/entityPage/list/card/entityCardRow.tsx";
import {accessFieldPathExists} from "@coreModule/helpers/context/accessContext.tsx";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";
import type {RefObject} from "react";
import {formatTimeRange} from "@coreModule/helpers/general/dateTime.ts";
import {getName} from "@coreModule/helpers/general/names.ts";
import StatusBadge from "@coreModule/components/entityPage/sheet/statusBadge.tsx";

type BookingCardProps = WithLanguageType & {
    booking: Booking;
    fetchId?: string;
    onDelete?: (deleted?: Booking, response?: DeletedData) => void;
    onRestore?: () => void;
    hideActions?: boolean;
    sheetOnly?: boolean;
    innerRef?: RefObject<WithAxiosLifecycleRef<Booking> | null>;
};

function BookingCard({
    booking,
    resolveLanguageKey,
    fetchId,
    onDelete,
    onRestore,
    hideActions = false,
    sheetOnly = false,
    innerRef,
}: BookingCardProps) {
    return (
        <EntityCard
            resource="bookings"
            entity={booking}
            fetchId={fetchId}
            singleUrl="/api/marketplace/booking/single"
            onDelete={onDelete}
            onRestore={onRestore}
            hideActions={hideActions}
            hideEdit
            sheetOnly={sheetOnly}
            editPath={() => ""}
            Sheet={BookingSheetView}
            sheetEntityProp="booking"
            deleteUrl="/api/marketplace/booking"
            restoreUrl="/api/marketplace/booking/restore"
            failedTitle={resolveLanguageKey("failedTitle")}
            failedDescription={resolveLanguageKey("failedDescription")}
            titlePath="order.listing.title"
            innerRef={innerRef}
            sheetProps={({entity: row, setEntity}) => ({
                fetchId,
                onSheetRowPatched: (patch: Partial<Booking>) => setEntity({...row, ...patch}),
            })}
        >
            {({entity: row, read}) => (
                <>
                    {/* What is booked and for whom; a booking has no status, its order's is shown (UX-01, UX-02). */}
                    <EntityCard.Header
                        titlePath={["order.listing.title", "order.taskRequest.title"]}
                        title={row.order?.listing?.title || row.order?.taskRequest?.title}
                        subtitlePath="order.customer"
                        subtitle={getName(row.order?.customer) || undefined}
                        badgesBesideTitle
                        badges={<StatusBadge tableConfigKey="orders" field="status" value={row.order?.status} label={String(resolveLanguageKey(`orderStatus.${row.order?.status}`))} />}
                    />
                    <EntityCard.Body>
                        {/* The slot as the booking's own time zone reads it (GLB-09, UX-08). */}
                        <EntityCardRow
                            icon={IconCalendarEvent}
                            label={resolveLanguageKey("time")}
                            tooltip={resolveLanguageKey("time")}
                            show={accessFieldPathExists(read, "startAt") && accessFieldPathExists(read, "endAt")}
                            value={formatTimeRange(row.startAt, row.endAt, row.timezone)}
                        />
                        <EntityCardRow
                            icon={IconUser}
                            label={resolveLanguageKey("provider")}
                            tooltip={resolveLanguageKey("provider")}
                            path="provider"
                            type="user"
                            value={row.provider}
                        />
                    </EntityCard.Body>
                </>
            )}
        </EntityCard>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/bookings/center/cardView/bookingCard.tsx"),
    withDebug(true, true, "bookings"),
)(BookingCard);
