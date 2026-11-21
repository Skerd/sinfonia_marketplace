import type {HttpRequest} from "@coreModule/helpers/types/httpRequest.types.ts";

export const JOBS_PAGE_SIZE = 10;

/** The buyer's posted tasks, a page at a time; the services and tasks sections ask it ahead for a hovered link. */
export const JOBS_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/taskRequest/my", cache: true};

/** The page of tasks an address asks for (`?page=`). */
export function jobsRequestBody(params: URLSearchParams) {
    return {page: Math.max(1, Number(params.get("page")) || 1), limit: JOBS_PAGE_SIZE};
}
