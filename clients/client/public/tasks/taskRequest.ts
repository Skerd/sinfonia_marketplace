import type {HttpRequest} from "@coreModule/helpers/types/httpRequest.types.ts";

/** A task page's read (`?id=…`); the tasks section asks it ahead for a hovered task link. */
export const TASK_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/shopTask", cache: true};
