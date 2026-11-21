import type {HttpRequest} from "@coreModule/helpers/types/httpRequest.types.ts";

/** A service page's read (`?id=…`); the services section asks it ahead for a hovered service link. */
export const LISTING_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/shopListing", cache: true};
