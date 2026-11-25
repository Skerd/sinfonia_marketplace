import {useMemo} from "react";
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import EntityListPage, {EntityListCreateButton, EntityListHeader, type QuickFilterDef} from "@coreModule/components/entityPage/pages/entityListPage.tsx";
import {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators.ts";
import {ReportDialog} from "@coreModule/components/custom/report/reportButton.tsx";
import ReportMenuItem, {REPORT_TO_PLATFORM_ACTION} from "@coreModule/components/custom/report/reportMenuItem.tsx";
import {REVIEW_REPORT_KIND} from "armonia/src/modules/marketplace/api/marketplace/private/review/review.dto.ts";
import {IconPlus} from "@tabler/icons-react";
import type {Review} from "armonia/src/modules/marketplace/api/marketplace/private/review/review.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import ReviewCard from "./center/cardView/reviewCard.tsx";
import ReviewSheetView from "./center/sheetView/reviewSheetView.tsx";
import {getName} from "@coreModule/helpers/general/names.ts";

/** Reviews are not edited via a form page, and nobody in the company deletes one (D191): staff report one to the platform. */
function noopReviewEditPath(_review: Pick<Review, "_id">): string {
    return "";
}

function reviewRowLabel(review: Review): string {
    const name = getName(review.reviewer);
    if (name) return `${review.rating}/5 — ${name}`;
    return `${review.rating}/5`;
}

function AllReviews({resolveLanguageKey}: WithLanguageType) {
    const quickFilters = useMemo<QuickFilterDef[]>(() => [
        {
            field: "hiddenByPlatform",
            label: resolveLanguageKey("fields.hiddenByPlatform"),
            type: COLUMN_TYPE.BOOLEAN,
        },
    ], [resolveLanguageKey]);
    return (
        <EntityListPage<Review>
            apiUrl="/api/marketplace/review"
            collectionName="reviews"
            accessModel="reviews"
            tableConfigKey="reviews"
            header={(ctx) => (
                <EntityListHeader ctx={ctx}>
                    <EntityListCreateButton
                        ctx={ctx}
                        path="/marketplace/reviews/create"
                        icon={<IconPlus />}
                        labelKey="createReview"
                    />
                </EntityListHeader>
            )}
            buildEditPath={noopReviewEditPath}
            resolveLanguageKey={resolveLanguageKey}
            sheetLanguagePath="src/modules/marketplace/clients/panel/private/reviews/center/sheetView/reviewSheetView.tsx"
            cardViewClassName="grid grid-cols-1 gap-2 md:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            quickFilters={quickFilters}
            rowActionMenu={{allowMenuForCustomChildren: true, hideEdit: true}}
            renderActionMenuChildren={(entity, bindRowAction) => (
                <ReportMenuItem hidden={entity.hiddenByPlatform} onAction={bindRowAction} />
            )}
            renderFloatingModals={({action, entity, resetAction}) => (
                action === REPORT_TO_PLATFORM_ACTION ? (
                    <ReportDialog kind={REVIEW_REPORT_KIND} recordId={entity._id} open onOpenChange={(next) => { if (!next) resetAction(); }} />
                ) : null
            )}
            buildDeleteConfirmLabel={(entity) => reviewRowLabel(entity)}
            renderSheet={({entity, open, onOpenChange, onDelete, onRestore}) => (
                <ReviewSheetView
                    open={open}
                    onOpenChange={(opened: boolean) => {
                        if (!opened) {
                            onOpenChange();
                        }
                    }}
                    review={entity}
                    fetchId={entity._id}
                    onDelete={onDelete}
                    onRestore={onRestore}
                />
            )}
            renderCard={(review, onDelete, onRestore) => (
                <ReviewCard
                    review={review}
                    onDelete={(row: Review | undefined, response?: DeletedData) => onDelete(row ?? review, response)}
                    onRestore={() => onRestore(review)}
                />
            )}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/reviews/index.tsx"),
    withDebug(true, true, "reviews"),
)(AllReviews);
