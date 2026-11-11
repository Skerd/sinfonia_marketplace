import {compose} from "redux";
import {useMemo} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import EntityListPage, {EntityListCreateButton, EntityListHeader, type QuickFilterDef} from "@coreModule/components/entityPage/pages/entityListPage.tsx";
import {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators.ts";
import type {BidStatus} from "armonia/src/modules/marketplace/api/marketplace/private/bid/bid.dto.ts";
import {IconPlus} from "@tabler/icons-react";
import type {Bid} from "armonia/src/modules/marketplace/api/marketplace/private/bid/bid.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import BidCard from "./center/cardView/bidCard.tsx";
import BidSheetView from "./center/sheetView/bidSheetView.tsx";
import AcceptBidDropdown from "./center/actions/acceptBidDropdown.tsx";
import RejectBidDropdown from "./center/actions/rejectBidDropdown.tsx";
import BidActionConfirmAction from "@marketplaceModule/components/custom/bids/bidActionConfirmAction.tsx";

function bidDisplayLabel(bid: Bid): string | undefined {
    return bid.name || bid.taskRequest?.title;
}

const BID_STATUSES: readonly BidStatus[] = ["pending", "accepted", "rejected"];

function AllBids({resolveLanguageKey}: WithLanguageType) {
    const quickFilters = useMemo<QuickFilterDef[]>(() => [
        {
            field: "status",
            label: String(resolveLanguageKey("fields.status")),
            type: COLUMN_TYPE.ENUM,
            enumValues: BID_STATUSES.map((value) => ({
                value,
                label: String(resolveLanguageKey(`fields.!enums.status.${value}`)),
            })),
        },
    ], [resolveLanguageKey]);

    return (
        <EntityListPage<Bid>
            apiUrl="/api/marketplace/bid"
            collectionName="marketplacebids"
            accessModel="marketplacebids"
            tableConfigKey="marketplacebids"
            header={(ctx) => (
                <EntityListHeader ctx={ctx}>
                    <EntityListCreateButton
                        ctx={ctx}
                        path="/marketplace/bids/create"
                        icon={<IconPlus />}
                        labelKey="createBid"
                    />
                </EntityListHeader>
            )}
            buildEditPath={() => ""}
            resolveLanguageKey={resolveLanguageKey}
            quickFilters={quickFilters}
            renderSheet={({entity, open, onOpenChange, onDelete, onRestore, listRef}) => (
                <BidSheetView
                    open={open}
                    onOpenChange={onOpenChange}
                    bid={entity}
                    onDelete={onDelete}
                    onRestore={onRestore}
                    onBidUpdated={(updated: Bid) => listRef.current?.updateRow?.(entity._id, updated as Partial<Bid>)}
                    onSheetRowPatched={(patch: Partial<Bid>) => listRef.current?.updateRow?.(entity._id, patch)}
                />
            )}
            rowActionMenu={{hideEdit: true, allowMenuForCustomChildren: true}}
            renderActionMenuChildren={(bid, bindRowAction) => (
                <>
                    <AcceptBidDropdown bid={bid} onAction={bindRowAction} />
                    <RejectBidDropdown bid={bid} onAction={bindRowAction} />
                </>
            )}
            renderFloatingModals={({action, entity, resetAction, listRef}) => {
                if (action !== "accept" && action !== "reject") return null;
                return (
                    <BidActionConfirmAction
                        bidId={entity._id}
                        displayName={bidDisplayLabel(entity)}
                        actionKey={action}
                        openAlert
                        url={`/api/marketplace/bid/${action}`}
                        onSuccess={(updated: Bid) => {
                            listRef.current?.updateRow?.(entity._id, updated as Partial<Bid>);
                            resetAction();
                        }}
                        onCancel={resetAction}
                    />
                );
            }}
            renderCard={(bid, onDelete, onRestore, listRef) => (
                <BidCard
                    bid={bid}
                    onDelete={(row: Bid, response?: DeletedData) => onDelete(row ?? bid, response)}
                    onRestore={() => onRestore(bid)}
                    onBidUpdated={(updated: Bid) => listRef.current?.updateRow?.(bid._id, updated as Partial<Bid>)}
                />
            )}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/bids/index.tsx"),
    withDebug(true, true, "marketplacebids"),
)(AllBids);
