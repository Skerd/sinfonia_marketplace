import {lazy} from "react";
import type {WidgetContribution} from "@coreModule/helpers/types/widgetContribution.types.ts";

const ListingSheetViewLazy = lazy(() => import("@marketplaceModule/clients/panel/private/listings/center/sheetView/listingSheetView.tsx"));
const TaskRequestSheetViewLazy = lazy(() => import("@marketplaceModule/clients/panel/private/taskRequests/center/sheetView/taskRequestSheetView.tsx"));
const OrderSheetViewLazy = lazy(() => import("@marketplaceModule/clients/panel/private/orders/center/sheetView/orderSheetView.tsx"));
const OrderDeliveryCardLazy = lazy(() => import("@marketplaceModule/clients/panel/private/orderDeliveries/center/cardView/orderDeliveryCard.tsx"));
const OrderDeliverySheetViewLazy = lazy(() => import("@marketplaceModule/clients/panel/private/orderDeliveries/center/sheetView/orderDeliverySheetView.tsx"));
const OrderMilestoneCardLazy = lazy(() => import("@marketplaceModule/clients/panel/private/orderMilestones/center/cardView/orderMilestoneCard.tsx"));
const OrderMilestoneSheetViewLazy = lazy(() => import("@marketplaceModule/clients/panel/private/orderMilestones/center/sheetView/orderMilestoneSheetView.tsx"));
const OrderRevisionCardLazy = lazy(() => import("@marketplaceModule/clients/panel/private/orderRevisions/center/cardView/orderRevisionCard.tsx"));
const OrderRevisionSheetViewLazy = lazy(() => import("@marketplaceModule/clients/panel/private/orderRevisions/center/sheetView/orderRevisionSheetView.tsx"));
const PromotionCardLazy = lazy(() => import("@marketplaceModule/clients/panel/private/promotions/center/cardView/promotionCard.tsx"));
const PromotionSheetViewLazy = lazy(() => import("@marketplaceModule/clients/panel/private/promotions/center/sheetView/promotionSheetView.tsx"));
const ListingAddOnCardLazy = lazy(() => import("@marketplaceModule/clients/panel/private/listingAddOns/center/cardView/listingAddOnCard.tsx"));
const ListingAddOnSheetViewLazy = lazy(() => import("@marketplaceModule/clients/panel/private/listingAddOns/center/sheetView/listingAddOnSheetView.tsx"));
const ListingPackageCardLazy = lazy(() => import("@marketplaceModule/clients/panel/private/listingPackages/center/cardView/listingPackageCard.tsx"));
const ListingPackageSheetViewLazy = lazy(() => import("@marketplaceModule/clients/panel/private/listingPackages/center/sheetView/listingPackageSheetView.tsx"));
const BookingSheetViewLazy = lazy(() => import("@marketplaceModule/clients/panel/private/bookings/center/sheetView/bookingSheetView.tsx"));
const ProviderProfileSheetViewLazy = lazy(() => import("@marketplaceModule/clients/panel/private/providerProfile/center/sheetView/providerProfileSheetView.tsx"));
// Cards and sheets the record hubs list (P10.7): a listing's, provider's, order's and task request's related records.
const ListingCardLazy = lazy(() => import("@marketplaceModule/clients/panel/private/listings/center/cardView/listingCard.tsx"));
const OrderCardLazy = lazy(() => import("@marketplaceModule/clients/panel/private/orders/center/cardView/orderCard.tsx"));
const BookingCardLazy = lazy(() => import("@marketplaceModule/clients/panel/private/bookings/center/cardView/bookingCard.tsx"));
const BidCardLazy = lazy(() => import("@marketplaceModule/clients/panel/private/bids/center/cardView/bidCard.tsx"));
const BidSheetViewLazy = lazy(() => import("@marketplaceModule/clients/panel/private/bids/center/sheetView/bidSheetView.tsx"));
const DisputeCardLazy = lazy(() => import("@marketplaceModule/clients/panel/private/disputes/center/cardView/disputeCard.tsx"));
const DisputeSheetViewLazy = lazy(() => import("@marketplaceModule/clients/panel/private/disputes/center/sheetView/disputeSheetView.tsx"));
const ReviewCardLazy = lazy(() => import("@marketplaceModule/clients/panel/private/reviews/center/cardView/reviewCard.tsx"));
const ReviewSheetViewLazy = lazy(() => import("@marketplaceModule/clients/panel/private/reviews/center/sheetView/reviewSheetView.tsx"));
const ListingFlagCardLazy = lazy(() => import("@marketplaceModule/clients/panel/private/listingFlags/center/cardView/listingFlagCard.tsx"));
const ListingFlagSheetViewLazy = lazy(() => import("@marketplaceModule/clients/panel/private/listingFlags/center/sheetView/listingFlagSheetView.tsx"));
const ListingCategorySheetViewLazy = lazy(
    () => import("@marketplaceModule/clients/panel/private/listingCategories/center/sheetView/categorySheetView.tsx"),
);

const marketplaceWidgetContribution: WidgetContribution = {
    id: "marketplace",
    order: 36,
    widgets: {
        "#ListingCategorySheetView": ListingCategorySheetViewLazy,
        "#ListingSheetView": ListingSheetViewLazy,
        "#TaskRequestSheetView": TaskRequestSheetViewLazy,
        "#OrderSheetView": OrderSheetViewLazy,
        "#OrderDeliveryCard": OrderDeliveryCardLazy,
        "#OrderDeliverySheetView": OrderDeliverySheetViewLazy,
        "#OrderMilestoneCard": OrderMilestoneCardLazy,
        "#OrderMilestoneSheetView": OrderMilestoneSheetViewLazy,
        "#OrderRevisionCard": OrderRevisionCardLazy,
        "#OrderRevisionSheetView": OrderRevisionSheetViewLazy,
        "#PromotionCard": PromotionCardLazy,
        "#PromotionSheetView": PromotionSheetViewLazy,
        "#ListingAddOnCard": ListingAddOnCardLazy,
        "#ListingAddOnSheetView": ListingAddOnSheetViewLazy,
        "#ListingPackageCard": ListingPackageCardLazy,
        "#ListingPackageSheetView": ListingPackageSheetViewLazy,
        "#BookingSheetView": BookingSheetViewLazy,
        "#ProviderProfileSheetView": ProviderProfileSheetViewLazy,
        "#ListingCard": ListingCardLazy,
        "#OrderCard": OrderCardLazy,
        "#BookingCard": BookingCardLazy,
        "#BidCard": BidCardLazy,
        "#BidSheetView": BidSheetViewLazy,
        "#DisputeCard": DisputeCardLazy,
        "#DisputeSheetView": DisputeSheetViewLazy,
        "#ReviewCard": ReviewCardLazy,
        "#ReviewSheetView": ReviewSheetViewLazy,
        "#ListingFlagCard": ListingFlagCardLazy,
        "#ListingFlagSheetView": ListingFlagSheetViewLazy,
    },
    referencesDefaultItemProps: {
        "#PromotionCard": "promotion",
        "#ListingAddOnCard": "listingAddOn",
        "#ListingPackageCard": "listingPackage",
        "#OrderDeliveryCard": "delivery",
        "#OrderMilestoneCard": "milestone",
        "#OrderRevisionCard": "revision",
        "#ListingCard": "listing",
        "#OrderCard": "order",
        "#BookingCard": "booking",
        "#BidCard": "bid",
        "#DisputeCard": "dispute",
        "#ReviewCard": "review",
        "#ListingFlagCard": "listingFlag",
    },
};

export default marketplaceWidgetContribution;
