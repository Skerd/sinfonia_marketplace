import {compose} from "redux";
import {useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import SheetNameTitle from "@coreModule/components/entityPage/sheet/sheetNameTitle.tsx";
import StatusBadge from "@coreModule/components/entityPage/sheet/statusBadge.tsx";
import {DATE_FORMATS, formatDate} from "@coreModule/helpers/general/dateTime.ts";
import {useCompanyTimeZone} from "@coreModule/helpers/hooks/useCompanyTimeZone.ts";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import type {OrderRevision} from "armonia/src/modules/marketplace/api/marketplace/private/orderRevision/orderRevision.dto.ts";

/** Read-only: revision rows are written by order actions, never edited or deleted from the panel. */
type OrderRevisionSheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    revision?: OrderRevision;
    fetchId?: string;
};

function OrderRevisionSheetView({
    open,
    onOpenChange,
    revision: revisionProp,
    resolveLanguageKey,
    fetchId,
}: OrderRevisionSheetViewOwnProps & WithLanguageType) {
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(revisionProp || {_id: fetchId});
    const access = useAccess("orderRevisions");
    const viewConfig = useViewConfig("orderrevisions", "sheet");
    const companyZone = useCompanyTimeZone();

    useEffect(() => {
        if (!revisionProp) return;
        setSheetData(revisionProp);
    }, [revisionProp]);

    const entityId = revisionProp?._id ?? fetchId;

    if (!viewConfig || !entityId) return null;
    const revision = sheetData as OrderRevision;
    const orderTitle = revision.order?.listing?.title || revision.order?.taskRequest?.title;
    const requestedOn = formatDate(revision.createdAt, {timeZone: companyZone, format: DATE_FORMATS.mediumDate});

    return (
        <SheetViewRenderer
            config={viewConfig}
            url="/api/marketplace/orderRevision/single"
            fetchId={fetchId ?? entityId}
            onDataFetched={(data) => setSheetData(data)}
            data={sheetData}
            open={open}
            onOpenChange={onOpenChange}
            resolveLanguageKey={resolveLanguageKey}
            // The order's listing and the day the revision was asked for, the order number as a badge (UX-01, UX-02).
            headerTitle={<SheetNameTitle name={[orderTitle, requestedOn].filter(Boolean).join(" · ")} code={revision.order?.name} typeLabel={String(resolveLanguageKey("orderRevisionSubtitle"))} />}
            headerDescription={<StatusBadge tableConfigKey="orderrevisions" field="status" value={revision.status} label={String(resolveLanguageKey(`orderRevisionStatus.${revision.status}`))} />}
            access={access}
            hideEdit
            hideDelete
            hideRestore
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/orderRevisions/center/sheetView/orderRevisionSheetView.tsx"),
    withDebug(true, true, "orderRevisions"),
)(OrderRevisionSheetView);
