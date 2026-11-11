import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {IconClock, IconCurrencyDollar, IconUser} from "@tabler/icons-react";
import type {ListingAddOn} from "armonia/src/modules/marketplace/api/marketplace/private/listingAddOn/listingAddOn.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import ListingAddOnSheetView from "@marketplaceModule/clients/panel/private/listingAddOns/center/sheetView/listingAddOnSheetView.tsx";
import EntityCard from "@coreModule/components/entityPage/list/card/entityCard.tsx";
import EntityCardRow from "@coreModule/components/entityPage/list/card/entityCardRow.tsx";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";
import type {RefObject} from "react";

function listingAddOnEditPath(addOn: ListingAddOn) {
    const params = new URLSearchParams();
    params.set("listingAddOnId", addOn._id);
    return `/marketplace/listingaddons/edit?${params.toString()}`;
}

type ListingAddOnCardProps = WithLanguageType & {
    listingAddOn: ListingAddOn;
    fetchId?: string;
    onDelete?: (deleted?: ListingAddOn, response?: DeletedData) => void;
    onRestore?: () => void;
    hideActions?: boolean;
    sheetOnly?: boolean;
    innerRef?: RefObject<WithAxiosLifecycleRef<ListingAddOn> | null>;
};

function ListingAddOnCard({
    listingAddOn,
    resolveLanguageKey,
    fetchId,
    onDelete,
    onRestore,
    hideActions = false,
    sheetOnly = false,
    innerRef,
}: ListingAddOnCardProps) {
    return (
        <EntityCard
            resource="listingAddOns"
            entity={listingAddOn}
            fetchId={fetchId}
            singleUrl="/api/marketplace/listingAddOn/single"
            onDelete={onDelete}
            onRestore={onRestore}
            hideActions={hideActions}
            sheetOnly={sheetOnly}
            editPath={listingAddOnEditPath}
            Sheet={ListingAddOnSheetView}
            sheetEntityProp="listingAddOn"
            deleteUrl="/api/marketplace/listingAddOn"
            restoreUrl="/api/marketplace/listingAddOn/restore"
            failedTitle={resolveLanguageKey("failedTitle")}
            failedDescription={resolveLanguageKey("failedDescription")}
            titlePath="name"
            innerRef={innerRef}
            sheetProps={({entity: row, setEntity}) => ({
                fetchId,
                onSheetRowPatched: (patch: Partial<ListingAddOn>) => setEntity({...row, ...patch}),
            })}
        >
            {({entity: row}) => (
                <>
                    {/* The listing it belongs to is the subtitle, so the body keeps who → when → how much (UX-02). */}
                    <EntityCard.Header titlePath="name" title={row.name} subtitlePath="listing.title" subtitle={row.listing?.title} />
                    <EntityCard.Body>
                        <EntityCardRow
                            icon={IconUser}
                            label={resolveLanguageKey("provider")}
                            tooltip={resolveLanguageKey("provider")}
                            path="provider"
                            type="user"
                            value={row.provider}
                        />
                        {row.deliveryDays != null ? (
                            <EntityCardRow
                                icon={IconClock}
                                label={resolveLanguageKey("deliveryDays")}
                                tooltip={resolveLanguageKey("deliveryDays")}
                                path="deliveryDays"
                                type="number"
                                value={row.deliveryDays}
                            >
                                {(formatted) => (
                                    <>
                                        {formatted} {resolveLanguageKey("days")}
                                    </>
                                )}
                            </EntityCardRow>
                        ) : null}
                        <EntityCardRow
                            icon={IconCurrencyDollar}
                            label={resolveLanguageKey("priceAmount")}
                            tooltip={resolveLanguageKey("priceAmount")}
                            path="price"
                            type="currency"
                            value={{amount: row.price?.amount, currency: row.price?.currency}}
                        />
                    </EntityCard.Body>
                </>
            )}
        </EntityCard>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/listingAddOns/center/cardView/listingAddOnCard.tsx"),
    withDebug(true, true, "listingAddOns"),
)(ListingAddOnCard);
