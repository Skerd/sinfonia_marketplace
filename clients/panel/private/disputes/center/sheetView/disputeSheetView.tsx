import {compose} from "redux";
import {useCallback, useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import SheetNameTitle from "@coreModule/components/entityPage/sheet/sheetNameTitle.tsx";
import StatusBadge from "@coreModule/components/entityPage/sheet/statusBadge.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import StartReviewDisputeDropdown from "@marketplaceModule/clients/panel/private/disputes/center/actions/startReviewDisputeDropdown.tsx";
import ResolveDisputeDropdown from "@marketplaceModule/clients/panel/private/disputes/center/actions/resolveDisputeDropdown.tsx";
import CloseDisputeDropdown from "@marketplaceModule/clients/panel/private/disputes/center/actions/closeDisputeDropdown.tsx";
import ChangeDisputeLifecycleAction from "@marketplaceModule/components/custom/disputes/changeDisputeLifecycleAction.tsx";
import type {Dispute} from "armonia/src/modules/marketplace/api/marketplace/private/dispute/dispute.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";

export type DisputeSheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dispute?: Dispute;
    hideActions?: boolean;
    onDelete?: (response?: DeletedData) => void;
    onRestore?: () => void;
    onListLifecyclePatched?: (patch: Partial<Dispute>) => void;
    fetchId?: string;
};

function disputeRowTitle(dispute: Dispute): string {
    const r = dispute.reason?.trim();
    return r ? (r.length > 80 ? `${r.slice(0, 80)}…` : r) : dispute._id;
}

function DisputeSheetView({
    open,
    onOpenChange,
    dispute: disputeProp,
    resolveLanguageKey,
    hideActions = false,
    onDelete = () => {},
    onRestore = () => {},
    onListLifecyclePatched,
    fetchId,
}: DisputeSheetViewOwnProps & WithLanguageType) {
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(disputeProp || {_id: fetchId});
    const [action, setAction] = useState("");
    const access = useAccess("disputes");
    const viewConfig = useViewConfig("disputes", "sheet");

    useEffect(() => {
        if (!disputeProp) return;
        setSheetData(disputeProp);
    }, [disputeProp]);

    useEffect(() => {
        if (!open) setAction("");
    }, [open]);

    const handleDelete = useCallback(
        (response?: DeletedData) => {
            if (response?.deletedAt != null || response?.deletedBy != null) {
                setSheetData((prev) => ({...prev, ...response}));
            }
            onDelete(response);
        },
        [onDelete],
    );

    const handleRestore = useCallback(() => {
        setSheetData((prev) => ({
            ...prev,
            deletedAt: undefined,
            deletedBy: undefined,
        }));
        onRestore();
    }, [onRestore]);

    const entityId = disputeProp?._id ?? fetchId;
    const asDispute = sheetData as Dispute;
    const title = disputeRowTitle(asDispute);

    if (!viewConfig || !entityId) return null;

    const row =
        asDispute._id
            ? asDispute
            : ({_id: entityId, reason: "", status: "open"} as Dispute);

    return (
        <>
            <SheetViewRenderer
                config={viewConfig}
                url="/api/marketplace/dispute/single"
                fetchId={fetchId}
                onDataFetched={setSheetData}
                data={sheetData}
                open={open}
                onOpenChange={onOpenChange}
                resolveLanguageKey={resolveLanguageKey}
                // Named by the disputed order's listing or task, the order number as a badge (UX-01, UX-02).
                headerTitle={<SheetNameTitle name={row.order?.listing?.title || row.order?.taskRequest?.title || (row.reason ? title : "")} code={row.order?.name} typeLabel={String(resolveLanguageKey("dispute"))} />}
                headerDescription={<StatusBadge tableConfigKey="disputes" field="status" value={row.status} label={String(resolveLanguageKey(`status_values.${row.status}`))} />}
                access={access}
                hideActions={hideActions}
                onDelete={handleDelete}
                onRestore={handleRestore}
                editPath=""
                hideEdit
                deleteRestoreConfirmLabel={row.reason || String(entityId)}
                actionMenuAllowCustomChildren
                actionMenuChildren={
                    <>
                        <StartReviewDisputeDropdown dispute={row} onAction={setAction} />
                        <ResolveDisputeDropdown dispute={row} onAction={setAction} />
                        <CloseDisputeDropdown dispute={row} onAction={setAction} />
                    </>
                }
                onSheetRowPatched={setSheetData}
            />
            {(action === "startReview" || action === "resolve" || action === "close") && (
                <ChangeDisputeLifecycleAction
                    disputeId={String(row._id)}
                    disputeTitle={title}
                    verb={action}
                    openAlert
                    url={`/api/marketplace/dispute/${action}`}
                    onSuccess={(patch: Partial<Dispute>) => {
                        setSheetData({...sheetData, ...patch});
                        onListLifecyclePatched?.(patch);
                        setAction("");
                    }}
                    onCancel={() => setAction("")}
                />
            )}
        </>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/disputes/center/sheetView/disputeSheetView.tsx"),
    withDebug(true, true, "disputes"),
)(DisputeSheetView);
