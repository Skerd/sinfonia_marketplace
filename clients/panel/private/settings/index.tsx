import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import SimpleError from "@coreModule/components/custom/errors/errorViewWrapper.tsx";
import type {MarketplaceConfig} from "armonia/src/modules/marketplace/api/marketplace/private/marketplaceConfig/marketplaceConfig.dto.ts";
import EditMarketplaceConfig from "@marketplaceModule/clients/panel/private/settings/editMarketplaceConfig.tsx";

const ENSURE_CONFIG_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/marketplaceConfig/ensure"};

/** One settings record per company: make sure it exists, then edit it in place. */
function MarketplaceSettingsGate({resolveLanguageKey}: WithLanguageType) {
    const {data: config, error} = useHttpRequest<MarketplaceConfig>(ENSURE_CONFIG_REQUEST, {}, 1);

    if (error) return <SimpleError title={String(resolveLanguageKey("loadError"))} />;
    if (!config) return <Loader />;
    return <EditMarketplaceConfig entityId={config._id} />;
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/settings/index.tsx"),
    withDebug(true, true, "marketplaceconfigs"),
)(MarketplaceSettingsGate);
