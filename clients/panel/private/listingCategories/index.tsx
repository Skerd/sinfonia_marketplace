import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import EntityListPage, {EntityListCreateButton, EntityListHeader} from "@coreModule/components/entityPage/pages/entityListPage.tsx";
import {IconPlus} from "@tabler/icons-react";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import type {
    ListingCategory,
    ListingCategoryAccessResponse,
} from "armonia/src/modules/marketplace/api/marketplace/private/listingCategory/listingCategory.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import ListingCategoryCard from "@marketplaceModule/clients/panel/private/listingCategories/center/cardView/categoryCard.tsx";
import ListingCategorySheetView from "@marketplaceModule/clients/panel/private/listingCategories/center/sheetView/categorySheetView.tsx";

const LIST_BASE = "/tenancy/systemSettings/listingcategories";
const ACCESS_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/listingCategory/access"};

function categoryEditPath(category: ListingCategory) {
    const params = new URLSearchParams();
    params.set("categoryId", category._id);
    if (category.name) params.set("categoryName", category.name);
    return `${LIST_BASE}/edit?${params.toString()}`;
}

/** The tree is shared by every company and kept by the marketplace operator (D144): others see it read-only. */
function AllListingCategories({resolveLanguageKey}: WithLanguageType) {
    const access = useHttpRequest<ListingCategoryAccessResponse>(ACCESS_REQUEST, {}, 1);
    const canManage = access.data?.data.canManage === true;
    return (
        <EntityListPage<ListingCategory>
            apiUrl="/api/marketplace/listingCategory"
            collectionName="listingcategories"
            accessModel="listingcategories"
            tableConfigKey="listingcategories"
            header={(ctx) => (
                <EntityListHeader ctx={ctx}>
                    {canManage ? (
                        <EntityListCreateButton
                            ctx={ctx}
                            path={`${LIST_BASE}/create`}
                            icon={<IconPlus />}
                            labelKey="createCategory"
                        />
                    ) : access.data ? (
                        <p className="text-sm text-muted-foreground">{resolveLanguageKey("managedByOperator")}</p>
                    ) : null}
                </EntityListHeader>
            )}
            buildEditPath={categoryEditPath}
            resolveLanguageKey={resolveLanguageKey}
            configurations={{limit: 20}}
            renderCard={(category, onDelete, onRestore) => (
                <ListingCategoryCard
                    category={category}
                    hideActions={!canManage}
                    onDelete={(c: ListingCategory | undefined, response?: DeletedData) =>
                        onDelete(c ?? category, response)
                    }
                    onRestore={() => onRestore(category)}
                />
            )}
            renderSheet={({entity, open, onOpenChange, onDelete, onRestore}) => (
                <ListingCategorySheetView
                    open={open}
                    onOpenChange={(opened: boolean) => {
                        if (!opened) onOpenChange();
                    }}
                    category={entity}
                    hideActions={!canManage}
                    onDelete={onDelete}
                    onRestore={onRestore}
                />
            )}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/listingCategories/index.tsx"),
    withDebug(true, true, "listingcategories"),
)(AllListingCategories);
