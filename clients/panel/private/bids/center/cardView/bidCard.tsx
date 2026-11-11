import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import type {Bid} from "armonia/src/modules/marketplace/api/marketplace/private/bid/bid.dto.ts";
import TableAvatar from "@coreModule/components/entityPage/list/tableAvatar.tsx";
import BidSheetView from "@marketplaceModule/clients/panel/private/bids/center/sheetView/bidSheetView.tsx";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import AcceptBidDropdown from "@marketplaceModule/clients/panel/private/bids/center/actions/acceptBidDropdown.tsx";
import RejectBidDropdown from "@marketplaceModule/clients/panel/private/bids/center/actions/rejectBidDropdown.tsx";
import BidActionConfirmAction from "@marketplaceModule/components/custom/bids/bidActionConfirmAction.tsx";
import DisplayValue from "@coreModule/components/viewEngine/widgets/display/displayValue.tsx";
import EntityCard from "@coreModule/components/entityPage/list/card/entityCard.tsx";
import EntityCardRow from "@coreModule/components/entityPage/list/card/entityCardRow.tsx";
import {accessFieldPathExists} from "@coreModule/helpers/context/accessContext.tsx";
import StatusBadge from "@coreModule/components/entityPage/sheet/statusBadge.tsx";
import {IconClock, IconCurrencyDollar} from "@tabler/icons-react";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";
import type {RefObject} from "react";

type BidCardProps = WithLanguageType & {
    bid: Bid;
    fetchId?: string;
    onDelete?: (deleted?: Bid, response?: DeletedData) => void;
    onRestore?: () => void;
    onBidUpdated?: (bid: Bid) => void;
    hideActions?: boolean;
    sheetOnly?: boolean;
    innerRef?: RefObject<WithAxiosLifecycleRef<Bid> | null>;
};

function BidCard({
    bid,
    resolveLanguageKey,
    fetchId,
    onDelete,
    onRestore,
    onBidUpdated,
    hideActions = false,
    sheetOnly = false,
    innerRef,
}: BidCardProps) {
    return (
        <EntityCard
            resource="marketplacebids"
            entity={bid}
            fetchId={fetchId}
            singleUrl="/api/marketplace/bid/single"
            onDelete={onDelete}
            onRestore={onRestore}
            hideActions={hideActions}
            hideEdit
            sheetOnly={sheetOnly}
            editPath={() => ""}
            Sheet={BidSheetView}
            sheetEntityProp="bid"
            deleteUrl="/api/marketplace/bid"
            restoreUrl="/api/marketplace/bid/restore"
            failedTitle={resolveLanguageKey("failedTitle")}
            failedDescription={resolveLanguageKey("failedDescription")}
            titlePath="name"
            innerRef={innerRef}
            sheetProps={({entity: row, setEntity}) => ({
                fetchId,
                onBidUpdated: (updated: Bid) => {
                    setEntity({...row, ...updated});
                    onBidUpdated?.(updated);
                },
                onSheetRowPatched: (patch: Partial<Bid>) => setEntity({...row, ...patch}),
            })}
            extraDialogs={({action, setAction, entity: row, setEntity}) => (
                <>
                    {(action === "accept" || action === "reject") && (
                        <BidActionConfirmAction
                            bidId={row._id}
                            displayName={row.name}
                            actionKey={action}
                            openAlert
                            url={`/api/marketplace/bid/${action}`}
                            onSuccess={(updated: Bid) => {
                                setEntity({...row, ...updated});
                                onBidUpdated?.(updated);
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
                    <EntityCard.Header
                        titlePath="bidder"
                        title={<DisplayValue path="bidder" type="user" value={row.bidder} />}
                        subtitlePath="taskRequest.title"
                        subtitle={row.taskRequest?.title}
                        badgesBesideTitle
                        badges={<StatusBadge tableConfigKey="marketplacebids" field="status" value={row.status} label={String(resolveLanguageKey(`statuses.${row.status}`))} />}
                        icon={
                            accessFieldPathExists(read, "bidder") && row.bidder?.photo ? (
                                <TableAvatar mediaId={row.bidder.photo} />
                            ) : undefined
                        }
                    >
                        <AcceptBidDropdown bid={row} onAction={setAction} />
                        <RejectBidDropdown bid={row} onAction={setAction} />
                    </EntityCard.Header>
                    <EntityCard.Body>
                        <EntityCardRow
                            icon={IconClock}
                            label={resolveLanguageKey("deliveryDays")}
                            tooltip={resolveLanguageKey("deliveryDays")}
                            path="deliveryDays"
                            type="number"
                            value={row.deliveryDays}
                        >
                            {(formatted) => (
                                <>
                                    {formatted} {resolveLanguageKey("days")}
                                </>
                            )}
                        </EntityCardRow>
                        <EntityCardRow
                            icon={IconCurrencyDollar}
                            label={resolveLanguageKey("amount")}
                            tooltip={resolveLanguageKey("amount")}
                            path="amount"
                            type="currency"
                            value={{amount: row.amount, currency: row.currency}}
                        />
                    </EntityCard.Body>
                </>
            )}
        </EntityCard>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/bids/center/cardView/bidCard.tsx"),
    withDebug(true, true, "marketplacebids"),
)(BidCard);
