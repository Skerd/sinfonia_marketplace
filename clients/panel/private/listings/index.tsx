import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import EntityListPage, {EntityListCreateButton, EntityListHeader} from "@coreModule/components/entityPage/pages/entityListPage.tsx";
import {IconPlus} from "@tabler/icons-react";
import type {Listing} from "armonia/src/modules/marketplace/api/marketplace/private/listing/listing.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import ListingCard from "./center/cardView/listingCard.tsx";
import ActivateListingDropdown from "@marketplaceModule/clients/panel/private/listings/center/actions/activateListingDropdown.tsx";
import DeactivateListingDropdown from "@marketplaceModule/clients/panel/private/listings/center/actions/deactivateListingDropdown.tsx";
import CreateOrderFromListingDropdown from "@marketplaceModule/clients/panel/private/listings/center/actions/createOrderFromListingDropdown.tsx";
import ChangeListingStatusAction from "@marketplaceModule/components/custom/listings/changeListingStatusAction.tsx";
import CreateOrderFromListingAction from "@marketplaceModule/components/custom/listings/createOrderFromListingAction.tsx";

export function listingEditPath(listing: Pick<Listing, "_id" | "title">) {
    const params = new URLSearchParams();
    params.set("listingId", listing._id);
    if (listing.title) params.set("listingTitle", listing.title);
    return `/marketplace/listings/edit?${params.toString()}`;
}

function AllListings({resolveLanguageKey}: WithLanguageType) {
    return (
        <EntityListPage<Listing>
            apiUrl="/api/marketplace/listing"
            collectionName="listings"
            accessModel="listings"
            tableConfigKey="listings"
            header={(ctx) => (
                <EntityListHeader ctx={ctx}>
                    <EntityListCreateButton
                        ctx={ctx}
                        path="/marketplace/listings/create"
                        icon={<IconPlus />}
                        labelKey="createListing"
                    />
                </EntityListHeader>
            )}
            buildEditPath={listingEditPath}
            resolveLanguageKey={resolveLanguageKey}
            sheetLanguagePath="src/modules/marketplace/clients/panel/private/listings/center/sheetView/listingSheetView.tsx"
            // cardViewClassName="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            rowActionMenu={{allowMenuForCustomChildren: true}}
            renderActionMenuChildren={(entity, bindRowAction) => (
                <>
                    {entity.status !== "active" && !entity.deletedAt && (
                        <ActivateListingDropdown onAction={bindRowAction} />
                    )}
                    {entity.status !== "inactive" && !entity.deletedAt && (
                        <DeactivateListingDropdown onAction={bindRowAction} />
                    )}
                    <CreateOrderFromListingDropdown listing={entity} onAction={bindRowAction} />
                </>
            )}
            renderFloatingModals={({action, entity, resetAction, listRef}) => {
                if (action === "createOrderFromListing") {
                    return (
                        <CreateOrderFromListingAction
                            listingId={entity._id}
                            displayName={entity.title}
                            openAlert
                            url="/api/marketplace/order/createFromListing"
                            onSuccess={resetAction}
                            onCancel={resetAction}
                        />
                    );
                }
                if (action !== "activate" && action !== "deactivate") return null;
                return (
                    <ChangeListingStatusAction
                        listingId={entity._id}
                        listingTitle={entity.title}
                        targetStatus={action === "activate" ? "active" : "inactive"}
                        openAlert
                        url={`/api/marketplace/listing/${action}`}
                        onSuccess={(newStatus: string) => {
                            listRef.current?.updateRow?.(entity._id, {status: newStatus} as Partial<Listing>);
                            resetAction();
                        }}
                        onCancel={resetAction}
                    />
                );
            }}
            renderCard={(listing, onDelete, onRestore) => (
                <ListingCard
                    listing={listing}
                    onDelete={(row: Listing, response?: DeletedData) => onDelete(row ?? listing, response)}
                    onRestore={() => onRestore(listing)}
                />
            )}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/listings/index.tsx"),
    withDebug(true, true, "listings"),
)(AllListings);
