import {IconDeviceFloppy} from "@tabler/icons-react";
import { createGenericEditPage } from "@coreModule/components/entityPage/pages/createGenericEditPage.tsx";
import { editListingPackageFormSchema } from "armonia/src/modules/marketplace/api/marketplace/private/listingPackage/editListingPackage.form.validator.ts";
import type { ListingPackage } from "armonia/src/modules/marketplace/api/marketplace/private/listingPackage/listingPackage.dto.ts";
import type { EditListingPackageFormType } from "armonia/src/modules/marketplace/api/marketplace/private/listingPackage/listingPackage.schema-def.ts";

export default createGenericEditPage<ListingPackage, EditListingPackageFormType>({
    languagePath: "src/modules/marketplace/clients/panel/private/listingPackages/editListingPackage.tsx",
    collectionName: "listingpackages",
    accessModel: "listingPackages",
    apiUrl: "/api/marketplace/listingPackage",
    schema: editListingPackageFormSchema,
    buildInitialValues: (data, writeFields) => ({
        _id: data._id,
        // Read-only after create: shown so the provider sees which listing the row belongs to
        listing: data.listing?._id,
        name: writeFields.name ? data.name : undefined,
        description: writeFields.description ? (data.description ?? "") : undefined,
        price: writeFields.price
            ? {amount: data.price.amount, currency: data.price.currency?._id}
            : undefined,
        deliveryDays: writeFields.deliveryDays ? data.deliveryDays : undefined,
        order: writeFields.order ? data.order : undefined,
    }),
    submitIcon: <IconDeviceFloppy />,
});
