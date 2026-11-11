import {compose} from "redux";
import {useCallback, useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import SheetNameTitle from "@coreModule/components/entityPage/sheet/sheetNameTitle.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import type {Review} from "armonia/src/modules/marketplace/api/marketplace/private/review/review.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import {getName} from "@coreModule/helpers/general/names.ts";

type ReviewSheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    review?: Review;
    hideActions?: boolean;
    onDelete?: (response?: DeletedData) => void;
    onRestore?: () => void;
    fetchId?: string;
};

function reviewRowLabel(review: Review): string {
    const name = getName(review.reviewer);
    if (name) return `${review.rating}/5 — ${name}`;
    return `${review.rating}/5`;
}

/** The reviewed listing, else the task request of the reviewed order (task-request orders have no listing). */
function reviewSubject(review: Review): string {
    return review.listing?.title ?? review.order?.listing?.title ?? review.order?.taskRequest?.title ?? "";
}

function ReviewSheetView({
    open,
    onOpenChange,
    review: reviewProp,
    resolveLanguageKey,
    hideActions = false,
    onDelete = () => {},
    onRestore = () => {},
    fetchId,
}: ReviewSheetViewOwnProps & WithLanguageType) {
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(reviewProp || {_id: fetchId});
    const access = useAccess("reviews");
    const viewConfig = useViewConfig("reviews", "sheet");

    useEffect(() => {
        if (!reviewProp) return;
        setSheetData(reviewProp);
    }, [reviewProp]);

    const handleDelete = useCallback(
        (response?: DeletedData) => {
            if (response?.deletedAt != null || response?.deletedBy != null) {
                setSheetData((prev) => ({...prev, ...response}));
            }
            onDelete(response);
        },
        [onDelete],
    );

    const handleRestore = useCallback(() => {
        setSheetData((prev) => ({
            ...prev,
            deletedAt: undefined,
            deletedBy: undefined,
        }));
        onRestore();
    }, [onRestore]);

    const entityId = reviewProp?._id ?? fetchId;
    const asReview = sheetData as Review;

    if (!viewConfig || !entityId) return null;

    return (
        <SheetViewRenderer
            config={viewConfig}
            url="/api/marketplace/review/single"
            fetchId={fetchId}
            onDataFetched={setSheetData}
            data={sheetData}
            open={open}
            onOpenChange={onOpenChange}
            resolveLanguageKey={resolveLanguageKey}
            // Named by what was reviewed and its stars, not by the comment text (UX-01).
            headerTitle={<SheetNameTitle name={[reviewSubject(asReview), asReview.rating ? `★ ${asReview.rating}` : ""].filter(Boolean).join(" · ")} typeLabel={String(resolveLanguageKey("review"))} />}
            access={access}
            hideActions={hideActions}
            onDelete={handleDelete}
            onRestore={handleRestore}
            editPath=""
            hideEdit
            deleteRestoreConfirmLabel={reviewRowLabel(asReview)}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/reviews/center/sheetView/reviewSheetView.tsx"),
    withDebug(true, true, "reviews"),
)(ReviewSheetView);
