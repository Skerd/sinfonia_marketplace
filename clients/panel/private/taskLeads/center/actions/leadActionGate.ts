import type {TaskLead} from "armonia/src/modules/marketplace/api/marketplace/private/taskLead/taskLead.dto.ts";

/** A lead takes a quote or a decline while new or viewed, from its provider or a full-access user (D143). */
export function leadIsOpenFor(lead: TaskLead, currentUserId: string | undefined, write: unknown): boolean {
    const open = lead.status === "new" || lead.status === "viewed";
    return open && (lead.provider?._id === currentUserId || write === true);
}
