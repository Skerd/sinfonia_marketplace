import {IconBriefcase} from "@tabler/icons-react";
import type {AccountSettingsContribution} from "@coreModule/helpers/types/accountSettingsContribution.types.ts";
import AccountProviderProfile from "@marketplaceModule/clients/panel/private/providerProfile/accountProviderProfile.tsx";

const marketplaceAccountSettingsContribution: AccountSettingsContribution = {
    id: "marketplace",
    order: 31,
    getPages({specificUserId}) {
        return [
            {
                id: "providerprofile",
                titleKey: "providerprofile",
                icon: <IconBriefcase size={18} />,
                render: () => <AccountProviderProfile specificUserId={specificUserId} />,
            },
        ];
    },
};

export default marketplaceAccountSettingsContribution;
