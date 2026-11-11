import {IconBriefcase} from "@tabler/icons-react";
import type {AccountNavContribution} from "@coreModule/helpers/types/accountNavContribution.types.ts";

const marketplaceAccountNavContribution: AccountNavContribution = {
    id: "marketplace",
    order: 31,
    getAccountNavItems(resolveLanguageKey) {
        return [
            {
                title: resolveLanguageKey("menus.marketplace.providerprofile.title"),
                url: "/account/providerprofile",
                icon: IconBriefcase,
                permissions: ["providerprofiles"],
                usersPermissions: [],
                atLeastOnePermission: true,
            },
        ];
    },
};

export default marketplaceAccountNavContribution;
