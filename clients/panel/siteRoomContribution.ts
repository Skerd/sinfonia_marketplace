import type {SiteRoomContribution} from "@coreModule/helpers/types/siteRoomContribution.types.ts";

const marketplaceSiteRoomContribution: SiteRoomContribution = {
    id: "marketplace",
    order: 36,
    systemSettingsRooms: {
        listingcategories: "listingcategories_configurations",
        marketplacesettings: "marketplacesettings_configurations",
    },
};

export default marketplaceSiteRoomContribution;
