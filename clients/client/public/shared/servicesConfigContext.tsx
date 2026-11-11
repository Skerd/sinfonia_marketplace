import {createContext, useContext, useMemo, type ReactNode} from "react";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {formatRecordMoney, type PortalMoneyCurrency} from "@coreModule/clients/portal/shared/portalMoney.ts";
import type {ServicesConfigResponse} from "armonia/src/modules/marketplace/api/marketplace/public/servicesConfig/servicesConfig.types.ts";

type ServicesConfig = ServicesConfigResponse["data"];

type ServicesConfigContextValue = {
    config: ServicesConfig | null;
    loading: boolean;
    /** Formats in the record's own currency; without one the amount is a plain number. */
    formatMoney: (amount: number | undefined | null, currency?: PortalMoneyCurrency | null) => string;
};

const ServicesConfigContext = createContext<ServicesConfigContextValue>({
    config: null,
    loading: true,
    formatMoney: () => "",
});

const CONFIG_REQUEST: HttpRequest = {method: "GET", url: "/api/marketplace/servicesConfig"};

/** Loads the services site's settings (the marketplace currency, the Stripe publishable key) once. */
export function ServicesConfigProvider({children}: {children: ReactNode}) {
    const {data, loading} = useHttpRequest<ServicesConfigResponse>(CONFIG_REQUEST, {}, 1);
    const config = data?.data ?? null;
    const value = useMemo<ServicesConfigContextValue>(() => ({config, loading, formatMoney: formatRecordMoney}), [config, loading]);
    return <ServicesConfigContext.Provider value={value}>{children}</ServicesConfigContext.Provider>;
}

export function useServicesConfig(): ServicesConfigContextValue {
    return useContext(ServicesConfigContext);
}
