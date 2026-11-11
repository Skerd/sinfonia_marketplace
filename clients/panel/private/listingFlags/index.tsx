import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import EntityListPage, {EntityListCreateButton, EntityListHeader} from "@coreModule/components/entityPage/pages/entityListPage.tsx";
import {IconPlus} from "@tabler/icons-react";
import type {ListingFlag} from "armonia/src/modules/marketplace/api/marketplace/private/listingFlag/listingFlag.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import ListingFlagCard from "./center/cardView/listingFlagCard.tsx";
import ListingFlagSheetView from "./center/sheetView/listingFlagSheetView.tsx";
import ResolveListingFlagDropdown from "@marketplaceModule/clients/panel/private/listingFlags/center/actions/resolveListingFlagDropdown.tsx";
import DismissListingFlagDropdown from "@marketplaceModule/clients/panel/private/listingFlags/center/actions/dismissListingFlagDropdown.tsx";
import ChangeListingFlagLifecycleAction from "@marketplaceModule/components/custom/listingFlags/changeListingFlagLifecycleAction.tsx";

function buildListingFlagEditPath(flag: ListingFlag) {
    const params = new URLSearchParams();
    params.set("listingFlagId", flag._id);
    return `/marketplace/listingflags/edit?${params.toString()}`;
}

function listingFlagRowLabel(flag: ListingFlag): string {
    return flag.listing?.title?.trim() || flag._id;
}

function AllListingFlags({resolveLanguageKey}: WithLanguageType) {
    return (
        <EntityListPage<ListingFlag>
            apiUrl="/api/marketplace/listingFlag"
            collectionName="listingflags"
            accessModel="listingflags"
            tableConfigKey="listingflags"
            header={(ctx) => (
                <EntityListHeader ctx={ctx}>
                    <EntityListCreateButton
                        ctx={ctx}
                        path="/marketplace/listingflags/create"
                        icon={<IconPlus />}
                        labelKey="createListingFlag"
                    />
                </EntityListHeader>
            )}
            buildEditPath={buildListingFlagEditPath}
            resolveLanguageKey={resolveLanguageKey}
            sheetLanguagePath="src/modules/marketplace/clients/panel/private/listingFlags/center/sheetView/listingFlagSheetView.tsx"
            rowActionMenu={{
                allowMenuForCustomChildren: true,
                hideEdit: (flag) => flag.status !== "pending",
            }}
            renderActionMenuChildren={(flag, bindRowAction) => (
                <>
                    <ResolveListingFlagDropdown listingFlag={flag} onAction={bindRowAction} />
                    <DismissListingFlagDropdown listingFlag={flag} onAction={bindRowAction} />
                </>
            )}
            renderFloatingModals={({action, entity, resetAction, listRef}) => {
                if (action !== "resolve" && action !== "dismiss") {
                    return null;
                }
                return (
                    <ChangeListingFlagLifecycleAction
                        listingFlagId={entity._id}
                        listingFlagTitle={listingFlagRowLabel(entity)}
                        verb={action}
                        openAlert
                        url={`/api/marketplace/listingFlag/${action}`}
                        onSuccess={(patch: Partial<ListingFlag>) => {
                            listRef.current?.updateRow?.(entity._id, patch);
                            resetAction();
                        }}
                        onCancel={resetAction}
                    />
                );
            }}
            buildDeleteConfirmLabel={(entity) => listingFlagRowLabel(entity)}
            renderSheet={({entity, open, onOpenChange, onDelete, onRestore, listRef}) => (
                <ListingFlagSheetView
                    open={open}
                    onOpenChange={(opened: boolean) => {
                        if (!opened) {
                            onOpenChange();
                        }
                    }}
                    listingFlag={entity}
                    onDelete={onDelete}
                    onRestore={onRestore}
                    onListLifecyclePatched={(patch: Partial<ListingFlag>) => {
                        listRef.current?.updateRow?.(entity._id, patch);
                    }}
                />
            )}
            renderCard={(flag, onDelete, onRestore, listRef) => (
                <ListingFlagCard
                    listingFlag={flag}
                    onDelete={(row: ListingFlag | undefined, response?: DeletedData) => onDelete(row ?? flag, response)}
                    onRestore={() => onRestore(flag)}
                    onLifecyclePatched={(patch: Partial<ListingFlag>) => listRef?.current?.updateRow?.(flag._id, patch)}
                />
            )}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/listingFlags/index.tsx"),
    withDebug(true, true, "listingflags"),
)(AllListingFlags);
