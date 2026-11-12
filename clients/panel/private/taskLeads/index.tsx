import {compose} from "redux";
import {useMemo} from "react";
import {useSearchParams} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import EntityListPage, {EntityListHeader, type QuickFilterDef} from "@coreModule/components/entityPage/pages/entityListPage.tsx";
import {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators.ts";
import {taskLeadStatuses} from "armonia/src/modules/marketplace/api/marketplace/private/taskLead/taskLead.schema-def.ts";
import type {TaskLead} from "armonia/src/modules/marketplace/api/marketplace/private/taskLead/taskLead.dto.ts";
import TaskLeadCard from "./center/cardView/taskLeadCard.tsx";
import TaskLeadSheetView from "./center/sheetView/taskLeadSheetView.tsx";
import QuoteTaskLeadDropdown from "./center/actions/quoteTaskLeadDropdown.tsx";
import DeclineTaskLeadDropdown from "./center/actions/declineTaskLeadDropdown.tsx";
import QuoteLeadAction from "@marketplaceModule/components/custom/taskLeads/quoteLeadAction.tsx";
import DeclineLeadAction from "@marketplaceModule/components/custom/taskLeads/declineLeadAction.tsx";

/**
 * Leads (D143): portal jobs that matched this company's providers. Nothing is created here; a provider quotes or
 * declines, and a quote becomes a bid the buyer compares.
 */
function AllTaskLeads({resolveLanguageKey}: WithLanguageType) {
    // `?open=<leadId>` opens that lead's sheet: the target of the new-lead notification and email (D145).
    const [searchParams, setSearchParams] = useSearchParams();
    const openLeadId = searchParams.get("open");
    const closeOpenedLead = () => {
        const next = new URLSearchParams(searchParams);
        next.delete("open");
        setSearchParams(next, {replace: true});
    };
    const quickFilters = useMemo<QuickFilterDef[]>(() => [
        {
            field: "status",
            label: String(resolveLanguageKey("fields.status")),
            type: COLUMN_TYPE.ENUM,
            enumValues: taskLeadStatuses.map((value) => ({value, label: String(resolveLanguageKey(`fields.!enums.status.${value}`))})),
        },
    ], [resolveLanguageKey]);

    return (
        <>
        {openLeadId ? (
            <TaskLeadSheetView key={openLeadId} open fetchId={openLeadId} onOpenChange={(opened: boolean) => { if (!opened) closeOpenedLead(); }} />
        ) : null}
        <EntityListPage<TaskLead>
            apiUrl="/api/marketplace/taskLead"
            collectionName="taskleads"
            accessModel="taskleads"
            tableConfigKey="taskleads"
            header={(ctx) => <EntityListHeader ctx={ctx} />}
            buildEditPath={() => ""}
            resolveLanguageKey={resolveLanguageKey}
            quickFilters={quickFilters}
            renderSheet={({entity, open, onOpenChange, listRef}) => (
                <TaskLeadSheetView
                    open={open}
                    onOpenChange={onOpenChange}
                    lead={entity}
                    onSheetRowPatched={(patch: Partial<TaskLead>) => listRef.current?.updateRow?.(entity._id, patch)}
                />
            )}
            rowActionMenu={{hideEdit: true, allowMenuForCustomChildren: true}}
            renderActionMenuChildren={(lead, bindRowAction) => (
                <>
                    <QuoteTaskLeadDropdown lead={lead} onAction={bindRowAction} />
                    <DeclineTaskLeadDropdown lead={lead} onAction={bindRowAction} />
                </>
            )}
            renderFloatingModals={({action, entity, resetAction, listRef}) => {
                const done = (patch: Partial<TaskLead>) => {
                    listRef.current?.updateRow?.(entity._id, patch);
                    resetAction();
                };
                if (action === "quote") return <QuoteLeadAction lead={entity} openAlert onSuccess={done} onCancel={resetAction} />;
                if (action === "decline") return <DeclineLeadAction lead={entity} openAlert onSuccess={done} onCancel={resetAction} />;
                return null;
            }}
            renderCard={(lead, _onDelete, _onRestore, listRef) => (
                <TaskLeadCard lead={lead} onLeadUpdated={(patch: Partial<TaskLead>) => listRef.current?.updateRow?.(lead._id, patch)} />
            )}
        />
        </>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/taskLeads/index.tsx"),
    withDebug(true, true, "taskleads"),
)(AllTaskLeads);
