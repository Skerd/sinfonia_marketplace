import {IconAlertTriangle, IconCalendar, IconClipboardList, IconFlag, IconGavel, IconListDetails, IconPackage, IconShoppingBag, IconStar, IconTag, IconTargetArrow} from "@tabler/icons-react";
import type {SidebarContribution} from "@coreModule/helpers/types/sidebarContribution.types.ts";
import type {NavGroup, NavItem} from "@coreModule/helpers/types/sidebarNav.types.ts";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {registerMarketplaceRefSelects} from "armonia/src/modules/marketplace/database/filter/refSelect.ts";

registerMarketplaceRefSelects();

const marketplaceSidebarContribution: SidebarContribution = {
    id: "marketplace",
    order: 36,
    getNavGroups(resolveLanguageKey: ResolveLanguageKey): NavGroup[] {
        const marketplaceItems: NavItem[] = [
            {title: resolveLanguageKey("menus.marketplace.listings.title"), url: "/marketplace/listings", icon: IconListDetails, permissions: ["listings"], usersPermissions: [], atLeastOnePermission: true},
            {title: resolveLanguageKey("menus.marketplace.listingaddons.title"), url: "/marketplace/listingaddons", icon: IconPackage, permissions: ["listingaddons"], usersPermissions: [], atLeastOnePermission: true},
            {title: resolveLanguageKey("menus.marketplace.listingpackages.title"), url: "/marketplace/listingpackages", icon: IconPackage, permissions: ["listingpackages"], usersPermissions: [], atLeastOnePermission: true},
            {title: resolveLanguageKey("menus.marketplace.listingflags.title"), url: "/marketplace/listingflags", icon: IconFlag, permissions: ["listingflags"], usersPermissions: [], atLeastOnePermission: true},
            {title: resolveLanguageKey("menus.marketplace.promotions.title"), url: "/marketplace/promotions", icon: IconTag, permissions: ["promotions"], usersPermissions: [], atLeastOnePermission: true},
            // Portal jobs matched to this company's providers (D143).
            {title: resolveLanguageKey("menus.marketplace.leads.title"), url: "/marketplace/leads", icon: IconTargetArrow, permissions: ["taskleads"], usersPermissions: [], atLeastOnePermission: true},
            {title: resolveLanguageKey("menus.marketplace.taskrequests.title"), url: "/marketplace/taskrequests", icon: IconClipboardList, permissions: ["taskRequests"], usersPermissions: [], atLeastOnePermission: true},
            {title: resolveLanguageKey("menus.marketplace.bids.title"), url: "/marketplace/bids", icon: IconGavel, permissions: ["marketplacebids"], usersPermissions: [], atLeastOnePermission: true},
            {title: resolveLanguageKey("menus.marketplace.orders.title"), url: "/marketplace/orders", icon: IconShoppingBag, permissions: ["orders"], usersPermissions: [], atLeastOnePermission: true},
            {title: resolveLanguageKey("menus.marketplace.disputes.title"), url: "/marketplace/disputes", icon: IconAlertTriangle, permissions: ["disputes"], usersPermissions: [], atLeastOnePermission: true},
            {title: resolveLanguageKey("menus.marketplace.reviews.title"), url: "/marketplace/reviews", icon: IconStar, permissions: ["reviews"], usersPermissions: [], atLeastOnePermission: true},
            {title: resolveLanguageKey("menus.marketplace.bookings.title"), url: "/marketplace/bookings", icon: IconCalendar, permissions: ["bookings"], usersPermissions: [], atLeastOnePermission: true},
        ];

        return [
            {
                title: resolveLanguageKey("menus.marketplace.title"),
                permissions: [],
                usersPermissions: [],
                atLeastOnePermission: true,
                items: marketplaceItems,
            },
        ];
    },
};

export default marketplaceSidebarContribution;
