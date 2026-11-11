import { compose } from "redux";
import withLanguage, { WithLanguageType } from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import EntityListPage, {EntityListCreateButton, EntityListHeader} from "@coreModule/components/entityPage/pages/entityListPage.tsx";
import { IconPlus } from "@tabler/icons-react";
import type { ListingAddOn } from "armonia/src/modules/marketplace/api/marketplace/private/listingAddOn/listingAddOn.dto.ts";
import type { DeletedData } from "armonia/src/modules/core/types/shared.types.ts";
import ListingAddOnCard from "./center/cardView/listingAddOnCard.tsx";

function buildListingAddOnEditPath(addOn: ListingAddOn) {
    const params = new URLSearchParams();
    params.set("listingAddOnId", addOn._id);
    return `/marketplace/listingaddons/edit?${params.toString()}`;
}

function AllListingAddOns({ resolveLanguageKey }: WithLanguageType) {
    return (
        <EntityListPage<ListingAddOn>
            apiUrl="/api/marketplace/listingAddOn"
            collectionName="listingAddOns"
            accessModel="listingAddOns"
            tableConfigKey="listingaddons"
            header={(ctx) => (
                <EntityListHeader ctx={ctx}>
                    <EntityListCreateButton
                        ctx={ctx}
                        path="/marketplace/listingaddons/create"
                        icon={<IconPlus />}
                        labelKey="createListingAddOn"
                    />
                </EntityListHeader>
            )}
            buildEditPath={buildListingAddOnEditPath}
            resolveLanguageKey={resolveLanguageKey}
            sheetLanguagePath="src/modules/marketplace/clients/panel/private/listingAddOns/center/sheetView/listingAddOnSheetView.tsx"
            renderCard={(addOn, onDelete, onRestore) => (
                <ListingAddOnCard
                    listingAddOn={addOn}
                    onDelete={(row: ListingAddOn, response?: DeletedData) => onDelete(row ?? addOn, response)}
                    onRestore={() => onRestore(addOn)}
                />
            )}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/listingAddOns/index.tsx"),
    withDebug(true, true, "listingAddOns"),
)(AllListingAddOns);
