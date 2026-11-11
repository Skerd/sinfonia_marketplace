import {lazy} from "react";
import type {RouteConfigArgs, RouteConfigContribution} from "@coreModule/helpers/types/routeConfigContribution.types.ts";

// Pages load on first visit (D21); the panel shell's Suspense boundary shows the loader.
const AllListings = lazy(() => import("@marketplaceModule/clients/panel/private/listings"));
const CreateListing = lazy(() => import("@marketplaceModule/clients/panel/private/listings/createListing.tsx"));
const EditListing = lazy(() => import("@marketplaceModule/clients/panel/private/listings/editListing.tsx"));
const AllTaskRequests = lazy(() => import("@marketplaceModule/clients/panel/private/taskRequests"));
const CreateTaskRequest = lazy(() => import("@marketplaceModule/clients/panel/private/taskRequests/createTaskRequest.tsx"));
const EditTaskRequest = lazy(() => import("@marketplaceModule/clients/panel/private/taskRequests/editTaskRequest.tsx"));
const AllOrders = lazy(() => import("@marketplaceModule/clients/panel/private/orders"));
const AllBids = lazy(() => import("@marketplaceModule/clients/panel/private/bids"));
const CreateBid = lazy(() => import("@marketplaceModule/clients/panel/private/bids/createBid.tsx"));
const AllBookings = lazy(() => import("@marketplaceModule/clients/panel/private/bookings"));
const CreateBooking = lazy(() => import("@marketplaceModule/clients/panel/private/bookings/createBooking.tsx"));
const AllDisputes = lazy(() => import("@marketplaceModule/clients/panel/private/disputes"));
const CreateDispute = lazy(() => import("@marketplaceModule/clients/panel/private/disputes/createDispute.tsx"));
const AllReviews = lazy(() => import("@marketplaceModule/clients/panel/private/reviews"));
const CreateReview = lazy(() => import("@marketplaceModule/clients/panel/private/reviews/createReview.tsx"));
const AllPromotions = lazy(() => import("@marketplaceModule/clients/panel/private/promotions"));
const CreatePromotion = lazy(() => import("@marketplaceModule/clients/panel/private/promotions/createPromotion.tsx"));
const AllListingFlags = lazy(() => import("@marketplaceModule/clients/panel/private/listingFlags"));
const CreateListingFlag = lazy(() => import("@marketplaceModule/clients/panel/private/listingFlags/createListingFlag.tsx"));
const EditListingFlag = lazy(() => import("@marketplaceModule/clients/panel/private/listingFlags/editListingFlag.tsx"));
const AllProviderProfiles = lazy(() => import("@marketplaceModule/clients/panel/private/providerProfile"));
const CreateProviderProfile = lazy(() => import("@marketplaceModule/clients/panel/private/providerProfile/createProviderProfile.tsx"));
const EditProviderProfile = lazy(() => import("@marketplaceModule/clients/panel/private/providerProfile/editProviderProfile.tsx"));
const AllListingAddOns = lazy(() => import("@marketplaceModule/clients/panel/private/listingAddOns"));
const CreateListingAddOn = lazy(() => import("@marketplaceModule/clients/panel/private/listingAddOns/createListingAddOn.tsx"));
const EditListingAddOn = lazy(() => import("@marketplaceModule/clients/panel/private/listingAddOns/editListingAddOn.tsx"));
const AllListingPackages = lazy(() => import("@marketplaceModule/clients/panel/private/listingPackages"));
const CreateListingPackage = lazy(() => import("@marketplaceModule/clients/panel/private/listingPackages/createListingPackage.tsx"));
const EditListingPackage = lazy(() => import("@marketplaceModule/clients/panel/private/listingPackages/editListingPackage.tsx"));
const MarketplaceSystemMap = lazy(() => import("@marketplaceModule/clients/panel/private/marketplaceSystemMap"));
const AllListingCategories = lazy(() => import("@marketplaceModule/clients/panel/private/listingCategories"));
const CreateListingCategory = lazy(() => import("@marketplaceModule/clients/panel/private/listingCategories/createCategory.tsx"));
const EditListingCategory = lazy(() => import("@marketplaceModule/clients/panel/private/listingCategories/editCategory.tsx"));
const MarketplaceSettings = lazy(() => import("@marketplaceModule/clients/panel/private/settings/index.tsx"));

function safeDecode(value: string | null): string | undefined {
    if (value == null || value === "") return undefined;
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

const marketplaceRouteConfigContribution: RouteConfigContribution = {
    id: "marketplace",
    order: 41,
    contributeRoutes({
        menu,
        subview,
        segments,
        searchParams,
    }: RouteConfigArgs) {
        if (menu === "tenancy" && subview === "systemSettings") {
            const resource = segments[2];
            const action = segments[3];
            if (resource === "marketplacesettings") {
                return <MarketplaceSettings />;
            }
            if (resource === "providerprofiles") {
                const profileId = searchParams.get("profileId") || undefined;
                const profileName = safeDecode(searchParams.get("profileName")) || undefined;
                if (action === "create") return <CreateProviderProfile />;
                if (action === "edit" && profileId) return <EditProviderProfile entityId={profileId} entityName={profileName} />;
                return <AllProviderProfiles />;
            }
            if (resource === "listingcategories") {
                const categoryId = searchParams.get("categoryId") || undefined;
                const categoryName = safeDecode(searchParams.get("categoryName")) || undefined;
                if (action === "create") return <CreateListingCategory />;
                if (action === "edit" && categoryId) {
                    return <EditListingCategory entityId={categoryId} entityName={categoryName} />;
                }
                return <AllListingCategories />;
            }
            return undefined;
        }

        if (menu === "marketplace") {
            const resource = subview;
            const action = segments[2];
            const listingAddOnId = searchParams.get("listingAddOnId") || undefined;
            const listingPackageId = searchParams.get("listingPackageId") || undefined;
            const listingId = searchParams.get("listingId") || undefined;
            const listingTitle = safeDecode(searchParams.get("listingTitle")) || undefined;
            const taskRequestId = searchParams.get("taskRequestId") || undefined;
            const taskRequestTitle = safeDecode(searchParams.get("taskRequestTitle")) || undefined;
            const listingFlagId = searchParams.get("listingFlagId") || undefined;

            if (resource === "marketplacesystemmap") {
                return <MarketplaceSystemMap />;
            }
            if (resource === "listingcategories") {
                const categoryId = searchParams.get("categoryId") || undefined;
                const categoryName = safeDecode(searchParams.get("categoryName")) || undefined;
                if (action === "create") return <CreateListingCategory />;
                if (action === "edit" && categoryId) {
                    return <EditListingCategory entityId={categoryId} entityName={categoryName} />;
                }
                return <AllListingCategories />;
            }
            if (resource === "listings") {
                if (action === "create") return <CreateListing />;
                if (action === "edit" && listingId) {
                    return <EditListing entityId={listingId} entityName={listingTitle} />;
                }
                return <AllListings />;
            }
            if (resource === "taskrequests") {
                if (action === "create") return <CreateTaskRequest />;
                if (action === "edit" && taskRequestId) {
                    return <EditTaskRequest entityId={taskRequestId} entityName={taskRequestTitle} />;
                }
                return <AllTaskRequests />;
            }
            if (resource === "orders") {
                return <AllOrders />;
            }
            if (resource === "bids") {
                if (action === "create") return <CreateBid />;
                return <AllBids />;
            }
            if (resource === "bookings") {
                if (action === "create") return <CreateBooking />;
                return <AllBookings />;
            }
            if (resource === "disputes") {
                if (action === "create") return <CreateDispute />;
                return <AllDisputes />;
            }
            if (resource === "reviews") {
                if (action === "create") return <CreateReview />;
                return <AllReviews />;
            }
            if (resource === "promotions") {
                if (action === "create") return <CreatePromotion />;
                return <AllPromotions />;
            }
            if (resource === "listingflags") {
                if (action === "create") return <CreateListingFlag />;
                if (action === "edit" && listingFlagId) return <EditListingFlag entityId={listingFlagId} />;
                return <AllListingFlags />;
            }
            if (resource === "listingaddons") {
                if (action === "create") return <CreateListingAddOn />;
                if (action === "edit" && listingAddOnId) return <EditListingAddOn entityId={listingAddOnId} />;
                return <AllListingAddOns />;
            }
            if (resource === "listingpackages") {
                if (action === "create") return <CreateListingPackage />;
                if (action === "edit" && listingPackageId) return <EditListingPackage entityId={listingPackageId} />;
                return <AllListingPackages />;
            }
            return undefined;
        }

        return undefined;
    },
};

export default marketplaceRouteConfigContribution;
