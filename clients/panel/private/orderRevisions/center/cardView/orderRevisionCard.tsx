import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import type {OrderRevision} from "armonia/src/modules/marketplace/api/marketplace/private/orderRevision/orderRevision.dto.ts";
import OrderRevisionSheetView from "@marketplaceModule/clients/panel/private/orderRevisions/center/sheetView/orderRevisionSheetView.tsx";
import {IconMessage, IconUser} from "@tabler/icons-react";
import StatusBadge from "@coreModule/components/entityPage/sheet/statusBadge.tsx";
import {DATE_FORMATS, formatDate} from "@coreModule/helpers/general/dateTime.ts";
import {useCompanyTimeZone} from "@coreModule/helpers/hooks/useCompanyTimeZone.ts";
import EntityCard from "@coreModule/components/entityPage/list/card/entityCard.tsx";
import EntityCardRow from "@coreModule/components/entityPage/list/card/entityCardRow.tsx";

type OrderRevisionCardProps = WithLanguageType & {
    revision: OrderRevision;
};

/** One revision the customer asked for, on the order sheet. */
function OrderRevisionCard({revision, resolveLanguageKey}: OrderRevisionCardProps) {
    const companyZone = useCompanyTimeZone();
    return (
        <EntityCard
            resource="orderRevisions"
            entity={revision}
            singleUrl="/api/marketplace/orderRevision/single"
            hideEdit
            hideDelete
            hideRestore
            editPath={() => ""}
            Sheet={OrderRevisionSheetView}
            sheetEntityProp="revision"
            deleteUrl="/api/marketplace/orderRevision"
            restoreUrl="/api/marketplace/orderRevision/restore"
            failedTitle={resolveLanguageKey("failedTitle")}
            failedDescription={resolveLanguageKey("failedDescription")}
            titlePath="createdAt"
        >
            {({entity: row}) => (
                <>
                    {/* "Revision request · 16 Nov 2026" with its status in tone; the card already sits on its order (UX-01, UX-02). */}
                    <EntityCard.Header
                        titlePath="createdAt"
                        title={[String(resolveLanguageKey("revision")), formatDate(row.createdAt, {timeZone: companyZone, format: DATE_FORMATS.mediumDate})].filter(Boolean).join(" · ")}
                        badgesBesideTitle
                        badges={<StatusBadge tableConfigKey="orderrevisions" field="status" value={row.status} label={String(resolveLanguageKey(`orderRevisionStatus.${row.status}`))} />}
                    />
                    <EntityCard.Body>
                        <EntityCardRow
                            icon={IconMessage}
                            label={resolveLanguageKey("reason")}
                            tooltip={resolveLanguageKey("reason")}
                            path="reason"
                            value={row.reason}
                        />
                        <EntityCardRow
                            icon={IconUser}
                            label={resolveLanguageKey("requestedBy")}
                            tooltip={resolveLanguageKey("requestedBy")}
                            path="requestedBy"
                            type="user"
                            value={row.requestedBy}
                        />
                    </EntityCard.Body>
                </>
            )}
        </EntityCard>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/orderRevisions/center/cardView/orderRevisionCard.tsx"),
    withDebug(true, true, "orderRevisions"),
)(OrderRevisionCard);
