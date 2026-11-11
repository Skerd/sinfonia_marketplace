import {compose} from "redux";
import {useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import type {ListingPackage} from "armonia/src/modules/marketplace/api/marketplace/private/listingPackage/listingPackage.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";

type ListingPackageSheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    listingPackage?: ListingPackage;
    hideActions?: boolean;
    onDelete?: (response?: DeletedData) => void;
    onRestore?: () => void;
    onSheetRowPatched?: (patch: Partial<ListingPackage>) => void;
    fetchId?: string;
};

function listingPackageEditPath(pkg: ListingPackage) {
    if (!pkg._id) return "";
    const params = new URLSearchParams();
    params.set("listingPackageId", pkg._id);
    if (pkg.name) params.set("listingPackageName", pkg.name);
    return `/marketplace/listingpackages/edit?${params.toString()}`;
}

function ListingPackageSheetView({
    open,
    onOpenChange,
    listingPackage: pkgProp,
    resolveLanguageKey,
    hideActions = false,
    onDelete = () => {},
    onRestore = () => {},
    onSheetRowPatched,
    fetchId,
}: ListingPackageSheetViewOwnProps & WithLanguageType) {
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(pkgProp || {_id: fetchId});
    const access = useAccess("listingPackages");
    const viewConfig = useViewConfig("listingpackages", "sheet");

    useEffect(() => {
        if (!pkgProp) return;
        setSheetData(pkgProp);
    }, [pkgProp]);

    const entityId = pkgProp?._id ?? fetchId;
    const asPackage = sheetData as ListingPackage;

    if (!viewConfig || !entityId) return null;

    return (
        <SheetViewRenderer
            config={viewConfig}
            url="/api/marketplace/listingPackage/single"
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
            editPath={listingPackageEditPath(asPackage)}
            onSheetRowPatched={(row) => {
                setSheetData(row);
                onSheetRowPatched?.(row as Partial<ListingPackage>);
            }}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/listingPackages/center/sheetView/listingPackageSheetView.tsx"),
    withDebug(true, true, "listingPackages"),
)(ListingPackageSheetView);
