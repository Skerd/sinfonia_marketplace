import {IconDeviceFloppy} from "@tabler/icons-react";
import {createGenericEditPage} from "@coreModule/components/entityPage/pages/createGenericEditPage.tsx";
import {editMarketplaceConfigFormSchema} from "armonia/src/modules/marketplace/api/marketplace/private/marketplaceConfig/editMarketplaceConfig.form.validator.ts";
import type {EditMarketplaceConfigFormType} from "armonia/src/modules/marketplace/api/marketplace/private/marketplaceConfig/marketplaceConfig.schema-def.ts";
import type {MarketplaceConfig} from "armonia/src/modules/marketplace/api/marketplace/private/marketplaceConfig/marketplaceConfig.dto.ts";

export default createGenericEditPage<MarketplaceConfig, EditMarketplaceConfigFormType>({
    languagePath: "src/modules/marketplace/clients/panel/private/settings/editMarketplaceConfig.tsx",
    collectionName: "marketplaceconfigs",
    accessModel: "marketplaceconfigs",
    apiUrl: "/api/marketplace/marketplaceConfig",
    schema: editMarketplaceConfigFormSchema,
    // `isOperator` is not a form value: it only decides whether the operator's own section shows (D143).
    mapEntityData: ({isOperator: _isOperator, ...data}) => ({...data, currency: data.currency?._id}),
    buildFormExtras: (_entityId, _params, entity) => ({isOperator: entity?.isOperator === true}),
    submitIcon: <IconDeviceFloppy />,
});
