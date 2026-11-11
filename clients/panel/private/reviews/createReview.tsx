import {IconPlus} from "@tabler/icons-react";
import {createGenericCreatePage} from "@coreModule/components/entityPage/pages/createGenericCreatePage.tsx";
import {createReviewFormSchema} from "armonia/src/modules/marketplace/api/marketplace/private/review/createReview.form.validator.ts";
import type {CreateReviewFormType} from "armonia/src/modules/marketplace/api/marketplace/private/review/review.schema-def.ts";

export default createGenericCreatePage<CreateReviewFormType>({
    languagePath: "src/modules/marketplace/clients/panel/private/reviews/createReview.tsx",
    collectionName: "reviews",
    accessModel: "reviews",
    apiUrl: "/api/marketplace/review",
    schema: createReviewFormSchema,
    // The reviewer picks the rating; none is preselected (UX-06).
    defaultValues: {order: "", comment: ""},
    submitIcon: <IconPlus />,
    successPath: "/marketplace/reviews",
});
