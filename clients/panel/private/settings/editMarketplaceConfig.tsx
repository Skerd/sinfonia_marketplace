import {IconDeviceFloppy} from "@tabler/icons-react";
import {createGenericEditPage} from "@coreModule/components/entityPage/pages/createGenericEditPage.tsx";
import {FORM_EXTRAS_OBJECT_ID_CHIP_LABEL_REFS} from "@coreModule/components/custom/inputs/objectIdChipsInput.tsx";
import {editMarketplaceConfigFormSchema} from "armonia/src/modules/marketplace/api/marketplace/private/marketplaceConfig/editMarketplaceConfig.form.validator.ts";
import type {EditMarketplaceConfigFormType} from "armonia/src/modules/marketplace/api/marketplace/private/marketplaceConfig/marketplaceConfig.schema-def.ts";
import type {MarketplaceConfig} from "armonia/src/modules/marketplace/api/marketplace/private/marketplaceConfig/marketplaceConfig.dto.ts";

const chipLabelState = {
    loadedId: null as string | null,
    branches: {current: {} as Record<string, string>},
};

export default createGenericEditPage<MarketplaceConfig, EditMarketplaceConfigFormType>({
    languagePath: "src/modules/marketplace/clients/panel/private/settings/editMarketplaceConfig.tsx",
    collectionName: "marketplaceconfigs",
    accessModel: "marketplaceconfigs",
    apiUrl: "/api/marketplace/marketplaceConfig",
    schema: editMarketplaceConfigFormSchema,
    // `isOperator` is not a form value: it only decides whether the operator's own section shows (D143).
    mapEntityData: ({isOperator: _isOperator, ...data}) => ({
        ...data,
        currency: data.currency?._id,
        branches: data.branches?.map((branch) => branch._id) ?? [],
    }),
    buildFormExtras: (_entityId, _params, entity) => {
        if (entity && chipLabelState.loadedId !== entity._id) {
            chipLabelState.loadedId = entity._id;
            chipLabelState.branches.current = {};
        }
        // What we provide (D196): the chips show the sections' names, which the form values (ids) do not carry.
        const branches = entity?.branches ?? [];
        for (const branch of branches) chipLabelState.branches.current[branch._id] = branch.name;
        return {
            isOperator: entity?.isOperator === true,
            branches: branches.map((branch) => ({value: branch._id, label: branch.name})),
            [FORM_EXTRAS_OBJECT_ID_CHIP_LABEL_REFS]: {branches: chipLabelState.branches},
        };
    },
    submitIcon: <IconDeviceFloppy />,
});
