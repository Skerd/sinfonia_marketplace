import {createGenericCreatePage} from "@coreModule/components/entityPage/pages/createGenericCreatePage.tsx";
import {createListingFormSchema} from "armonia/src/modules/marketplace/api/marketplace/private/listing/createListing.form.validator.ts";
import type {CreateListingFormType} from "armonia/src/modules/marketplace/api/marketplace/private/listing/listing.schema-def.ts";
import {serviceAreaPayload} from "./serviceAreaPayload.ts";

function nonEmptyFaqs(rows: {question?: string; answer?: string}[] | undefined,): {question: string; answer: string}[] | undefined {
    if (!rows?.length) return undefined;
    const kept = rows.filter((r) => (r.question?.trim() ?? "").length > 0 || (r.answer?.trim() ?? "").length > 0,);
    if (!kept.length) return undefined;
    return kept.map((r) => ({question: (r.question ?? "").trim(), answer: (r.answer ?? "").trim(),}));
}

export default createGenericCreatePage<CreateListingFormType>({
    languagePath: "src/modules/marketplace/clients/panel/private/listings/createListing.tsx",
    collectionName: "listings",
    accessModel: "listings",
    apiUrl: "/api/marketplace/listing",
    schema: createListingFormSchema,
    defaultValues: {
        title: "",
        category: "",
        faqs: [],
        tags: [],
        requirements: [],
        address: {},
    },
    buildFormExtras: () => ({enableLocalFileMultipart: true}),
    successPath: "/marketplace/listings",
    mapSubmitPayload: (data) => {
        const postBody: Record<string, unknown> = {
            title: data.title,
            provider: data.provider,
            description: data.description,
            category: data.category,
            price: data.price,
            priceCurrency: data.priceCurrency,
            pricingType: data.pricingType,
            deliveryDays: data.deliveryDays,
            faqs: nonEmptyFaqs(data.faqs as {question?: string; answer?: string}[] | undefined),
            requirements: data.requirements,
            tags: data.tags,
        };

        const serviceArea = serviceAreaPayload(data.serviceArea);
        if (serviceArea) postBody.serviceArea = serviceArea;

        if (data.address && (data.address.country ?? data.address.state ?? data.address.city)) {
            postBody.address = {
                ...(data.address.country && {country: data.address.country}),
                ...(data.address.state && {state: data.address.state}),
                ...(data.address.city && {city: data.address.city}),
            };
        }

        const formData = new FormData();
        if (data.mainImage instanceof File) {formData.append("mainImage", data.mainImage);}
        (data.imageGallery ?? []).filter((f): f is File => f instanceof File).forEach((f) => formData.append("imageGallery", f));
        (data.videoGallery ?? []).filter((f): f is File => f instanceof File).forEach((f) => formData.append("videoGallery", f));
        formData.append("data", JSON.stringify(postBody));
        return formData;
    },
});
