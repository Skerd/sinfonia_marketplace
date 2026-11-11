import { IconPlus } from "@tabler/icons-react";
import { createGenericCreatePage } from "@coreModule/components/entityPage/pages/createGenericCreatePage.tsx";
import { createListingFlagFormSchema } from "armonia/src/modules/marketplace/api/marketplace/private/listingFlag/createListingFlag.form.validator.ts";
import type { CreateListingFlagFormType } from "armonia/src/modules/marketplace/api/marketplace/private/listingFlag/listingFlag.schema-def.ts";

export default createGenericCreatePage<CreateListingFlagFormType>({
    languagePath: "src/modules/marketplace/clients/panel/private/listingFlags/createListingFlag.tsx",
    collectionName: "listingflags",
    accessModel: "listingflags",
    apiUrl: "/api/marketplace/listingFlag",
    schema: createListingFlagFormSchema,
    // The reporter picks the reason; no reason is preselected (UX-06).
    defaultValues: {listing: "", comment: ""},
    submitIcon: <IconPlus />,
});
