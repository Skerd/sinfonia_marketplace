import {compose} from "redux";
import {useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {ListingCategory} from "armonia/src/modules/marketplace/api/marketplace/private/listingCategory/listingCategory.dto.ts";
import type {DeleteResponse} from "armonia/src/modules/core/types/shared.types.ts";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";

const LIST_BASE = "/tenancy/systemSettings/listingcategories";

export type ListingCategorySheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category?: ListingCategory;
    hideActions?: boolean;
    onDelete?: (response?: DeleteResponse) => void;
    onRestore?: () => void;
    fetchId?: string;
};

function categoryEditPath(cat: ListingCategory) {
    const params = new URLSearchParams();
    params.set("categoryId", cat._id);
    if (cat.name) params.set("categoryName", cat.name);
    return `${LIST_BASE}/edit?${params.toString()}`;
}

function ListingCategorySheetView({
    open,
    onOpenChange,
    category: categoryProp,
    resolveLanguageKey,
    hideActions = false,
    onDelete = () => {},
    onRestore = () => {},
    fetchId,
}: ListingCategorySheetViewOwnProps & WithLanguageType) {
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(categoryProp || {_id: fetchId});
    const access = useAccess("listingcategories");
    const viewConfig = useViewConfig("listingcategories", "sheet");

    useEffect(() => {
        if (!categoryProp) return;
        setSheetData(categoryProp);
    }, [categoryProp]);

    const entityId = categoryProp?._id ?? fetchId;

    if (!viewConfig) return null;
    if (!entityId) return null;

    return (
        <SheetViewRenderer
            config={viewConfig}
            url="/api/marketplace/listingCategory/single"
            fetchId={fetchId}
            onDataFetched={(data) => {
                setSheetData(data);
            }}
            data={sheetData}
            open={open}
            onOpenChange={onOpenChange}
            resolveLanguageKey={resolveLanguageKey}
            access={access}
            hideActions={hideActions}
            onDelete={onDelete}
            onRestore={onRestore}
            editPath={categoryEditPath(sheetData as ListingCategory)}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/listingCategories/center/sheetView/categorySheetView.tsx"),
    withDebug(true, true, "listingcategories"),
)(ListingCategorySheetView);
