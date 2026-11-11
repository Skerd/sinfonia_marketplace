import { IconPlus } from "@tabler/icons-react";
import { createGenericCreatePage } from "@coreModule/components/entityPage/pages/createGenericCreatePage.tsx";
import { createBookingFormSchema } from "armonia/src/modules/marketplace/api/marketplace/private/booking/createBooking.form.validator.ts";
import type { CreateBookingFormType } from "armonia/src/modules/marketplace/api/marketplace/private/booking/booking.schema-def.ts";

export default createGenericCreatePage<CreateBookingFormType>({
    languagePath: "src/modules/marketplace/clients/panel/private/bookings/createBooking.tsx",
    collectionName: "bookings",
    accessModel: "bookings",
    apiUrl: "/api/marketplace/booking",
    schema: createBookingFormSchema,
    defaultValues: { order: "", startAt: "", endAt: "" },
    submitIcon: <IconPlus />,
});
