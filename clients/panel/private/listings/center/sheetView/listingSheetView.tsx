import {compose} from "redux";
import {useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {Listing} from "armonia/src/modules/marketplace/api/marketplace/private/listing/listing.dto.ts";
import type {DeleteResponse} from "armonia/src/modules/core/types/shared.types.ts";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import SheetNameTitle from "@coreModule/components/entityPage/sheet/sheetNameTitle.tsx";
import StatusBadge from "@coreModule/components/entityPage/sheet/statusBadge.tsx";
import ActivateListingDropdown from "@marketplaceModule/clients/panel/private/listings/center/actions/activateListingDropdown.tsx";
import DeactivateListingDropdown from "@marketplaceModule/clients/panel/private/listings/center/actions/deactivateListingDropdown.tsx";
import ChangeListingStatusAction from "@marketplaceModule/components/custom/listings/changeListingStatusAction.tsx";
import CreateOrderFromListingDropdown from "@marketplaceModule/clients/panel/private/listings/center/actions/createOrderFromListingDropdown.tsx";
import CreateOrderFromListingAction from "@marketplaceModule/components/custom/listings/createOrderFromListingAction.tsx";

export type ListingSheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    listing?: Listing;
    hideActions?: boolean;
    onDelete?: (response?: DeleteResponse) => void;
    onRestore?: () => void;
    onSheetRowPatched?: (patch: Partial<Listing>) => void;
    fetchId?: string;
};

function listingEditPath(row: Listing) {
    const params = new URLSearchParams();
    params.set("listingId", row._id);
    if (row.title) params.set("listingTitle", row.title);
    return `/marketplace/listings/edit?${params.toString()}`;
}

function ListingSheetView({
    open,
    onOpenChange,
    listing: listingProp,
    resolveLanguageKey,
    hideActions = false,
    onDelete = () => {},
    onRestore = () => {},
    onSheetRowPatched,
    fetchId,
}: ListingSheetViewOwnProps & WithLanguageType) {
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(listingProp || {_id: fetchId});
    const [action, setAction] = useState("");
    const access = useAccess("listings");
    const viewConfig = useViewConfig("listings", "sheet");

    useEffect(() => {
        if (!listingProp) return;
        setSheetData(listingProp);
    }, [listingProp]);

    useEffect(() => {
        if (!open) setAction("");
    }, [open]);

    const entityId = listingProp?._id ?? fetchId;
    const asListing = sheetData as Listing;

    if (!viewConfig) return null;
    if (!entityId) return null;

    return (
        <>
            <SheetViewRenderer
                config={viewConfig}
                url="/api/marketplace/listing/single"
                fetchId={fetchId ?? entityId}
                onDataFetched={(data) => setSheetData(data)}
                data={sheetData}
                open={open}
                onOpenChange={onOpenChange}
                resolveLanguageKey={resolveLanguageKey}
                // Named by its title with the LIST-… code as a badge and its status in tone (UX-01, UX-02).
                headerTitle={<SheetNameTitle name={asListing.title ?? ""} code={asListing.name} typeLabel={String(resolveLanguageKey("listingSubtitle"))} />}
                headerDescription={<StatusBadge tableConfigKey="listings" field="status" value={asListing.status} label={String(resolveLanguageKey(`listingStatus.${asListing.status}`))} />}
                access={access}
                hideActions={hideActions}
                onDelete={onDelete}
                onRestore={onRestore}
                editPath={listingEditPath(asListing)}
                onSheetRowPatched={(row) => {
                    setSheetData(row);
                    onSheetRowPatched?.(row as Partial<Listing>);
                }}
                actionMenuAllowCustomChildren
                actionMenuChildren={
                    <>
                        {asListing.status !== "active" && !asListing.deletedAt && (
                            <ActivateListingDropdown onAction={setAction} />
                        )}
                        {asListing.status !== "inactive" && !asListing.deletedAt && (
                            <DeactivateListingDropdown onAction={setAction} />
                        )}
                        <CreateOrderFromListingDropdown listing={asListing} onAction={setAction} />
                    </>
                }
            />
            {(action === "activate" || action === "deactivate") && (
                <ChangeListingStatusAction
                    listingId={asListing._id}
                    listingTitle={asListing.title}
                    targetStatus={action === "activate" ? "active" : "inactive"}
                    openAlert
                    url={`/api/marketplace/listing/${action}`}
                    onSuccess={(newStatus: string) => {
                        const patch = {status: newStatus};
                        setSheetData({...sheetData, ...patch});
                        onSheetRowPatched?.(patch);
                        setAction("");
                    }}
                    onCancel={() => setAction("")}
                />
            )}
            {action === "createOrderFromListing" && (
                <CreateOrderFromListingAction
                    listingId={asListing._id}
                    displayName={asListing.title}
                    openAlert
                    url="/api/marketplace/order/createFromListing"
                    onSuccess={() => setAction("")}
                    onCancel={() => setAction("")}
                />
            )}
        </>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/listings/center/sheetView/listingSheetView.tsx"),
    withDebug(true, true, "listings"),
)(ListingSheetView);
