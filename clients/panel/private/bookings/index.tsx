import { compose } from "redux";
import { useMemo } from "react";
import withLanguage, { WithLanguageType } from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import EntityListPage, {EntityListCreateButton, EntityListHeader, type QuickFilterDef} from "@coreModule/components/entityPage/pages/entityListPage.tsx";
import { COLUMN_TYPE } from "armonia/src/modules/core/database/filter/typeOperators.ts";
import { BOOKING_WHEN } from "armonia/src/modules/marketplace/api/marketplace/private/booking/booking.constants.ts";
import { IconPlus } from "@tabler/icons-react";
import type { Booking } from "armonia/src/modules/marketplace/api/marketplace/private/booking/booking.dto.ts";
import type { DeletedData } from "armonia/src/modules/core/types/shared.types.ts";
import BookingCard from "./center/cardView/bookingCard.tsx";

function AllBookings({ resolveLanguageKey }: WithLanguageType) {
    const quickFilters = useMemo<QuickFilterDef[]>(() => [
        {
            // Not a stored field: the list route turns it into a time range in the company's time zone.
            field: "when",
            label: String(resolveLanguageKey("fields.when")),
            type: COLUMN_TYPE.ENUM,
            enumValues: BOOKING_WHEN.map((value) => ({
                value,
                label: String(resolveLanguageKey(`fields.!enums.when.${value}`)),
            })),
            asExtraParam: true,
        },
    ], [resolveLanguageKey]);

    return (
        <EntityListPage<Booking>
            apiUrl="/api/marketplace/booking"
            collectionName="bookings"
            accessModel="bookings"
            tableConfigKey="bookings"
            header={(ctx) => (
                <EntityListHeader ctx={ctx}>
                    <EntityListCreateButton
                        ctx={ctx}
                        path="/marketplace/bookings/create"
                        icon={<IconPlus />}
                        labelKey="createBooking"
                    />
                </EntityListHeader>
            )}
            buildEditPath={() => ""}
            resolveLanguageKey={resolveLanguageKey}
            quickFilters={quickFilters}
            sheetLanguagePath="src/modules/marketplace/clients/panel/private/bookings/center/sheetView/bookingSheetView.tsx"
            rowActionMenu={{ hideEdit: true }}
            renderCard={(booking, onDelete, onRestore) => (
                <BookingCard
                    booking={booking}
                    onDelete={(row: Booking | undefined, response?: DeletedData) => onDelete(row ?? booking, response)}
                    onRestore={() => onRestore(booking)}
                />
            )}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/bookings/index.tsx"),
    withDebug(true, true, "bookings"),
)(AllBookings);
