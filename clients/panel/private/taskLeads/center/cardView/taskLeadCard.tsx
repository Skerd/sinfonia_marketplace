import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import type {TaskLead} from "armonia/src/modules/marketplace/api/marketplace/private/taskLead/taskLead.dto.ts";
import EntityCard from "@coreModule/components/entityPage/list/card/entityCard.tsx";
import EntityCardRow from "@coreModule/components/entityPage/list/card/entityCardRow.tsx";
import StatusBadge from "@coreModule/components/entityPage/sheet/statusBadge.tsx";
import {IconBuilding, IconCategory2, IconCurrencyDollar, IconMapPin, IconSend} from "@tabler/icons-react";
import TaskLeadSheetView from "@marketplaceModule/clients/panel/private/taskLeads/center/sheetView/taskLeadSheetView.tsx";
import QuoteTaskLeadDropdown from "@marketplaceModule/clients/panel/private/taskLeads/center/actions/quoteTaskLeadDropdown.tsx";
import DeclineTaskLeadDropdown from "@marketplaceModule/clients/panel/private/taskLeads/center/actions/declineTaskLeadDropdown.tsx";
import QuoteLeadAction from "@marketplaceModule/components/custom/taskLeads/quoteLeadAction.tsx";
import DeclineLeadAction from "@marketplaceModule/components/custom/taskLeads/declineLeadAction.tsx";

type TaskLeadCardProps = WithLanguageType & {
    lead: TaskLead;
    onLeadUpdated?: (patch: Partial<TaskLead>) => void;
};

/** A lead at a glance (UX-01): what the job is, where and how far, the budget, and the quote once sent. */
function TaskLeadCard({lead, resolveLanguageKey, onLeadUpdated}: TaskLeadCardProps) {
    const job = lead.taskRequest;
    return (
        <EntityCard
            resource="taskleads"
            entity={lead}
            singleUrl="/api/marketplace/taskLead/single"
            hideEdit
            editPath={() => ""}
            Sheet={TaskLeadSheetView}
            sheetEntityProp="lead"
            deleteUrl="/api/marketplace/taskLead"
            restoreUrl="/api/marketplace/taskLead/restore"
            failedTitle={resolveLanguageKey("failedTitle")}
            failedDescription={resolveLanguageKey("failedDescription")}
            titlePath="name"
            sheetProps={({entity: row, setEntity}) => ({
                onSheetRowPatched: (patch: Partial<TaskLead>) => {
                    setEntity({...row, ...patch});
                    onLeadUpdated?.(patch);
                },
            })}
            extraDialogs={({action, setAction, entity: row, setEntity}) => {
                const done = (patch: Partial<TaskLead>) => {
                    setEntity({...row, ...patch});
                    onLeadUpdated?.(patch);
                    setAction("");
                };
                if (action === "quote") return <QuoteLeadAction lead={row} openAlert onSuccess={done} onCancel={() => setAction("")} />;
                if (action === "decline") return <DeclineLeadAction lead={row} openAlert onSuccess={done} onCancel={() => setAction("")} />;
                return null;
            }}
        >
            {({entity: row, setAction}) => (
                <>
                    <EntityCard.Header
                        titlePath="taskRequest.title"
                        title={row.taskRequest?.title ?? row.name}
                        subtitlePath="name"
                        subtitle={row.name}
                        badgesBesideTitle
                        badges={<StatusBadge tableConfigKey="taskleads" field="status" value={row.status} label={String(resolveLanguageKey(`taskLeadStatus.${row.status}`))} />}
                    >
                        <QuoteTaskLeadDropdown lead={row} onAction={setAction} />
                        <DeclineTaskLeadDropdown lead={row} onAction={setAction} />
                    </EntityCard.Header>
                    <EntityCard.Body>
                        {job?.category?.name ? (
                            <EntityCardRow icon={IconCategory2} label={resolveLanguageKey("category")} tooltip={resolveLanguageKey("category")} path="taskRequest.category" value={job.category.name} />
                        ) : null}
                        {job?.address?.city?.name ? (
                            <EntityCardRow icon={IconBuilding} label={resolveLanguageKey("city")} tooltip={resolveLanguageKey("city")} path="taskRequest.address.city" value={job.address.city.name} />
                        ) : null}
                        {row.distanceKm != null ? (
                            <EntityCardRow icon={IconMapPin} label={resolveLanguageKey("distance")} tooltip={resolveLanguageKey("distance")} path="distanceKm" type="number" value={row.distanceKm}>
                                {(formatted) => <>{formatted} km</>}
                            </EntityCardRow>
                        ) : null}
                        {job?.budgetMax != null ? (
                            <EntityCardRow icon={IconCurrencyDollar} label={resolveLanguageKey("budget")} tooltip={resolveLanguageKey("budget")} path="taskRequest.budgetMax" type="currency" value={{amount: job.budgetMax, currency: job.currency}} />
                        ) : null}
                        {row.bid ? (
                            <EntityCardRow icon={IconSend} label={resolveLanguageKey("quote")} tooltip={resolveLanguageKey("quote")} path="bid.amount" type="currency" value={{amount: row.bid.amount, currency: row.bid.currency}} />
                        ) : null}
                    </EntityCard.Body>
                </>
            )}
        </EntityCard>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/taskLeads/center/cardView/taskLeadCard.tsx"),
    withDebug(true, true, "taskleads"),
)(TaskLeadCard);
