import {compose} from "redux";
import {useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import type {ListingAddOn} from "armonia/src/modules/marketplace/api/marketplace/private/listingAddOn/listingAddOn.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";

type ListingAddOnSheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    listingAddOn?: ListingAddOn;
    hideActions?: boolean;
    onDelete?: (response?: DeletedData) => void;
    onRestore?: () => void;
    onSheetRowPatched?: (patch: Partial<ListingAddOn>) => void;
    fetchId?: string;
};

function listingAddOnEditPath(addOn: ListingAddOn) {
    if (!addOn._id) return "";
    const params = new URLSearchParams();
    params.set("listingAddOnId", addOn._id);
    if (addOn.name) params.set("listingAddOnName", addOn.name);
    return `/marketplace/listingaddons/edit?${params.toString()}`;
}

function ListingAddOnSheetView({
    open,
    onOpenChange,
    listingAddOn: addOnProp,
    resolveLanguageKey,
    hideActions = false,
    onDelete = () => {},
    onRestore = () => {},
    onSheetRowPatched,
    fetchId,
}: ListingAddOnSheetViewOwnProps & WithLanguageType) {
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(addOnProp || {_id: fetchId});
    const access = useAccess("listingAddOns");
    const viewConfig = useViewConfig("listingaddons", "sheet");

    useEffect(() => {
        if (!addOnProp) return;
        setSheetData(addOnProp);
    }, [addOnProp]);

    const entityId = addOnProp?._id ?? fetchId;
    const asAddOn = sheetData as ListingAddOn;

    if (!viewConfig || !entityId) return null;

    return (
        <SheetViewRenderer
            config={viewConfig}
            url="/api/marketplace/listingAddOn/single"
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
            editPath={listingAddOnEditPath(asAddOn)}
            onSheetRowPatched={(row) => {
                setSheetData(row);
                onSheetRowPatched?.(row as Partial<ListingAddOn>);
            }}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/listingAddOns/center/sheetView/listingAddOnSheetView.tsx"),
    withDebug(true, true, "listingAddOns"),
)(ListingAddOnSheetView);
