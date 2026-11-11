import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {IconCalendarEvent, IconMessage, IconUser} from "@tabler/icons-react";
import type {Review} from "armonia/src/modules/marketplace/api/marketplace/private/review/review.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import ReviewSheetView from "../sheetView/reviewSheetView.tsx";
import EntityCard from "@coreModule/components/entityPage/list/card/entityCard.tsx";
import EntityCardRow from "@coreModule/components/entityPage/list/card/entityCardRow.tsx";
import {accessFieldPathExists} from "@coreModule/helpers/context/accessContext.tsx";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";
import type {RefObject} from "react";

/** What was reviewed (the listing, else the order's task request) and its stars, each only when readable (UX-01). */
function reviewCardTitle(review: Review, read: unknown): string {
    const subject =
        (accessFieldPathExists(read, "listing.title") ? review.listing?.title : undefined) ??
        (accessFieldPathExists(read, "order.listing.title") ? review.order?.listing?.title : undefined) ??
        (accessFieldPathExists(read, "order.taskRequest.title") ? review.order?.taskRequest?.title : undefined);
    const stars = accessFieldPathExists(read, "rating") && review.rating ? `★ ${review.rating}` : "";
    return [subject, stars].filter(Boolean).join(" · ");
}

type ReviewCardProps = WithLanguageType & {
    review: Review;
    fetchId?: string;
    onDelete?: (deleted?: Review, response?: DeletedData) => void;
    onRestore?: () => void;
    hideActions?: boolean;
    sheetOnly?: boolean;
    innerRef?: RefObject<WithAxiosLifecycleRef<Review> | null>;
};

function ReviewCard({
    review,
    resolveLanguageKey,
    fetchId,
    onDelete,
    onRestore,
    hideActions = false,
    sheetOnly = false,
    innerRef,
}: ReviewCardProps) {
    return (
        <EntityCard
            resource="reviews"
            entity={review}
            fetchId={fetchId}
            singleUrl="/api/marketplace/review/single"
            onDelete={onDelete}
            onRestore={onRestore}
            hideActions={hideActions}
            hideEdit
            sheetOnly={sheetOnly}
            editPath={() => ""}
            Sheet={ReviewSheetView}
            sheetEntityProp="review"
            deleteUrl="/api/marketplace/review"
            restoreUrl="/api/marketplace/review/restore"
            failedTitle={resolveLanguageKey("failedTitle")}
            failedDescription={resolveLanguageKey("failedDescription")}
            titlePath="listing.title"
            innerRef={innerRef}
            sheetProps={() => ({fetchId: fetchId ?? review._id})}
        >
            {({entity: row, read}) => (
                <>
                    <EntityCard.Header titlePath={["listing.title", "order", "rating"]} title={reviewCardTitle(row, read)} />
                    <EntityCard.Body>
                        <EntityCardRow
                            icon={IconUser}
                            label={resolveLanguageKey("reviewer")}
                            tooltip={resolveLanguageKey("reviewer")}
                            path="reviewer"
                            type="user"
                            value={row.reviewer}
                        />
                        {row.createdAt ? (
                            <EntityCardRow
                                icon={IconCalendarEvent}
                                label={resolveLanguageKey("reviewedAt")}
                                tooltip={resolveLanguageKey("reviewedAt")}
                                path="createdAt"
                                type="date"
                                value={row.createdAt}
                            />
                        ) : null}
                        {row.comment?.trim() ? (
                            <EntityCardRow
                                icon={IconMessage}
                                label={resolveLanguageKey("comment")}
                                tooltip={resolveLanguageKey("comment")}
                                path="comment"
                                value={row.comment}
                            />
                        ) : null}
                    </EntityCard.Body>
                </>
            )}
        </EntityCard>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/reviews/center/cardView/reviewCard.tsx"),
    withDebug(true, true, "reviews"),
)(ReviewCard);
