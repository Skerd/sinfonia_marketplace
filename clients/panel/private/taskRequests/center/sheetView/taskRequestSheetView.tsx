import {compose} from "redux";
import {useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {TaskRequest} from "armonia/src/modules/marketplace/api/marketplace/private/taskRequest/taskRequest.dto.ts";
import type {DeleteResponse} from "armonia/src/modules/core/types/shared.types.ts";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import SheetNameTitle from "@coreModule/components/entityPage/sheet/sheetNameTitle.tsx";
import StatusBadge from "@coreModule/components/entityPage/sheet/statusBadge.tsx";
import CloseTaskRequestDropdown from "@marketplaceModule/clients/panel/private/taskRequests/center/actions/closeTaskRequestDropdown.tsx";
import ReopenTaskRequestDropdown from "@marketplaceModule/clients/panel/private/taskRequests/center/actions/reopenTaskRequestDropdown.tsx";
import NotifyAllTaskRequestDropdown from "@marketplaceModule/clients/panel/private/taskRequests/center/actions/notifyAllTaskRequestDropdown.tsx";
import TaskRequestStatusConfirmAction from "@marketplaceModule/components/custom/taskRequests/taskRequestStatusConfirmAction.tsx";
import TaskRequestNotifyAllConfirmAction from "@marketplaceModule/components/custom/taskRequests/taskRequestNotifyAllConfirmAction.tsx";
import {taskRequestEditPath} from "@marketplaceModule/clients/panel/private/taskRequests";

export type TaskRequestSheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entity?: TaskRequest;
    hideActions?: boolean;
    onDelete?: (response?: DeleteResponse) => void;
    onRestore?: () => void;
    /** When status changes (close / reopen), parent can sync table row / list state. */
    onEntityUpdated?: (entity: TaskRequest) => void;
    fetchId?: string;
};

function TaskRequestSheetView({
    open,
    onOpenChange,
    entity: entityProp,
    resolveLanguageKey,
    hideActions = false,
    onDelete = () => {},
    onRestore = () => {},
    onEntityUpdated,
    fetchId,
}: TaskRequestSheetViewOwnProps & WithLanguageType) {
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(entityProp || {_id: fetchId});
    const [action, setAction] = useState("");
    const access = useAccess("taskRequests");
    const viewConfig = useViewConfig("taskrequests", "sheet");

    useEffect(() => {
        if (!entityProp) return;
        setSheetData(entityProp);
    }, [entityProp]);

    useEffect(() => {
        if (!open) setAction("");
    }, [open]);

    const entityId = entityProp?._id ?? fetchId;

    if (!viewConfig) return null;
    if (!entityId) return null;

    const row = (sheetData as TaskRequest) && (sheetData as TaskRequest)._id
        ? (sheetData as TaskRequest)
        : ({_id: entityId, title: ""} as TaskRequest);

    const displayLabel = (row.title && String(row.title)) || String(entityId ?? "");
    return (
        <>
            <SheetViewRenderer
                config={viewConfig}
                url="/api/marketplace/taskRequest/single"
                fetchId={fetchId}
                onDataFetched={(data) => {
                    setSheetData(data);
                }}
                data={sheetData}
                open={open}
                onOpenChange={onOpenChange}
                resolveLanguageKey={resolveLanguageKey}
                // Its title, the request number as a badge and the status in tone (UX-01, UX-02).
                headerTitle={<SheetNameTitle name={row.title ?? ""} code={row.name} typeLabel={String(resolveLanguageKey("taskRequest"))} />}
                headerDescription={<StatusBadge tableConfigKey="taskrequests" field="status" value={row.status} label={String(resolveLanguageKey(`taskRequestStatus.${row.status}`))} />}
                access={access}
                hideActions={hideActions}
                onDelete={onDelete}
                onRestore={onRestore}
                editPath={taskRequestEditPath(row)}
                deleteRestoreConfirmLabel={displayLabel}
                actionMenuAllowCustomChildren={true}
                actionMenuChildren={
                    <>
                        <NotifyAllTaskRequestDropdown entity={row} onAction={setAction} />
                        <CloseTaskRequestDropdown entity={row} onAction={setAction} />
                        <ReopenTaskRequestDropdown entity={row} onAction={setAction} />
                    </>
                }
            />
            {action === "notifyAll" && (
                <TaskRequestNotifyAllConfirmAction
                    taskRequestId={String(row._id)}
                    displayName={displayLabel}
                    openAlert
                    url="/api/marketplace/taskRequest/notifyAll"
                    onSuccess={() => setAction("")}
                    onCancel={() => setAction("")}
                />
            )}
            {(action === "close" || action === "reopen") && (
                <TaskRequestStatusConfirmAction
                    actionKey={action}
                    taskRequestId={String(row._id)}
                    displayName={displayLabel}
                    openAlert
                    url={`/api/marketplace/taskRequest/${action}`}
                    onSuccess={(newStatus: TaskRequest["status"]) => {
                        const patch = {status: newStatus};
                        setSheetData({...sheetData, ...patch});
                        onEntityUpdated?.({...row, ...patch} as TaskRequest);
                        setAction("");
                    }}
                    onCancel={() => setAction("")}
                />
            )}
        </>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/taskRequests/center/sheetView/taskRequestSheetView.tsx"),
    withDebug(true, true, "taskRequests"),
)(TaskRequestSheetView);
