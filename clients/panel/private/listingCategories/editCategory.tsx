import {IconDeviceFloppy} from "@tabler/icons-react";
import {createGenericEditPage} from "@coreModule/components/entityPage/pages/createGenericEditPage.tsx";
import type {EditListingCategoryFormType} from "armonia/src/modules/marketplace/api/marketplace/private/listingCategory/listingCategory.schema-def.ts";
import type {ListingCategory} from "armonia/src/modules/marketplace/api/marketplace/private/listingCategory/listingCategory.dto.ts";
import {editListingCategoryFormSchema} from "armonia/src/modules/marketplace/api/marketplace/private/listingCategory/editListingCategory.form.validator.ts";

/** The form values, plus `null` for a cleared parent: the API reads it as "make this a top-level category". */
type EditCategoryPayload = Omit<EditListingCategoryFormType, "parentListingCategory"> & {parentListingCategory?: string | null};

export default createGenericEditPage<ListingCategory, EditCategoryPayload>({
    languagePath: "src/modules/marketplace/clients/panel/private/listingCategories/editCategory.tsx",
    collectionName: "listingcategories",
    apiUrl: "/api/marketplace/listingCategory",
    schema: editListingCategoryFormSchema,
    buildInitialValues: (category, writeFields) => ({
        _id: category._id,
        name: writeFields.name ? category.name : undefined,
        delivery: writeFields.delivery ? category.delivery : undefined,
        parentListingCategory: writeFields.parentListingCategory ? category.parentListingCategory?._id : undefined,
        order: writeFields.order ? category.order : undefined,
    }),
    // Sends only writable fields; a cleared parent ("") moves the category to the top level.
    mapSubmitPayload: (data, {writeFields}) => ({
        _id: data._id,
        ...(writeFields.name ? {name: data.name} : {}),
        ...(writeFields.delivery ? {delivery: data.delivery} : {}),
        ...(writeFields.parentListingCategory && data.parentListingCategory !== undefined
            ? {parentListingCategory: data.parentListingCategory === "" ? null : data.parentListingCategory}
            : {}),
        ...(writeFields.order ? {order: data.order} : {}),
    }),
    // The parent picker leaves the edited category out.
    buildFormExtras: (categoryId) => ({categoryId}),
    submitIcon: <IconDeviceFloppy className="h-4 w-4" />,
});
