import {compose} from "redux";
import {useMemo} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import SheetNameTitle from "@coreModule/components/entityPage/sheet/sheetNameTitle.tsx";
import type {TaskBoardTask} from "armonia/src/modules/marketplace/api/marketplace/private/taskBoard/taskBoard.types.ts";
import QuoteTaskBoardDropdown from "../actions/quoteTaskBoardDropdown.tsx";
import TaskBoardQuotes from "../cardView/taskBoardQuotes.tsx";

export type TaskBoardSheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: TaskBoardTask;
    /** Runs a row action on the card that opened the sheet ("quote"), so the card refreshes after it. */
    onAction?: (action: string) => void;
};

/**
 * A task of the task board (D172), read exactly as a lead (the leads' own sheet view): the job before the award, the
 * caller's own lead status, origin and quote when they have one, and "Send a quote" while it takes one.
 */
function TaskBoardSheetView({open, onOpenChange, task, onAction = () => {}, resolveLanguageKey}: TaskBoardSheetViewOwnProps & WithLanguageType) {
    const access = useAccess("taskleads");
    const viewConfig = useViewConfig("taskleads", "sheet");
    // The lead's shape: the job under `taskRequest`, and the caller's own lead's status, origin and quote, if any.
    const data = useMemo(() => ({
        _id: task._id,
        taskRequest: task,
        ...(task.myLead ? {status: task.myLead.status, ...(task.myLead.bid ? {bid: task.myLead.bid} : {})} : {}),
    }), [task]);
    if (!viewConfig) return null;

    return (
        <SheetViewRenderer
            config={viewConfig}
            url="/api/marketplace/taskBoard/single"
            data={data}
            open={open}
            onOpenChange={onOpenChange}
            resolveLanguageKey={resolveLanguageKey}
            headerTitle={<SheetNameTitle name={task.title} typeLabel={String(resolveLanguageKey("boardSubtitle"))} />}
            headerDescription={<TaskBoardQuotes task={task} />}
            access={access}
            hideEdit
            editPath=""
            deleteRestoreConfirmLabel={task.title}
            actionMenuAllowCustomChildren
            actionMenuChildren={<QuoteTaskBoardDropdown task={task} onAction={onAction} />}
        />
    );
}

export default compose(
    // The leads' own sheet and dictionary: a task of the board reads as a lead (D172).
    withLanguage("src/modules/marketplace/clients/panel/private/taskLeads/center/sheetView/taskLeadSheetView.tsx"),
    withDebug(true, true, "taskleads"),
)(TaskBoardSheetView);
