import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import type {Listing} from "armonia/src/modules/marketplace/api/marketplace/private/listing/listing.dto.ts";
import {IconClock, IconSparkles, IconStar} from "@tabler/icons-react";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import ListingSheetView from "@marketplaceModule/clients/panel/private/listings/center/sheetView/listingSheetView.tsx";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import ActivateListingDropdown from "@marketplaceModule/clients/panel/private/listings/center/actions/activateListingDropdown.tsx";
import DeactivateListingDropdown from "@marketplaceModule/clients/panel/private/listings/center/actions/deactivateListingDropdown.tsx";
import CreateOrderFromListingDropdown from "@marketplaceModule/clients/panel/private/listings/center/actions/createOrderFromListingDropdown.tsx";
import ChangeListingStatusAction from "@marketplaceModule/components/custom/listings/changeListingStatusAction.tsx";
import CreateOrderFromListingAction from "@marketplaceModule/components/custom/listings/createOrderFromListingAction.tsx";
import DisplayValue from "@coreModule/components/viewEngine/widgets/display/displayValue.tsx";
import EntityCard from "@coreModule/components/entityPage/list/card/entityCard.tsx";
import StatusBadge from "@coreModule/components/entityPage/sheet/statusBadge.tsx";
import {AccessGatedGalleryCarousel} from "@coreModule/components/viewEngine/widgets/gallery/galleryCarousel.tsx";
import {accessFieldPathExists} from "@coreModule/helpers/context/accessContext.tsx";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";
import type {RefObject} from "react";

function listingEditPath(listing: Listing) {
    const params = new URLSearchParams();
    params.set("listingId", listing._id);
    if (listing.title) params.set("listingTitle", listing.title);
    return `/marketplace/listings/edit?${params.toString()}`;
}

type ListingCardProps = WithLanguageType & {
    listing: Listing;
    fetchId?: string;
    onDelete?: (deleted?: Listing, response?: DeletedData) => void;
    onRestore?: () => void;
    hideActions?: boolean;
    sheetOnly?: boolean;
    innerRef?: RefObject<WithAxiosLifecycleRef<Listing> | null>;
};

function ListingCard({
    listing,
    resolveLanguageKey,
    fetchId,
    onDelete,
    onRestore,
    hideActions = false,
    sheetOnly = false,
    innerRef,
}: ListingCardProps) {
    return (
        <EntityCard
            resource="listings"
            entity={listing}
            fetchId={fetchId}
            singleUrl="/api/marketplace/listing/single"
            onDelete={onDelete}
            onRestore={onRestore}
            hideActions={hideActions}
            sheetOnly={sheetOnly}
            editPath={listingEditPath}
            Sheet={ListingSheetView}
            sheetEntityProp="listing"
            deleteUrl="/api/marketplace/listing"
            restoreUrl="/api/marketplace/listing/restore"
            failedTitle={resolveLanguageKey("failedTitle")}
            failedDescription={resolveLanguageKey("failedDescription")}
            titlePath="title"
            innerRef={innerRef}
            sheetProps={({entity: row, setEntity}) => ({
                fetchId,
                onSheetRowPatched: (patch: Partial<Listing>) => setEntity({...row, ...patch}),
            })}
            extraDialogs={({action, setAction, entity: row, setEntity}) => (
                <>
                    {(action === "activate" || action === "deactivate") && (
                        <ChangeListingStatusAction
                            listingId={row._id}
                            listingTitle={row.title}
                            targetStatus={action === "activate" ? "active" : "inactive"}
                            openAlert
                            url={`/api/marketplace/listing/${action}`}
                            onSuccess={(newStatus: string) => {
                                setEntity({...row, status: newStatus});
                                setAction("");
                            }}
                            onCancel={() => setAction("")}
                        />
                    )}
                    {action === "createOrderFromListing" && (
                        <CreateOrderFromListingAction
                            listingId={row._id}
                            displayName={row.title}
                            openAlert
                            url="/api/marketplace/order/createFromListing"
                            onSuccess={() => setAction("")}
                            onCancel={() => setAction("")}
                        />
                    )}
                </>
            )}
        >
            {({entity: row, read, setAction}) => {
                const promotionType = row.promotions?.some((p) => p.type === "featured")
                    ? "featured"
                    : row.promotions?.some((p) => p.type === "sponsored")
                      ? "sponsored"
                      : undefined;
                /* `avgRating` defaults to 0, so the stars only mean something once there are reviews. */
                const rating =
                    accessFieldPathExists(read, "avgRating") && accessFieldPathExists(read, "reviewCount") && row.reviewCount
                        ? row.avgRating
                        : undefined;
                const description = accessFieldPathExists(read, "description") ? row.description : "";
                const canReadPrice = accessFieldPathExists(read, "price");
                const currency = accessFieldPathExists(read, "priceCurrency") ? row.priceCurrency : undefined;
                const isHourly = accessFieldPathExists(read, "pricingType") && row.pricingType === "hourly";
                const showGallery =
                    read == null ||
                    accessFieldPathExists(read, "mainImage") ||
                    accessFieldPathExists(read, "imageGallery") ||
                    accessFieldPathExists(read, "videoGallery");
                return (
                    <>
                        {showGallery ? (
                            <div className="relative -mx-(--density-pad) -mt-(--density-pad) w-[calc(100%+2*var(--density-pad))]">
                                <AccessGatedGalleryCarousel
                                    read={read}
                                    mainImage={row.mainImage}
                                    imageGallery={row.imageGallery || []}
                                    videoGallery={row.videoGallery || []}
                                    showThumbnails={false}
                                    allowFullScreen={false}
                                    coverAfterFirst
                                />
                                <div className="pointer-events-none absolute top-2 left-2 z-20 flex flex-row flex-wrap items-center gap-1">
                                    {row.category?.name ? (
                                        <DisplayValue path="category.name" value={row.category.name}>
                                            {(label) => (
                                                <Badge variant="secondary" className="pointer-events-auto px-1.5 py-0 text-3xs">
                                                    {label}
                                                </Badge>
                                            )}
                                        </DisplayValue>
                                    ) : null}
                                    {promotionType ? (
                                        <DisplayValue path="promotions" value={resolveLanguageKey(promotionType)}>
                                            {(label) => (
                                                <Badge className="pointer-events-auto gap-1 px-1.5 py-0 text-3xs">
                                                    <IconSparkles className="size-3" />
                                                    {label}
                                                </Badge>
                                            )}
                                        </DisplayValue>
                                    ) : null}
                                </div>
                                {row.deliveryDays != null ? (
                                    <div className="pointer-events-none absolute right-2 bottom-2 z-20">
                                        <DisplayValue path="deliveryDays" value={row.deliveryDays}>
                                            {(days) => (
                                                <Badge variant="secondary" className="pointer-events-auto gap-1 px-1.5 py-0 text-3xs">
                                                    <IconClock className="size-3" />
                                                    {days} {resolveLanguageKey("days")}
                                                </Badge>
                                            )}
                                        </DisplayValue>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                        <EntityCard.Header
                            titlePath="title"
                            title={row.title}
                            badgesBesideTitle
                            badges={
                                <StatusBadge
                                    tableConfigKey="listings"
                                    field="status"
                                    value={accessFieldPathExists(read, "status") ? row.status : undefined}
                                    label={String(resolveLanguageKey(`statuses.${row.status}`))}
                                />
                            }
                        >
                            {row.status !== "active" && !row.deletedAt && (
                                <ActivateListingDropdown onAction={setAction} />
                            )}
                            {row.status !== "inactive" && !row.deletedAt && (
                                <DeactivateListingDropdown onAction={setAction} />
                            )}
                            <CreateOrderFromListingDropdown listing={row} onAction={setAction} />
                        </EntityCard.Header>
                        <div className="flex flex-col gap-2">
                            {rating != null ? (
                                <DisplayValue path="avgRating" value={rating}>
                                    {() => (
                                        <div className="flex items-center gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <IconStar
                                                    key={i}
                                                    className={cn(
                                                        "size-3",
                                                        i < Math.floor(rating)
                                                            ? "fill-current text-warning"
                                                            : "text-muted-foreground/40",
                                                    )}
                                                />
                                            ))}
                                            <span className="ml-1.5 text-3xs text-muted-foreground">
                                                ({rating.toFixed(1)})
                                            </span>
                                        </div>
                                    )}
                                </DisplayValue>
                            ) : null}
                            {description ? (
                                <DisplayValue path="description" value={description}>
                                    {(text) => (
                                        <p className="line-clamp-2 text-xs text-muted-foreground">{text}</p>
                                    )}
                                </DisplayValue>
                            ) : null}
                            <div className="flex items-center gap-2">
                                <div className="flex min-w-0 items-end gap-1">
                                    <span className="text-base font-semibold leading-none">
                                        <DisplayValue
                                            path="price"
                                            type="currency"
                                            value={{amount: canReadPrice ? row.price : undefined, currency}}
                                        />
                                    </span>
                                    {canReadPrice && isHourly ? (
                                        <span className="mb-px text-xs text-muted-foreground">
                                            / {resolveLanguageKey("perHour")}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </>
                );
            }}
        </EntityCard>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/listings/center/cardView/listingCard.tsx"),
    withDebug(true, true, "listings"),
)(ListingCard);
