import {compose} from "redux";
import {useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {TaskLead} from "armonia/src/modules/marketplace/api/marketplace/private/taskLead/taskLead.dto.ts";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import SheetNameTitle from "@coreModule/components/entityPage/sheet/sheetNameTitle.tsx";
import StatusBadge from "@coreModule/components/entityPage/sheet/statusBadge.tsx";
import QuoteTaskLeadDropdown from "@marketplaceModule/clients/panel/private/taskLeads/center/actions/quoteTaskLeadDropdown.tsx";
import DeclineTaskLeadDropdown from "@marketplaceModule/clients/panel/private/taskLeads/center/actions/declineTaskLeadDropdown.tsx";
import QuoteLeadAction from "@marketplaceModule/components/custom/taskLeads/quoteLeadAction.tsx";
import DeclineLeadAction from "@marketplaceModule/components/custom/taskLeads/declineLeadAction.tsx";

export type TaskLeadSheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lead?: TaskLead;
    hideActions?: boolean;
    onSheetRowPatched?: (patch: Partial<TaskLead>) => void;
    fetchId?: string;
};

/** A lead: the job as the provider may see it before the award, how far it is, and their quote (D143). */
function TaskLeadSheetView({open, onOpenChange, lead: leadProp, resolveLanguageKey, hideActions = false, onSheetRowPatched, fetchId}: TaskLeadSheetViewOwnProps & WithLanguageType) {
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(leadProp || {_id: fetchId});
    const [action, setAction] = useState("");
    const access = useAccess("taskleads");
    const viewConfig = useViewConfig("taskleads", "sheet");

    useEffect(() => {
        if (leadProp) setSheetData(leadProp);
    }, [leadProp]);
    useEffect(() => {
        if (!open) setAction("");
    }, [open]);

    const entityId = leadProp?._id ?? fetchId;
    const lead = sheetData as TaskLead;
    if (!viewConfig || !entityId) return null;

    const applyPatch = (patch: Partial<TaskLead>) => {
        setSheetData({...sheetData, ...patch});
        onSheetRowPatched?.(patch);
        setAction("");
    };

    return (
        <>
            <SheetViewRenderer
                config={viewConfig}
                url="/api/marketplace/taskLead/single"
                fetchId={fetchId}
                onDataFetched={(data) => {
                    setSheetData(data);
                    // Opening a new lead marks it viewed on the server; the list shows it too.
                    onSheetRowPatched?.({status: (data as TaskLead).status});
                }}
                onSheetRowPatched={onSheetRowPatched}
                data={sheetData}
                open={open}
                onOpenChange={onOpenChange}
                resolveLanguageKey={resolveLanguageKey}
                headerTitle={<SheetNameTitle name={lead.taskRequest?.title ?? ""} code={lead.name} typeLabel={String(resolveLanguageKey("leadSubtitle"))} />}
                headerDescription={<StatusBadge tableConfigKey="taskleads" field="status" value={lead.status} label={String(resolveLanguageKey(`taskLeadStatus.${lead.status}`))} />}
                access={access}
                hideActions={hideActions}
                hideEdit
                editPath=""
                deleteRestoreConfirmLabel={lead.taskRequest?.title ?? lead.name}
                actionMenuAllowCustomChildren
                actionMenuChildren={
                    <>
                        <QuoteTaskLeadDropdown lead={lead} onAction={setAction} />
                        <DeclineTaskLeadDropdown lead={lead} onAction={setAction} />
                    </>
                }
            />
            {action === "quote" && <QuoteLeadAction lead={lead} openAlert onSuccess={applyPatch} onCancel={() => setAction("")} />}
            {action === "decline" && <DeclineLeadAction lead={lead} openAlert onSuccess={applyPatch} onCancel={() => setAction("")} />}
        </>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/taskLeads/center/sheetView/taskLeadSheetView.tsx"),
    withDebug(true, true, "taskleads"),
)(TaskLeadSheetView);
