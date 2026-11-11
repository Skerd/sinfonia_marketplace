import {IconPlus} from "@tabler/icons-react";
import {createGenericCreatePage} from "@coreModule/components/entityPage/pages/createGenericCreatePage.tsx";
import {createProviderProfileFormSchema} from "armonia/src/modules/marketplace/api/marketplace/private/providerProfile/createProviderProfile.form.validator.ts";
import type {CreateProviderProfileFormType} from "armonia/src/modules/marketplace/api/marketplace/private/providerProfile/providerProfile.schema-def.ts";

export default createGenericCreatePage<CreateProviderProfileFormType>({
    languagePath: "src/modules/marketplace/clients/panel/private/providerProfile/createProviderProfile.tsx",
    collectionName: "providerprofiles",
    accessModel: "providerProfiles",
    apiUrl: "/api/marketplace/providerProfile",
    schema: createProviderProfileFormSchema,
    // A new profile's hours start in the company's time zone (UX-06, GLB-09).
    defaultValues: (params, {timeZone}) => ({
        userId: params.get("specificUserId") ?? "",
        bio: "",
        skills: [],
        portfolio: [],
        availability: [],
        timezone: timeZone,
    }),
    buildFormExtras: (params) => ({lockUser: !!params.get("specificUserId")}),
    submitIcon: <IconPlus />,
});
