import {createGenericEditPage} from "@coreModule/components/entityPage/pages/createGenericEditPage.tsx";
import {editListingFormSchema} from "armonia/src/modules/marketplace/api/marketplace/private/listing/editListing.form.validator.ts";
import type {Listing} from "armonia/src/modules/marketplace/api/marketplace/private/listing/listing.dto.ts";
import type {EditListingFormType, ListingPricingType} from "armonia/src/modules/marketplace/api/marketplace/private/listing/listing.schema-def.ts";

function nonEmptyListingFaqs(rows: {question?: string; answer?: string}[] | undefined,): {question: string; answer: string}[] | undefined {
    if (!rows?.length) return undefined;
    const kept = rows.filter((r) => (r.question?.trim() ?? "").length > 0 || (r.answer?.trim() ?? "").length > 0);
    if (!kept.length) return undefined;
    return kept.map((r) => ({question: (r.question ?? "").trim(), answer: (r.answer ?? "").trim(),}));
}

export default createGenericEditPage<Listing, EditListingFormType>({
    languagePath: "src/modules/marketplace/clients/panel/private/listings/editListing.tsx",
    collectionName: "listings",
    accessModel: "listings",
    apiUrl: "/api/marketplace/listing",
    schema: editListingFormSchema,
    buildInitialValues: (data, writeFields): EditListingFormType => {
        const addrWrite = writeFields.address as {keys?: Record<string, boolean>} | boolean | undefined;
        const addrKeys = addrWrite && typeof addrWrite === "object" && "keys" in addrWrite ? addrWrite.keys : undefined;
        return {
            _id: data._id,
            title: writeFields.title ? data.title : undefined,
            description: writeFields.description ? data.description : undefined,
            category: writeFields.category ? data.category?._id : undefined,
            provider: writeFields.provider ? data.provider?._id : undefined,
            price: writeFields.price ? data.price : undefined,
            priceCurrency: writeFields.priceCurrency ? data.priceCurrency?._id : undefined,
            pricingType: writeFields.pricingType ? data.pricingType : undefined,
            deliveryDays: writeFields.deliveryDays ? data.deliveryDays : undefined,
            address: {
                country: addrKeys?.country ? data.address?.country?._id : undefined,
                state: addrKeys?.state ? data.address?.state?._id : undefined,
                city: addrKeys?.city ? data.address?.city?._id : undefined,
            },
            mainImage: writeFields.mainImage ? data.mainImage?._id : undefined,
            imageGallery: writeFields.imageGallery ? data.imageGallery?.map((m) => m._id) ?? [] : undefined,
            videoGallery: writeFields.videoGallery ? data.videoGallery?.map((m) => m._id) ?? [] : undefined,
            faqs: writeFields.faqs ? data.faqs ?? [] : undefined,
            requirements: writeFields.requirements ? data.requirements : undefined,
            tags: writeFields.tags ? data.tags ?? [] : undefined,
        // Cast: InferEditForm puts `_id` on embedded array items (faqs); the DTO rows carry none.
        } as EditListingFormType;
    },
    buildFormExtras: (_entityId, _params, entity) => ({
        enableLocalFileMultipart: true,
        editMediaExistingList: entity?.imageGallery ?? [],
        editVideoExistingList: entity?.videoGallery ?? [],
    }),
    mapSubmitPayload: (data, {writeFields}) => {
        const wf = writeFields as Record<string, boolean | undefined>;
        const postBody: Record<string, unknown> = {_id: data._id};

        if (wf.title) postBody.title = data.title;
        if (wf.provider && data.provider) postBody.provider = data.provider;
        if (wf.description) postBody.description = data.description ?? "";
        if (wf.category && data.category !== undefined) postBody.category = data.category;
        if (wf.price) postBody.price = data.price;
        if (wf.priceCurrency && data.priceCurrency !== undefined) postBody.priceCurrency = data.priceCurrency;
        if (wf.pricingType) postBody.pricingType = data.pricingType as ListingPricingType | undefined;
        if (wf.deliveryDays) postBody.deliveryDays = data.deliveryDays;
        if (wf.address && data.address) postBody.address = data.address;
        if (wf.faqs && data.faqs !== undefined) {
            postBody.faqs = nonEmptyListingFaqs(data.faqs as {question?: string; answer?: string}[]) ?? [];
        }
        if (wf.requirements) postBody.requirements = data.requirements as string[];
        if (wf.tags) postBody.tags = data.tags;

        const mainImageId = data.mainImage instanceof File ? undefined : (data.mainImage as string || null);
        const imageGalleryIds = (data.imageGallery ?? []).filter((x): x is string => typeof x === "string" && x.length > 0);
        const videoGalleryIds = (data.videoGallery ?? []).filter((x): x is string => typeof x === "string" && x.length > 0);

        if (wf.mainImage) postBody.mainImage = mainImageId;
        if (wf.imageGallery) postBody.imageGallery = imageGalleryIds;
        if (wf.videoGallery) postBody.videoGallery = videoGalleryIds;

        const mainIsFile = data.mainImage instanceof File;
        const galleryHasFile = (data.imageGallery ?? []).some((f) => f instanceof File);
        const videoHasFile = (data.videoGallery ?? []).some((f) => f instanceof File);

        if (mainIsFile || galleryHasFile || videoHasFile) {
            const formData = new FormData();
            if (mainIsFile) formData.append("mainImage", data.mainImage as File);
            (data.imageGallery ?? []).filter((f): f is File => f instanceof File).forEach((f) => formData.append("imageGallery", f));
            (data.videoGallery ?? []).filter((f): f is File => f instanceof File).forEach((f) => formData.append("videoGallery", f));
            formData.append("data", JSON.stringify(postBody));
            return formData;
        }

        return postBody as EditListingFormType;
    }
});
