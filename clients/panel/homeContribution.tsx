import type {HomeContribution} from "@coreModule/helpers/types/homeContribution.types.ts";
import type {FilterGroup} from "armonia/src/modules/core/database/filter/filter.types";

/** A listing gets leads and orders only once active (`jobMatching`), so the setup step counts active ones alone. */
const ACTIVE_LISTINGS: FilterGroup = {
    id: "setup-active-listings",
    operator: "and",
    rules: [{id: "status", field: "status", operator: "equals", value: "active"}],
    groups: [],
};

/**
 * What a new services company sets up before it can take customers (D178), in the order it needs them; each
 * step is done once its list has a row (an active one, for listings). The step's guide points at the fields that matter most (D179), and the tour
 * shows the pages a services company uses every day. Texts are in this module's `menus.json` (`setup`, `guide`).
 */
const contribution: HomeContribution = {
    id: "marketplace",
    order: 15,
    getSetupSteps: ({resolveLanguageKey: t}) => {
        const tip = (target: string, name: string) => ({
            target,
            title: t(`menus.marketplace.guide.${name}Title`),
            text: t(`menus.marketplace.guide.${name}Text`),
        });
        const save = {target: "form.save", title: t("home.guide.saveTitle"), text: t("home.guide.saveText")};
        return [
            {
                key: "marketplace.listing",
                title: t("menus.marketplace.setup.listing"),
                description: t("menus.marketplace.setup.listingHint"),
                to: "/marketplace/listings/create",
                accessModel: "listings",
                // A saved listing is a draft until its owner activates it (the user, 2026-11-23: only active ones count).
                doneWhen: {list: {url: "/api/marketplace/listing", params: {filter: ACTIVE_LISTINGS}}},
                guide: [
                    tip("field.title", "listingTitle"),
                    tip("field.category", "listingCategory"),
                    tip("field.provider", "listingProvider"),
                    tip("field.price", "listingPrice"),
                    tip("field.serviceArea.radiusKm", "listingArea"),
                    save,
                ],
            },
        ];
    },
    // Sidebar links, shown from wherever the person is, each left out without its link's model; the tour then ends at
    // the last one's page help.
    getTour: ({resolveLanguageKey: t}) => ([
        ["listings", "listings"],
        ["leads", "taskleads"],
        ["taskboard", "taskleads"],
        ["bids", "marketplacebids"],
        ["orders", "orders"],
    ] as const).map(([page, accessModel]) => ({
        target: `nav:/marketplace/${page}`,
        // Named as the sidebar names them.
        title: t(`menus.marketplace.${page}.title`),
        text: t(`menus.marketplace.guide.tour.${page}`),
        accessModel,
    })),
};

export default contribution;
