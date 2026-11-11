import {compose} from "redux";
import {useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import SheetNameTitle from "@coreModule/components/entityPage/sheet/sheetNameTitle.tsx";
import StatusBadge from "@coreModule/components/entityPage/sheet/statusBadge.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import type {OrderMilestone} from "armonia/src/modules/marketplace/api/marketplace/private/orderMilestone/orderMilestone.dto.ts";

/** Read-only: milestone rows are written by order actions, never edited or deleted from the panel. */
type OrderMilestoneSheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    milestone?: OrderMilestone;
    fetchId?: string;
};

function OrderMilestoneSheetView({
    open,
    onOpenChange,
    milestone: milestoneProp,
    resolveLanguageKey,
    fetchId,
}: OrderMilestoneSheetViewOwnProps & WithLanguageType) {
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(milestoneProp || {_id: fetchId});
    const access = useAccess("orderMilestones");
    const viewConfig = useViewConfig("ordermilestones", "sheet");

    useEffect(() => {
        if (!milestoneProp) return;
        setSheetData(milestoneProp);
    }, [milestoneProp]);

    const entityId = milestoneProp?._id ?? fetchId;

    if (!viewConfig || !entityId) return null;
    const milestone = sheetData as OrderMilestone;
    const orderTitle = milestone.order?.listing?.title || milestone.order?.taskRequest?.title;

    return (
        <SheetViewRenderer
            config={viewConfig}
            url="/api/marketplace/orderMilestone/single"
            fetchId={fetchId ?? entityId}
            onDataFetched={(data) => setSheetData(data)}
            data={sheetData}
            open={open}
            onOpenChange={onOpenChange}
            resolveLanguageKey={resolveLanguageKey}
            // The milestone and the order it pays out of, the order number as a badge (UX-01, UX-02).
            headerTitle={<SheetNameTitle name={[milestone.name, orderTitle].filter(Boolean).join(" · ")} code={milestone.order?.name} typeLabel={String(resolveLanguageKey("orderMilestoneSubtitle"))} />}
            headerDescription={<StatusBadge tableConfigKey="ordermilestones" field="status" value={milestone.status} label={String(resolveLanguageKey(`orderMilestoneStatus.${milestone.status}`))} />}
            access={access}
            hideEdit
            hideDelete
            hideRestore
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/orderMilestones/center/sheetView/orderMilestoneSheetView.tsx"),
    withDebug(true, true, "orderMilestones"),
)(OrderMilestoneSheetView);
