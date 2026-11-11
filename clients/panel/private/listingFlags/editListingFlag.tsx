import {IconDeviceFloppy} from "@tabler/icons-react";
import { createGenericEditPage } from "@coreModule/components/entityPage/pages/createGenericEditPage.tsx";
import { updateListingFlagFormSchema } from "armonia/src/modules/marketplace/api/marketplace/private/listingFlag/updateListingFlag.form.validator.ts";
import type { ListingFlag } from "armonia/src/modules/marketplace/api/marketplace/private/listingFlag/listingFlag.dto.ts";
import type {EditListingFlagFormType} from "armonia/src/modules/marketplace/api/marketplace/private/listingFlag/listingFlag.schema-def.ts";

export default createGenericEditPage<ListingFlag, EditListingFlagFormType>({
    languagePath: "src/modules/marketplace/clients/panel/private/listingFlags/editListingFlag.tsx",
    collectionName: "listingflags",
    accessModel: "listingflags",
    apiUrl: "/api/marketplace/listingFlag",
    schema: updateListingFlagFormSchema,
    buildInitialValues: (data, writeFields) => ({
        _id: data._id,
        reason: writeFields.reason ? data.reason : undefined,
        comment: writeFields.comment ? (data.comment ?? "") : undefined,
    }),
    submitIcon: <IconDeviceFloppy />,
});
