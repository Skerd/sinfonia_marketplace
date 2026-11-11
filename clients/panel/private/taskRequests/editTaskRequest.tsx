import {createGenericEditPage} from "@coreModule/components/entityPage/pages/createGenericEditPage.tsx";
import {editTaskRequestFormSchema} from "armonia/src/modules/marketplace/api/marketplace/private/taskRequest/editTaskRequest.form.validator.ts";
import type {TaskRequest} from "armonia/src/modules/marketplace/api/marketplace/private/taskRequest/taskRequest.dto.ts";
import type {EditTaskRequestFormType} from "armonia/src/modules/marketplace/api/marketplace/private/taskRequest/taskRequest.schema-def.ts";

export default createGenericEditPage<TaskRequest, EditTaskRequestFormType>({
    languagePath: "src/modules/marketplace/clients/panel/private/taskRequests/editTaskRequest.tsx",
    collectionName: "taskrequests",
    accessModel: "taskRequests",
    apiUrl: "/api/marketplace/taskRequest",
    schema: editTaskRequestFormSchema,
    buildInitialValues: (data, writeFields): EditTaskRequestFormType => {
        const addrWrite = writeFields.address as {keys?: Record<string, boolean>} | boolean | undefined;
        const addrKeys =
            addrWrite && typeof addrWrite === "object" && "keys" in addrWrite ? addrWrite.keys : undefined;

        return {
            _id: data._id,
            title: writeFields.title ? data.title : undefined,
            description: writeFields.description ? data.description : undefined,
            category: writeFields.category ? data.category?._id : undefined,
            budgetMin: writeFields.budgetMin ? data.budgetMin : undefined,
            budgetMax: writeFields.budgetMax ? data.budgetMax : undefined,
            currency: writeFields.currency ? data.currency?._id : undefined,
            address: addrKeys
                ? {
                      street: addrKeys.street ? data.address?.street ?? "" : undefined,
                      postalCode: addrKeys.postalCode ? data.address?.postalCode ?? "" : undefined,
                      country: addrKeys.country ? data.address?.country?._id : undefined,
                      state: addrKeys.state ? data.address?.state?._id : undefined,
                      city: addrKeys.city ? data.address?.city?._id : undefined,
                      latitude: addrKeys.latitude ? data.address?.latitude : undefined,
                      longitude: addrKeys.longitude ? data.address?.longitude : undefined,
                  }
                : undefined,
            mainImage: writeFields.mainImage ? data.mainImage?._id : undefined,
            imageGallery: writeFields.imageGallery ? data.imageGallery?.map((m) => m._id) ?? [] : undefined,
            videoGallery: writeFields.videoGallery ? data.videoGallery?.map((m) => m._id) ?? [] : undefined,
        } as EditTaskRequestFormType;
    },
    buildFormExtras: (_entityId, _params, entity) => ({
        enableLocalFileMultipart: true,
        editMediaExistingList: entity?.imageGallery ?? [],
        editVideoExistingList: entity?.videoGallery ?? [],
        taskRequestId: entity?._id ?? "",
    }),
    mapSubmitPayload: (data, {writeFields}) => {

        const wf = writeFields as Record<string, boolean | undefined>;
        const postBody: Record<string, unknown> = {_id: data._id};

        if (wf.title) postBody.title = data.title;
        if (wf.description) postBody.description = data.description ?? "";
        if (wf.category && data.category !== undefined) postBody.category = data.category;
        if (wf.budgetMin) postBody.budgetMin = data.budgetMin;
        if (wf.budgetMax) postBody.budgetMax = data.budgetMax;
        if (wf.currency && data.currency !== undefined) postBody.currency = data.currency;
        if (wf.address && data.address) postBody.address = data.address;

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

        return postBody as EditTaskRequestFormType;
    },
});
