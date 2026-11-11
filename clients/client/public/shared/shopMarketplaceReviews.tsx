import {useEffect, useState} from "react";
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {DATE_FORMATS, formatDate} from "@coreModule/helpers/general/dateTime.ts";
import {StarRow} from "@coreModule/clients/portal/shared/starRow.tsx";
import type {
    ShopMarketplaceReview,
    ShopMarketplaceReviewsResponse,
} from "armonia/src/modules/marketplace/api/marketplace/public/shopMarketplace/shopMarketplace.types.ts";

const REVIEWS_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/shopMarketplaceReviews"};
const LANGUAGE_PATH = "src/modules/marketplace/clients/client/public/shared/shopMarketplaceReviews.tsx";

type ShopMarketplaceReviewsProps = WithLanguageType & {
    /** Reviews of one listing, or of every order the provider delivered. */
    listingId?: string;
    providerId?: string;
    average?: number;
    count?: number;
};

/** Read-only reviews block; buyers review from their completed order in the account. */
function ShopMarketplaceReviewsInner({resolveLanguageKey, listingId, providerId, average, count}: ShopMarketplaceReviewsProps) {
    const [reviewsCount, setReviewsCount] = useState(0);
    useEffect(() => {
        setReviewsCount((count) => count + 1);
    }, [listingId, providerId]);
    const reviewsRequest = useHttpRequest<ShopMarketplaceReviewsResponse>(REVIEWS_REQUEST, {listingId, providerId, limit: 20}, reviewsCount);
    const reviews: ShopMarketplaceReview[] = reviewsRequest.error ? [] : reviewsRequest.data?.data ?? [];
    const total = reviewsRequest.data?.total ?? 0;

    return (
        <section id="shop-reviews" className="scroll-mt-28 border-t border-border pt-12" aria-labelledby="shop-reviews-title">
            <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
                <div className="flex flex-col gap-4">
                    <h2 id="shop-reviews-title" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{resolveLanguageKey("title")}</h2>
                    {average != null && count ? (
                        <div className="flex items-center gap-3">
                            <span className="font-display text-5xl font-bold tabular-nums">{average.toFixed(1)}</span>
                            <div className="flex flex-col gap-1">
                                <StarRow value={Math.round(average)} />
                                <span className="text-sm text-muted-foreground">
                                    {resolveLanguageKey(count === 1 ? "countOne" : "count").replace("{count}", String(count))}
                                </span>
                            </div>
                        </div>
                    ) : total > 0 ? (
                        // The stored average can lag behind the reviews; the count comes from the list itself
                        <p className="text-muted-foreground">
                            {resolveLanguageKey(total === 1 ? "countOne" : "count").replace("{count}", String(total))}
                        </p>
                    ) : (
                        <p className="text-muted-foreground">{resolveLanguageKey("empty")}</p>
                    )}
                </div>

                {reviews.length > 0 && (
                    <ul className="flex flex-col divide-y divide-border">
                        {reviews.map(review => (
                            <li key={review._id} className="flex flex-col gap-2 py-6 first:pt-0">
                                <div className="flex items-center justify-between gap-3">
                                    <StarRow value={review.rating} />
                                    <span className="sr-only">{resolveLanguageKey("starsValue").replace("{count}", String(review.rating))}</span>
                                    {review.createdAt && <span className="text-xs text-muted-foreground">{formatDate(review.createdAt, {format: DATE_FORMATS.date})}</span>}
                                </div>
                                {review.comment && <p className="text-[15px] leading-relaxed text-muted-foreground">{review.comment}</p>}
                                <p className="text-sm">
                                    <span className="font-medium">{review.reviewerName}</span>
                                    {providerId && review.listingTitle && <span className="text-muted-foreground"> · {review.listingTitle}</span>}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}

export default compose(withLanguage(LANGUAGE_PATH), withDebug(true, true))(ShopMarketplaceReviewsInner);
