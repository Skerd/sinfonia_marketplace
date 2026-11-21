import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {CatalogFilterSelect, uniqueBySlug} from "@coreModule/clients/portal/shared/catalogFilters.tsx";
import type {ShopListingTaxonomyResponse} from "armonia/src/modules/marketplace/api/marketplace/public/shopMarketplace/shopMarketplace.types.ts";
import {TASK_BOARD_DELIVERIES} from "armonia/src/modules/marketplace/api/marketplace/private/taskBoard/taskBoard.form.validator.ts";

const TAXONOMY_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/shopListingTaxonomy", cache: true};

/** The task board's filters (D172): any category of the shared tree, and work done on site or online. */
function TaskFilters({resolveLanguageKey}: WithLanguageType) {
    const taxonomy = useHttpRequest<ShopListingTaxonomyResponse>(TAXONOMY_REQUEST, {}, 1);
    const categories = uniqueBySlug(taxonomy.data?.data.categories ?? []);

    return (
        <>
            <CatalogFilterSelect
                name="category"
                label={resolveLanguageKey("category")}
                anyLabel={resolveLanguageKey("any")}
                options={categories.map((category) => ({value: category.slug, label: category.name}))}
            />
            <CatalogFilterSelect
                name="delivery"
                label={resolveLanguageKey("where")}
                anyLabel={resolveLanguageKey("anywhere")}
                options={TASK_BOARD_DELIVERIES.map((value) => ({value, label: String(resolveLanguageKey(`delivery.${value}`))}))}
            />
        </>
    );
}

export default compose(withLanguage("src/modules/marketplace/clients/portal/taskFilters.tsx"))(TaskFilters);
