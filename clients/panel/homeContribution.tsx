import type {HomeContribution} from "@coreModule/helpers/types/homeContribution.types.ts";

/**
 * What a new services company sets up before it can take customers (D178), in the order it needs them; each
 * step is done once its list has a row. Labels are in this module's `menus.json`.
 */
const contribution: HomeContribution = {
    id: "marketplace",
    order: 15,
    getSetupSteps: ({resolveLanguageKey: t}) => [
        {
            key: "marketplace.listing",
            title: t("menus.marketplace.setup.listing"),
            description: t("menus.marketplace.setup.listingHint"),
            to: "/marketplace/listings/create",
            accessModel: "listings",
            doneWhen: {list: {url: "/api/marketplace/listing"}},
        },
    ],
};

export default contribution;
