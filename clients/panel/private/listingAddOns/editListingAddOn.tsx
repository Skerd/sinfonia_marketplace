import {IconDeviceFloppy} from "@tabler/icons-react";
import { createGenericEditPage } from "@coreModule/components/entityPage/pages/createGenericEditPage.tsx";
import { editListingAddOnFormSchema } from "armonia/src/modules/marketplace/api/marketplace/private/listingAddOn/editListingAddOn.form.validator.ts";
import type { ListingAddOn } from "armonia/src/modules/marketplace/api/marketplace/private/listingAddOn/listingAddOn.dto.ts";
import type { EditListingAddOnFormType } from "armonia/src/modules/marketplace/api/marketplace/private/listingAddOn/listingAddOn.schema-def.ts";

export default createGenericEditPage<ListingAddOn, EditListingAddOnFormType>({
    languagePath: "src/modules/marketplace/clients/panel/private/listingAddOns/editListingAddOn.tsx",
    collectionName: "listingaddons",
    accessModel: "listingAddOns",
    apiUrl: "/api/marketplace/listingAddOn",
    schema: editListingAddOnFormSchema,
    buildInitialValues: (data, writeFields) => ({
        _id: data._id,
        // Read-only after create: shown so the provider sees which listing the row belongs to
        listing: data.listing?._id,
        name: writeFields.name ? data.name : undefined,
        price: writeFields.price
            ? {amount: data.price.amount, currency: data.price.currency?._id}
            : undefined,
        deliveryDays: writeFields.deliveryDays ? data.deliveryDays : undefined,
    }),
    submitIcon: <IconDeviceFloppy />,
});
