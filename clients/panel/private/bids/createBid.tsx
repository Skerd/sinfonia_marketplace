import {IconPlus} from "@tabler/icons-react";
import {createGenericCreatePage} from "@coreModule/components/entityPage/pages/createGenericCreatePage.tsx";
import {createBidFormSchema} from "armonia/src/modules/marketplace/api/marketplace/private/bid/createBid.form.validator.ts";
import type {CreateBidFormType} from "armonia/src/modules/marketplace/api/marketplace/private/bid/bid.schema-def.ts";

export default createGenericCreatePage<CreateBidFormType>({
    languagePath: "src/modules/marketplace/clients/panel/private/bids/createBid.tsx",
    collectionName: "marketplacebids",
    accessModel: "marketplacebids",
    apiUrl: "/api/marketplace/bid",
    schema: createBidFormSchema,
    defaultValues: {taskRequest: "", proposal: ""},
    submitIcon: <IconPlus />,
});
