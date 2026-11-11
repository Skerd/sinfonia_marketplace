import {IconAdjustments, IconBriefcase, IconCategory2, IconListDetails} from "@tabler/icons-react";
import type {TenancySettingsContribution} from "@coreModule/helpers/types/tenancySettingsContribution.types.ts";
import type {NavLinkItem} from "@coreModule/helpers/types/sidebarNav.types.ts";

/** Marketplace setup under Tenancy → Configurations; daily work stays in the Marketplace sidebar group. */
const marketplaceTenancySettingsContribution: TenancySettingsContribution = {
    id: "marketplace",
    order: 41,
    getTenancySettingsItems(resolveLanguageKey) {
        const item = (key: string, resource: string, icon: NavLinkItem["icon"], permission: string): NavLinkItem => ({
            title: resolveLanguageKey(`menus.tenancy.systemSettings.${key}.title`),
            url: `/tenancy/systemSettings/${resource}`,
            icon,
            permissions: [permission],
            usersPermissions: [],
            atLeastOnePermission: true,
        });
        return {
            title: resolveLanguageKey("menus.tenancy.systemSettings.marketplace.title"),
            icon: IconListDetails,
            permissions: [],
            usersPermissions: [],
            atLeastOnePermission: true,
            items: [
                item("marketplacesettings", "marketplacesettings", IconAdjustments, "marketplaceconfigs"),
                item("listingcategories", "listingcategories", IconCategory2, "listingcategories"),
                item("providerprofile", "providerprofiles", IconBriefcase, "providerprofiles"),
            ],
        };
    },
};

export default marketplaceTenancySettingsContribution;
