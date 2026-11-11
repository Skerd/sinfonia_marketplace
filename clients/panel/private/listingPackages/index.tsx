import { compose } from "redux";
import withLanguage, { WithLanguageType } from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import EntityListPage, {EntityListCreateButton, EntityListHeader} from "@coreModule/components/entityPage/pages/entityListPage.tsx";
import { IconPlus } from "@tabler/icons-react";
import type { ListingPackage } from "armonia/src/modules/marketplace/api/marketplace/private/listingPackage/listingPackage.dto.ts";
import type { DeletedData } from "armonia/src/modules/core/types/shared.types.ts";
import ListingPackageCard from "./center/cardView/listingPackageCard.tsx";

function buildListingPackageEditPath(pkg: ListingPackage) {
    const params = new URLSearchParams();
    params.set("listingPackageId", pkg._id);
    return `/marketplace/listingpackages/edit?${params.toString()}`;
}

function AllListingPackages({ resolveLanguageKey }: WithLanguageType) {
    return (
        <EntityListPage<ListingPackage>
            apiUrl="/api/marketplace/listingPackage"
            collectionName="listingPackages"
            accessModel="listingPackages"
            tableConfigKey="listingpackages"
            header={(ctx) => (
                <EntityListHeader ctx={ctx}>
                    <EntityListCreateButton
                        ctx={ctx}
                        path="/marketplace/listingpackages/create"
                        icon={<IconPlus />}
                        labelKey="createListingPackage"
                    />
                </EntityListHeader>
            )}
            buildEditPath={buildListingPackageEditPath}
            resolveLanguageKey={resolveLanguageKey}
            sheetLanguagePath="src/modules/marketplace/clients/panel/private/listingPackages/center/sheetView/listingPackageSheetView.tsx"
            renderCard={(pkg, onDelete, onRestore) => (
                <ListingPackageCard
                    listingPackage={pkg}
                    onDelete={(row: ListingPackage | undefined, response?: DeletedData) => onDelete(row ?? pkg, response)}
                    onRestore={() => onRestore(pkg)}
                />
            )}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/listingPackages/index.tsx"),
    withDebug(true, true, "listingPackages"),
)(AllListingPackages);
