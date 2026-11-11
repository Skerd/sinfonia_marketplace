import {compose} from "redux";
import {useCallback, useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import SheetNameTitle from "@coreModule/components/entityPage/sheet/sheetNameTitle.tsx";
import StatusBadge from "@coreModule/components/entityPage/sheet/statusBadge.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import PausePromotionDropdown from "@marketplaceModule/clients/panel/private/promotions/center/actions/pausePromotionDropdown.tsx";
import ResumePromotionDropdown from "@marketplaceModule/clients/panel/private/promotions/center/actions/resumePromotionDropdown.tsx";
import StopPromotionDropdown from "@marketplaceModule/clients/panel/private/promotions/center/actions/stopPromotionDropdown.tsx";
import ChangePromotionLifecycleAction from "@marketplaceModule/components/custom/promotions/changePromotionLifecycleAction.tsx";
import type {Promotion} from "armonia/src/modules/marketplace/api/marketplace/private/promotion/promotion.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";

export type PromotionSheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    promotion?: Promotion;
    hideActions?: boolean;
    onDelete?: (response?: DeletedData) => void;
    onRestore?: () => void;
    fetchId?: string;
    /** When lifecycle changes inside the sheet, mirror into the owning list/card row when provided. */
    onListLifecyclePatched?: (patch: Partial<Promotion>) => void;
};

function PromotionSheetView({
    open,
    onOpenChange,
    promotion: promotionProp,
    resolveLanguageKey,
    hideActions = false,
    onDelete: onDeleteProp = () => {},
    onRestore: onRestoreProp = () => {},
    fetchId,
    onListLifecyclePatched,
}: PromotionSheetViewOwnProps & WithLanguageType) {
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(promotionProp || {_id: fetchId});
    const [action, setAction] = useState("");
    const access = useAccess("promotions");
    const viewConfig = useViewConfig("promotions", "sheet");

    useEffect(() => {
        if (!promotionProp) return;
        setSheetData(promotionProp);
    }, [promotionProp]);

    useEffect(() => {
        if (!open) setAction("");
    }, [open]);

    const handleDelete = useCallback(
        (response?: DeletedData) => {
            if (response?.deletedAt != null || response?.deletedBy != null) {
                setSheetData((prev) => ({...prev, ...response}));
            }
            onDeleteProp(response);
        },
        [onDeleteProp],
    );

    const handleRestore = useCallback(() => {
        setSheetData((prev) => ({
            ...prev,
            deletedAt: undefined,
            deletedBy: undefined,
        }));
        onRestoreProp();
    }, [onRestoreProp]);

    const entityId = promotionProp?._id ?? fetchId;
    const asPromotion = sheetData as Promotion;
    const listingTitle = asPromotion.listing?.title;
    const lifecycle = asPromotion.lifecycleStatus ?? "active";
    const endStillFuture =
        !!asPromotion.endAt && !Number.isNaN(new Date(asPromotion.endAt).getTime())
            ? new Date(asPromotion.endAt).getTime() > Date.now()
            : false;

    if (!viewConfig || !entityId) {
        return null;
    }

    return (
        <>
            <SheetViewRenderer
                config={viewConfig}
                url="/api/marketplace/promotion/single"
                fetchId={fetchId}
                onDataFetched={setSheetData}
                data={sheetData}
                open={open}
                onOpenChange={onOpenChange}
                resolveLanguageKey={resolveLanguageKey}
                // Named by its name (else the promoted listing), with its lifecycle in tone (UX-01, UX-02).
                headerTitle={<SheetNameTitle name={asPromotion.name || listingTitle || ""} typeLabel={String(resolveLanguageKey("promotion"))} />}
                headerDescription={<StatusBadge tableConfigKey="promotions" field="lifecycleStatus" value={lifecycle} label={String(resolveLanguageKey(`lifecycleStatuses.${lifecycle}`))} />}
                access={access}
                hideActions={hideActions}
                onDelete={handleDelete}
                onRestore={handleRestore}
                hideEdit
                editPath=""
                actionMenuAllowCustomChildren
                deleteRestoreConfirmLabel={listingTitle}
                actionMenuChildren={
                    <>
                        {!asPromotion.deletedAt && lifecycle === "active" && (
                            <PausePromotionDropdown onAction={setAction} />
                        )}
                        {!asPromotion.deletedAt && lifecycle === "paused" && endStillFuture && (
                            <ResumePromotionDropdown onAction={setAction} />
                        )}
                        {!asPromotion.deletedAt && lifecycle !== "stopped" && (
                            <StopPromotionDropdown onAction={setAction} />
                        )}
                    </>
                }
                onSheetRowPatched={setSheetData}
            />
            {(action === "pause" || action === "resume" || action === "stop") && (
                <ChangePromotionLifecycleAction
                    promotionId={asPromotion._id}
                    listingTitle={listingTitle}
                    verb={action}
                    openAlert
                    url={`/api/marketplace/promotion/${action}`}
                    onSuccess={(patch: Partial<Promotion>) => {
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
    withLanguage("src/modules/marketplace/clients/panel/private/promotions/center/sheetView/promotionSheetView.tsx"),
    withDebug(true, true, "promotions"),
)(PromotionSheetView);
