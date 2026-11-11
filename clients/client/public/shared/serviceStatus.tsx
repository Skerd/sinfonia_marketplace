import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {PortalStatusPill} from "@coreModule/clients/portal/shared/portalStatusPill.tsx";

const LANGUAGE_PATH = "src/modules/marketplace/clients/client/public/shared/serviceStatus.tsx";

type ServiceStatusProps = WithLanguageType & {
    /** Which status field the value comes from: the same word can mean different things. */
    kind: "serviceStatus" | "jobStatus" | "bidStatus" | "deliveryStatus" | "milestoneStatus";
    value: string;
};

/** Translated status pill of a service order, a job, a bid, a delivery or a milestone. */
function ServiceStatusInner({resolveLanguageKey, kind, value}: ServiceStatusProps) {
    return <PortalStatusPill value={value} label={resolveLanguageKey(`${kind}.${value}`, true) ?? value.replaceAll("_", " ")} />;
}

export default compose(withLanguage(LANGUAGE_PATH), withDebug(true, true))(ServiceStatusInner);
