import {createGenericCreatePage} from "@coreModule/components/entityPage/pages/createGenericCreatePage.tsx";
import {createTaskRequestFormSchema} from "armonia/src/modules/marketplace/api/marketplace/private/taskRequest/createTaskRequest.form.validator.ts";
import type {CreateTaskRequestFormType} from "armonia/src/modules/marketplace/api/marketplace/private/taskRequest/taskRequest.schema-def.ts";

export default createGenericCreatePage<CreateTaskRequestFormType>({
    languagePath: "src/modules/marketplace/clients/panel/private/taskRequests/createTaskRequest.tsx",
    collectionName: "taskrequests",
    accessModel: "taskRequests",
    apiUrl: "/api/marketplace/taskRequest",
    schema: createTaskRequestFormSchema,
    defaultValues: {},
    buildFormExtras: () => ({enableLocalFileMultipart: true}),
    successPath: "/marketplace/taskrequests",
    mapSubmitPayload: (data) => {
        const postBody: Record<string, unknown> = {
            title: data.title,
            description: data.description ?? "",
            category: data.category,
            budgetMax: data.budgetMax,
            currency: data.currency,
            // A remote job may come without one (D143); the server asks for it on on-site work.
            address: data.address ? {
                street: data.address.street,
                postalCode: data.address.postalCode,
                country: data.address.country,
                ...(data.address.state ? {state: data.address.state} : {}),
                city: data.address.city,
                latitude: data.address.latitude,
                longitude: data.address.longitude,
            } : undefined,
        };
        const formData = new FormData();
        if (data.mainImage instanceof File) {
            formData.append("mainImage", data.mainImage);
        }
        (data.imageGallery ?? []).filter((f): f is File => f instanceof File).forEach((f) => formData.append("imageGallery", f));
        (data.videoGallery ?? []).filter((f): f is File => f instanceof File).forEach((f) => formData.append("videoGallery", f));
        formData.append("data", JSON.stringify(postBody));
        return formData;
    }
});
