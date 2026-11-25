import {compose} from "redux";
import {useMemo} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import EntityListPage, {EntityListCreateButton, EntityListHeader, type QuickFilterDef} from "@coreModule/components/entityPage/pages/entityListPage.tsx";
import {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators.ts";
import {disputeStatuses} from "armonia/src/modules/marketplace/api/marketplace/private/dispute/dispute.schema-def.ts";
import {IconPlus} from "@tabler/icons-react";
import type {Dispute, DisputeAccessResponse} from "armonia/src/modules/marketplace/api/marketplace/private/dispute/dispute.dto.ts";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import DisputeCard from "./center/cardView/disputeCard.tsx";
import ChangeDisputeLifecycleAction from "@marketplaceModule/components/custom/disputes/changeDisputeLifecycleAction.tsx";
import StartReviewDisputeDropdown from "@marketplaceModule/clients/panel/private/disputes/center/actions/startReviewDisputeDropdown.tsx";
import ResolveDisputeDropdown from "@marketplaceModule/clients/panel/private/disputes/center/actions/resolveDisputeDropdown.tsx";
import CloseDisputeDropdown from "@marketplaceModule/clients/panel/private/disputes/center/actions/closeDisputeDropdown.tsx";
import DisputeSheetView from "./center/sheetView/disputeSheetView.tsx";

const ACCESS_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/dispute/access"};
const PARTY_API = "/api/marketplace/dispute";
/** The marketplace operator's list of every company's disputes, which its admins decide (D191). */
const OPERATOR_API = "/api/marketplace/dispute/operator";

/** Disputes are not edited via a form page; lifecycle uses actions only (mirrors promotions). */
function noopDisputeEditPath(_dispute: Pick<Dispute, "_id">): string {
    return "";
}

function disputeRowLabel(dispute: Dispute): string {
    return dispute.reason?.trim() ? dispute.reason.slice(0, 80) + (dispute.reason.length > 80 ? "…" : "") : dispute._id;
}

/**
 * The parties' disputes, or, at the marketplace operator, every company's (D191). Only the operator's admins decide one;
 * the seller and the buyer see it and its decision.
 */
function AllDisputes({resolveLanguageKey}: WithLanguageType) {
    const access = useHttpRequest<DisputeAccessResponse>(ACCESS_REQUEST, {}, 1);
    const isOperator = access.data?.data.isOperator === true;
    const apiUrl = isOperator ? OPERATOR_API : PARTY_API;
    const quickFilters = useMemo<QuickFilterDef[]>(() => [
        {
            field: "status",
            label: String(resolveLanguageKey("fields.status")),
            type: COLUMN_TYPE.ENUM,
            enumValues: disputeStatuses.map((value) => ({
                value,
                label: String(resolveLanguageKey(`fields.!enums.status.${value}`)),
            })),
        },
    ], [resolveLanguageKey]);

    // Which list to read is known once the access answer is in (an error falls back to the parties' own list).
    if (!access.data && !access.error) return null;

    return (
        <EntityListPage<Dispute>
            key={apiUrl}
            apiUrl={apiUrl}
            collectionName="disputes"
            accessModel="disputes"
            tableConfigKey="disputes"
            header={(ctx) => (
                <EntityListHeader ctx={ctx}>
                    {/* The parties open disputes; the operator only decides them (D191). */}
                    {isOperator ? null : (
                        <EntityListCreateButton
                            ctx={ctx}
                            path="/marketplace/disputes/create"
                            icon={<IconPlus />}
                            labelKey="createDispute"
                        />
                    )}
                </EntityListHeader>
            )}
            buildEditPath={noopDisputeEditPath}
            resolveLanguageKey={resolveLanguageKey}
            quickFilters={quickFilters}
            sheetLanguagePath="src/modules/marketplace/clients/panel/private/disputes/center/sheetView/disputeSheetView.tsx"
            // Neither party removes a dispute; the marketplace decides it (D191).
            rowActionMenu={{allowMenuForCustomChildren: true, hideEdit: true, hideDelete: true, hideRestore: true}}
            renderActionMenuChildren={(dispute, bindRowAction) => (
                <>
                    <StartReviewDisputeDropdown dispute={dispute} onAction={bindRowAction} />
                    <ResolveDisputeDropdown dispute={dispute} onAction={bindRowAction} />
                    <CloseDisputeDropdown dispute={dispute} onAction={bindRowAction} />
                </>
            )}
            renderFloatingModals={({action, entity, resetAction, listRef}) => {
                if (action !== "startReview" && action !== "resolve" && action !== "close") {
                    return null;
                }
                const label = disputeRowLabel(entity);
                return (
                    <ChangeDisputeLifecycleAction
                        disputeId={entity._id}
                        disputeTitle={label}
                        verb={action}
                        openAlert
                        url={`/api/marketplace/dispute/${action}`}
                        onSuccess={(patch: Partial<Dispute>) => {
                            listRef.current?.updateRow?.(entity._id, patch);
                            resetAction();
                        }}
                        onCancel={resetAction}
                    />
                );
            }}
            buildDeleteConfirmLabel={(entity) => entity.reason ?? entity._id}
            renderSheet={({entity, open, onOpenChange, onDelete, onRestore, listRef}) => (
                <DisputeSheetView
                    open={open}
                    onOpenChange={(opened: boolean) => {
                        if (!opened) {
                            onOpenChange();
                        }
                    }}
                    dispute={entity}
                    singleUrl={`${apiUrl}/single`}
                    onDelete={onDelete}
                    onRestore={onRestore}
                    onListLifecyclePatched={(patch: Partial<Dispute>) => {
                        listRef.current?.updateRow?.(entity._id, patch);
                    }}
                />
            )}
            renderCard={(disputeRow, onDelete, onRestore, listRef) => (
                <DisputeCard
                    dispute={disputeRow}
                    singleUrl={`${apiUrl}/single`}
                    onDelete={(row: Dispute | undefined, response?: DeletedData) => onDelete(row ?? disputeRow, response)}
                    onRestore={() => onRestore(disputeRow)}
                    onLifecyclePatched={(patch: Partial<Dispute>) => listRef?.current?.updateRow?.(disputeRow._id, patch)}
                />
            )}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/disputes/index.tsx"),
    withDebug(true, true, "disputes"),
)(AllDisputes);
