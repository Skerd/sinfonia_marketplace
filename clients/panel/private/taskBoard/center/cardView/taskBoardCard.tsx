import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import type {TaskBoardTask} from "armonia/src/modules/marketplace/api/marketplace/private/taskBoard/taskBoard.types.ts";
import EntityCard from "@coreModule/components/entityPage/list/card/entityCard.tsx";
import EntityCardRow from "@coreModule/components/entityPage/list/card/entityCardRow.tsx";
import StatusBadge from "@coreModule/components/entityPage/sheet/statusBadge.tsx";
import {AccessGatedGalleryCarousel} from "@coreModule/components/viewEngine/widgets/gallery/galleryCarousel.tsx";
import {IconBuilding, IconCalendar, IconCurrencyDollar, IconWorld} from "@tabler/icons-react";
import QuoteLeadAction from "@marketplaceModule/components/custom/taskLeads/quoteLeadAction.tsx";
import TaskBoardSheetView from "../sheetView/taskBoardSheetView.tsx";
import QuoteTaskBoardDropdown from "../actions/quoteTaskBoardDropdown.tsx";
import TaskBoardQuotes from "./taskBoardQuotes.tsx";

type TaskBoardCardProps = WithLanguageType & {
    task: TaskBoardTask;
};

/**
 * A task of the task board (D172) at a glance (UX-02): what it is and its first photo, where (or online), until when,
 * the budget, then how the quoting goes; the caller's own lead status as the badge once they have one.
 */
function TaskBoardCard({task, resolveLanguageKey}: TaskBoardCardProps) {
    return (
        <EntityCard
            resource="taskleads"
            entity={task}
            singleUrl="/api/marketplace/taskBoard/single"
            hideEdit
            editPath={() => ""}
            Sheet={TaskBoardSheetView}
            sheetEntityProp="task"
            deleteUrl=""
            restoreUrl=""
            hideDelete
            hideRestore
            failedTitle={resolveLanguageKey("failedTitle")}
            failedDescription={resolveLanguageKey("failedDescription")}
            titlePath="taskRequest.title"
            sheetProps={({setAction}) => ({onAction: setAction})}
            extraDialogs={({action, setAction, entity: row, retry}) => action === "quote" ? (
                <QuoteLeadAction
                    lead={{_id: row._id, taskRequest: row}}
                    url="/api/marketplace/taskLead/quoteJob"
                    openAlert
                    // The server's own count and average, and the new lead: read the task again.
                    onSuccess={() => { setAction(""); retry(); }}
                    onCancel={() => setAction("")}
                />
            ) : null}
        >
            {({entity: row, read, setAction}) => (
                <>
                    <div className="-mx-(--density-pad) -mt-(--density-pad) w-[calc(100%+2*var(--density-pad))]">
                        <AccessGatedGalleryCarousel
                            read={read}
                            imageGallery={[row.mainImage, ...(row.imageGallery ?? [])].filter((media) => !!media)}
                            mainImagePath="taskRequest.mainImage"
                            imageGalleryPath="taskRequest.imageGallery"
                            showThumbnails={false}
                            allowFullScreen={false}
                            coverAfterFirst
                        />
                    </div>
                    <EntityCard.Header
                        titlePath="taskRequest.title"
                        title={row.title}
                        subtitlePath="taskRequest.category"
                        subtitle={row.category?.name}
                        badgesBesideTitle
                        badges={row.myLead ? (
                            <StatusBadge tableConfigKey="taskleads" field="status" value={row.myLead.status} label={String(resolveLanguageKey(`taskLeadStatus.${row.myLead.status}`))} />
                        ) : null}
                    >
                        <QuoteTaskBoardDropdown task={row} onAction={setAction} />
                    </EntityCard.Header>
                    <EntityCard.Body>
                        {row.address?.city?.name ? (
                            <EntityCardRow icon={IconBuilding} label={resolveLanguageKey("city")} tooltip={resolveLanguageKey("city")} path="taskRequest.address.city" value={row.address.city.name} />
                        ) : (
                            <EntityCardRow icon={IconWorld} label={resolveLanguageKey("where")} tooltip={resolveLanguageKey("where")} path="taskRequest.category" value={String(resolveLanguageKey("online"))} />
                        )}
                        {row.expiresAt ? (
                            <EntityCardRow icon={IconCalendar} label={resolveLanguageKey("expiresAt")} tooltip={resolveLanguageKey("expiresAt")} path="taskRequest.expiresAt" type="date" value={row.expiresAt} />
                        ) : null}
                        {row.budgetMax != null ? (
                            <EntityCardRow icon={IconCurrencyDollar} label={resolveLanguageKey("budget")} tooltip={resolveLanguageKey("budget")} path="taskRequest.budgetMax" type="currency" value={{amount: row.budgetMax, currency: row.currency}} />
                        ) : null}
                        <TaskBoardQuotes task={row} />
                    </EntityCard.Body>
                </>
            )}
        </EntityCard>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/taskBoard/center/cardView/taskBoardCard.tsx"),
    withDebug(true, true, "taskleads"),
)(TaskBoardCard);
