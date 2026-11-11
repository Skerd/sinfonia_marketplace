import {IconDeviceFloppy} from "@tabler/icons-react";
import { createGenericEditPage } from "@coreModule/components/entityPage/pages/createGenericEditPage.tsx";
import { editProviderProfileFormSchema } from "armonia/src/modules/marketplace/api/marketplace/private/providerProfile/editProviderProfile.form.validator.ts";
import type { ProviderProfile } from "armonia/src/modules/marketplace/api/marketplace/private/providerProfile/providerProfile.dto.ts";
import type { EditProviderProfileFormType } from "armonia/src/modules/marketplace/api/marketplace/private/providerProfile/providerProfile.schema-def.ts";

type AvailabilitySlot = NonNullable<EditProviderProfileFormType["availability"]>[number];

/**
 * The edit form's values. A slot's `dayOfWeek` is held as a string while editing, because the
 * #SimpleSelect options are "0"…"6"; the schema turns it back into a number on submit.
 */
export type ProviderProfileFormValues = Omit<EditProviderProfileFormType, "availability"> & {
    availability?: (Omit<AvailabilitySlot, "dayOfWeek" | "_id"> & {dayOfWeek: string})[];
};

/** Form values for a profile, limited to the fields the caller may write. Shared with the account sections. */
export function providerProfileInitialValues(
    data: ProviderProfile,
    writeFields: Record<string, unknown>,
): Partial<ProviderProfileFormValues> {
    return {
        _id: data._id,
        skills: writeFields.skills ? (data.skills ?? []) : undefined,
        bio: writeFields.bio ? (data.bio ?? "") : undefined,
        timezone: writeFields.timezone ? (data.timezone ?? "") : undefined,
        portfolio: writeFields.portfolio ? (data.portfolio?.map((m) => m._id) ?? []) : undefined,
        availability: writeFields.availability
            ? (data.availability ?? []).map((slot) => ({
                  dayOfWeek: String(slot.dayOfWeek),
                  startTime: slot.startTime,
                  endTime: slot.endTime,
              }))
            : undefined,
    };
}

export default createGenericEditPage<ProviderProfile, ProviderProfileFormValues>({
    languagePath: "src/modules/marketplace/clients/panel/private/providerProfile/editProviderProfile.tsx",
    collectionName: "providerprofiles",
    accessModel: "providerProfiles",
    apiUrl: "/api/marketplace/providerProfile",
    schema: editProviderProfileFormSchema,
    buildInitialValues: providerProfileInitialValues,
    submitIcon: <IconDeviceFloppy />,
});
