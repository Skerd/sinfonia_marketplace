import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import EntityListPage, {EntityListCreateButton, EntityListHeader} from "@coreModule/components/entityPage/pages/entityListPage.tsx";
import {IconPlus} from "@tabler/icons-react";
import PlatformListHierarchy, {PlatformListViewSwitch, usePlatformListView} from "@coreModule/components/entityPage/hierarchy/platformListHierarchy.tsx";
import type {ListingCategory} from "armonia/src/modules/marketplace/api/marketplace/private/listingCategory/listingCategory.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import ListingCategoryCard from "@marketplaceModule/clients/panel/private/listingCategories/center/cardView/categoryCard.tsx";
import ListingCategorySheetView from "@marketplaceModule/clients/panel/private/listingCategories/center/sheetView/categorySheetView.tsx";

const LIST_BASE = "/tenancy/systemSettings/listingcategories";

function categoryEditPath(category: ListingCategory) {
    const params = new URLSearchParams();
    params.set("categoryId", category._id);
    if (category.name) params.set("categoryName", category.name);
    return `${LIST_BASE}/edit?${params.toString()}`;
}

/**
 * The platform's service categories (D196): one tree every company reads. The platform company edits it; another
 * company requests a missing service with the same create form (the create button turns into a request).
 */
function AllListingCategories({resolveLanguageKey}: WithLanguageType) {
    const [view, setView] = usePlatformListView();
    const viewSwitch = <PlatformListViewSwitch view={view} onChange={setView} resolveLanguageKey={resolveLanguageKey} />;

    if (view === "hierarchy") {
        return (
            <div className="min-w-0 flex-full gap-4">
                <EntityListHeader ctx={{resolveLanguageKey, canCreate: false, canRequest: false}}>{viewSwitch}</EntityListHeader>
                <PlatformListHierarchy
                    treeUrl="/api/marketplace/listingCategory/tree"
                    renderSheet={({id, onClose, onDeleted}) => (
                        <ListingCategorySheetView
                            open
                            onOpenChange={(next: boolean) => {
                                if (!next) onClose();
                            }}
                            fetchId={id}
                            onDelete={onDeleted}
                        />
                    )}
                />
            </div>
        );
    }

    return (
        <EntityListPage<ListingCategory>
            apiUrl="/api/marketplace/listingCategory"
            collectionName="listingcategories"
            accessModel="listingcategories"
            tableConfigKey="listingcategories"
            header={(ctx) => (
                <EntityListHeader ctx={ctx}>
                    {viewSwitch}
                    <EntityListCreateButton
                        ctx={ctx}
                        path={`${LIST_BASE}/create`}
                        icon={<IconPlus />}
                        labelKey="createCategory"
                    />
                </EntityListHeader>
            )}
            buildEditPath={categoryEditPath}
            resolveLanguageKey={resolveLanguageKey}
            configurations={{limit: 20}}
            cardViewClassName="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            renderCard={(category, onDelete, onRestore) => (
                <ListingCategoryCard
                    category={category}
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
