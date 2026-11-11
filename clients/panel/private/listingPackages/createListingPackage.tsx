import { IconPlus } from "@tabler/icons-react";
import { createGenericCreatePage } from "@coreModule/components/entityPage/pages/createGenericCreatePage.tsx";
import { createListingPackageFormSchema } from "armonia/src/modules/marketplace/api/marketplace/private/listingPackage/createListingPackage.form.validator.ts";
import type { CreateListingPackageFormType } from "armonia/src/modules/marketplace/api/marketplace/private/listingPackage/listingPackage.schema-def.ts";

export default createGenericCreatePage<CreateListingPackageFormType>({
    languagePath: "src/modules/marketplace/clients/panel/private/listingPackages/createListingPackage.tsx",
    collectionName: "listingpackages",
    accessModel: "listingPackages",
    apiUrl: "/api/marketplace/listingPackage",
    schema: createListingPackageFormSchema,
    defaultValues: (params) => ({
        listing: params.get("listingId") || "",
        name: "",
        description: "",
        price: {amount: 0, currency: ""},
        deliveryDays: 1,
        order: undefined,
    }),
    submitIcon: <IconPlus />,
});
