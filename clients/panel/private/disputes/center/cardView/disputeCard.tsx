import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import type {Dispute} from "armonia/src/modules/marketplace/api/marketplace/private/dispute/dispute.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import DisputeSheetView from "../sheetView/disputeSheetView.tsx";
import ChangeDisputeLifecycleAction from "@marketplaceModule/components/custom/disputes/changeDisputeLifecycleAction.tsx";
import StartReviewDisputeDropdown from "@marketplaceModule/clients/panel/private/disputes/center/actions/startReviewDisputeDropdown.tsx";
import ResolveDisputeDropdown from "@marketplaceModule/clients/panel/private/disputes/center/actions/resolveDisputeDropdown.tsx";
import CloseDisputeDropdown from "@marketplaceModule/clients/panel/private/disputes/center/actions/closeDisputeDropdown.tsx";
import type {DisputeLifecycleVerb} from "@marketplaceModule/components/custom/disputes/changeDisputeLifecycleAction.tsx";
import {IconCalendarEvent, IconCurrencyDollar, IconUser} from "@tabler/icons-react";
import StatusBadge from "@coreModule/components/entityPage/sheet/statusBadge.tsx";
import EntityCard from "@coreModule/components/entityPage/list/card/entityCard.tsx";
import EntityCardRow from "@coreModule/components/entityPage/list/card/entityCardRow.tsx";
import {accessFieldPathExists} from "@coreModule/helpers/context/accessContext.tsx";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";
import type {RefObject} from "react";

function disputeRowTitle(dispute: Dispute): string {
    const r = dispute.reason?.trim();
    return r ? (r.length > 80 ? `${r.slice(0, 80)}…` : r) : dispute._id;
}

/** The disputed order's listing title, else its task request title, each only when readable. */
function disputeOrderTitle(dispute: Dispute, read: unknown) {
    if (accessFieldPathExists(read, "order.listing.title") && dispute.order?.listing?.title) {
        return dispute.order.listing.title;
    }
    return accessFieldPathExists(read, "order.taskRequest.title") ? dispute.order?.taskRequest?.title : undefined;
}

type DisputeCardProps = WithLanguageType & {
    dispute: Dispute;
    fetchId?: string;
    onDelete?: (deleted?: Dispute, response?: DeletedData) => void;
    onRestore?: () => void;
    hideActions?: boolean;
    sheetOnly?: boolean;
    onLifecyclePatched?: (patch: Partial<Dispute>) => void;
    innerRef?: RefObject<WithAxiosLifecycleRef<Dispute> | null>;
};

function DisputeCard({
    dispute,
    resolveLanguageKey,
    fetchId,
    onDelete,
    onRestore,
    hideActions = false,
    sheetOnly = false,
    onLifecyclePatched,
    innerRef,
}: DisputeCardProps) {
    return (
        <EntityCard
            resource="disputes"
            entity={dispute}
            fetchId={fetchId}
            singleUrl="/api/marketplace/dispute/single"
            onDelete={onDelete}
            onRestore={onRestore}
            hideActions={hideActions}
            hideEdit
            sheetOnly={sheetOnly}
            editPath={() => ""}
            Sheet={DisputeSheetView}
            sheetEntityProp="dispute"
            deleteUrl="/api/marketplace/dispute"
            restoreUrl="/api/marketplace/dispute/restore"
            failedTitle={resolveLanguageKey("failedTitle")}
            failedDescription={resolveLanguageKey("failedDescription")}
            titlePath="order.listing.title"
            innerRef={innerRef}
            sheetProps={({entity: row, setEntity}) => ({
                fetchId,
                onListLifecyclePatched: (patch: Partial<Dispute>) => {
                    setEntity({...row, ...patch});
                    onLifecyclePatched?.(patch);
                },
            })}
            extraDialogs={({action, setAction, entity: row, setEntity}) => (
                <>
                    {(action === "startReview" || action === "resolve" || action === "close") && (
                        <ChangeDisputeLifecycleAction
                            disputeId={row._id}
                            disputeTitle={disputeRowTitle(row)}
                            verb={action as DisputeLifecycleVerb}
                            openAlert
                            url={`/api/marketplace/dispute/${action}`}
                            onSuccess={(patch: Partial<Dispute>) => {
                                setEntity({...row, ...patch});
                                onLifecyclePatched?.(patch);
                                setAction("");
                            }}
                            onCancel={() => setAction("")}
                        />
                    )}
                </>
            )}
        >
            {({entity: row, read, setAction}) => (
                <>
                    {/* The disputed order names the card; the reason is its subtitle (UX-01, UX-02). */}
                    <EntityCard.Header
                        titlePath={["order.listing.title", "order.taskRequest.title", "reason"]}
                        title={disputeOrderTitle(row, read) || disputeRowTitle(row)}
                        subtitlePath="reason"
                        subtitle={disputeOrderTitle(row, read) ? disputeRowTitle(row) : undefined}
                        badgesBesideTitle
                        badges={<StatusBadge tableConfigKey="disputes" field="status" value={row.status} label={String(resolveLanguageKey(`status_values.${row.status}`))} />}
                    >
                        <StartReviewDisputeDropdown dispute={row} onAction={setAction} />
                        <ResolveDisputeDropdown dispute={row} onAction={setAction} />
                        <CloseDisputeDropdown dispute={row} onAction={setAction} />
                    </EntityCard.Header>
                    <EntityCard.Body>
                        <EntityCardRow
                            icon={IconUser}
                            label={resolveLanguageKey("initiator")}
                            tooltip={resolveLanguageKey("initiator")}
                            path="initiator"
                            type="user"
                            value={row.initiator}
                        />
                        <EntityCardRow
                            icon={IconCalendarEvent}
                            label={resolveLanguageKey("createdAt")}
                            tooltip={resolveLanguageKey("createdAt")}
                            path="createdAt"
                            type="date"
                            value={row.createdAt}
                        />
                        <EntityCardRow
                            icon={IconCurrencyDollar}
                            label={resolveLanguageKey("amount")}
                            tooltip={resolveLanguageKey("amount")}
                            path="order.amount"
                            type="currency"
                            value={{amount: row.order?.amount, currency: row.order?.currency}}
                        />
                    </EntityCard.Body>
                </>
            )}
        </EntityCard>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/disputes/center/cardView/disputeCard.tsx"),
    withDebug(true, true, "disputes"),
)(DisputeCard);
