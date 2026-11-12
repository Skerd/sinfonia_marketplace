import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import type {TaskRequest} from "armonia/src/modules/marketplace/api/marketplace/private/taskRequest/taskRequest.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import {IconCalendar, IconCurrencyDollar, IconUser, IconUsers} from "@tabler/icons-react";
import StatusBadge from "@coreModule/components/entityPage/sheet/statusBadge.tsx";
import TaskRequestSheetView from "@marketplaceModule/clients/panel/private/taskRequests/center/sheetView/taskRequestSheetView.tsx";
import CloseTaskRequestDropdown from "@marketplaceModule/clients/panel/private/taskRequests/center/actions/closeTaskRequestDropdown.tsx";
import ReopenTaskRequestDropdown from "@marketplaceModule/clients/panel/private/taskRequests/center/actions/reopenTaskRequestDropdown.tsx";
import NotifyAllTaskRequestDropdown from "@marketplaceModule/clients/panel/private/taskRequests/center/actions/notifyAllTaskRequestDropdown.tsx";
import TaskRequestStatusConfirmAction from "@marketplaceModule/components/custom/taskRequests/taskRequestStatusConfirmAction.tsx";
import TaskRequestNotifyAllConfirmAction from "@marketplaceModule/components/custom/taskRequests/taskRequestNotifyAllConfirmAction.tsx";
import {taskRequestEditPath} from "@marketplaceModule/clients/panel/private/taskRequests";
import EntityCard from "@coreModule/components/entityPage/list/card/entityCard.tsx";
import EntityCardRow from "@coreModule/components/entityPage/list/card/entityCardRow.tsx";
import {AccessGatedGalleryCarousel} from "@coreModule/components/viewEngine/widgets/gallery/galleryCarousel.tsx";
import {accessFieldPathExists} from "@coreModule/helpers/context/accessContext.tsx";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";
import type {RefObject} from "react";
import {formatNumber} from "@coreModule/helpers/general/numbers.ts";

/** The "up to" budget ("€ 300") when the session may read it; it carries the currency (UX-07). */
function formatBudget(entity: TaskRequest, read: unknown): string | undefined {
    const budgetMax = accessFieldPathExists(read, "budgetMax") ? entity.budgetMax : undefined;
    if (budgetMax == null) return undefined;
    const currency = accessFieldPathExists(read, "currency") ? entity.currency : undefined;
    const sym = currency?.symbol?.trim() || currency?.abbreviation?.trim();
    const decimals = currency?.decimalPlaces ?? 2;
    const amount = formatNumber(budgetMax, {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
    return sym ? `${sym} ${amount}` : amount;
}

type TaskRequestCardProps = WithLanguageType & {
    entity: TaskRequest;
    fetchId?: string;
    onDelete?: (entity?: TaskRequest, response?: DeletedData) => void;
    onRestore?: () => void;
    onEntityUpdated?: (entity: TaskRequest) => void;
    hideActions?: boolean;
    sheetOnly?: boolean;
    innerRef?: RefObject<WithAxiosLifecycleRef<TaskRequest> | null>;
};

function TaskRequestCard({
    entity,
    fetchId,
    resolveLanguageKey,
    onDelete,
    onRestore,
    onEntityUpdated,
    hideActions = false,
    sheetOnly = false,
    innerRef,
}: TaskRequestCardProps) {
    return (
        <EntityCard
            resource="taskRequests"
            entity={entity}
            fetchId={fetchId}
            singleUrl="/api/marketplace/taskRequest/single"
            onDelete={onDelete}
            onRestore={onRestore}
            hideActions={hideActions}
            sheetOnly={sheetOnly}
            editPath={taskRequestEditPath}
            Sheet={TaskRequestSheetView}
            sheetEntityProp="entity"
            deleteUrl="/api/marketplace/taskRequest"
            restoreUrl="/api/marketplace/taskRequest/restore"
            failedTitle={resolveLanguageKey("failedTitle")}
            failedDescription={resolveLanguageKey("failedDescription")}
            titlePath="title"
            innerRef={innerRef}
            sheetProps={({entity: row, setEntity}) => ({
                fetchId,
                onEntityUpdated: (updated: TaskRequest) => {
                    setEntity({...row, ...updated});
                    onEntityUpdated?.(updated);
                },
            })}
            extraDialogs={({action, setAction, entity: row, setEntity}) => (
                <>
                    {action === "notifyAll" && (
                        <TaskRequestNotifyAllConfirmAction
                            taskRequestId={row._id}
                            displayName={row.title}
                            openAlert
                            url="/api/marketplace/taskRequest/notifyAll"
                            onSuccess={() => setAction("")}
                            onCancel={() => setAction("")}
                        />
                    )}
                    {(action === "close" || action === "reopen") && (
                        <TaskRequestStatusConfirmAction
                            actionKey={action}
                            taskRequestId={row._id}
                            displayName={row.title}
                            openAlert
                            url={`/api/marketplace/taskRequest/${action}`}
                            onSuccess={(newStatus: TaskRequest["status"]) => {
                                const updated = {...row, status: newStatus};
                                setEntity(updated);
                                onEntityUpdated?.(updated);
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
                    <AccessGatedGalleryCarousel
                        read={read}
                        mainImage={row.mainImage}
                        imageGallery={row.imageGallery || []}
                        videoGallery={row.videoGallery || []}
                        showThumbnails={false}
                        allowFullScreen={false}
                        coverAfterFirst
                    />
                    {/* Title, category as subtitle, status in tone; then who → when → how much → bids (UX-02). */}
                    <EntityCard.Header
                        titlePath="title"
                        title={row.title}
                        subtitlePath="category.name"
                        subtitle={row.category?.name}
                        badgesBesideTitle
                        badges={<StatusBadge tableConfigKey="taskrequests" field="status" value={row.status} label={String(resolveLanguageKey(`statuses.${row.status}`))} />}
                    >
                        <NotifyAllTaskRequestDropdown entity={row} onAction={setAction} />
                        <CloseTaskRequestDropdown entity={row} onAction={setAction} />
                        <ReopenTaskRequestDropdown entity={row} onAction={setAction} />
                    </EntityCard.Header>
                    <EntityCard.Body>
                        <EntityCardRow
                            icon={IconUser}
                            label={resolveLanguageKey("requester")}
                            tooltip={resolveLanguageKey("requester")}
                            path="requester"
                            type="user"
                            value={row.requester}
                        />
                        <EntityCardRow
                            icon={IconCalendar}
                            label={resolveLanguageKey("expiresAt")}
                            tooltip={resolveLanguageKey("expiresAt")}
                            path="expiresAt"
                            type="date"
                            value={row.expiresAt}
                        />
                        <EntityCardRow
                            icon={IconCurrencyDollar}
                            label={resolveLanguageKey("budget")}
                            tooltip={resolveLanguageKey("budget")}
                            show={!!formatBudget(row, read)}
                            value={formatBudget(row, read)}
                        />
                        {/* Counted by the API, not a model field: the backend decides whether it is sent. */}
                        {row.bidCount != null && (
                            <EntityCardRow
                                icon={IconUsers}
                                label={resolveLanguageKey("bids")}
                                tooltip={resolveLanguageKey("bids")}
                                show
                                type="number"
                                value={row.bidCount}
                            />
                        )}
                    </EntityCard.Body>
                </>
            )}
        </EntityCard>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/taskRequests/center/cardView/taskRequestCard.tsx"),
    withDebug(true, true, "taskRequests"),
)(TaskRequestCard);
