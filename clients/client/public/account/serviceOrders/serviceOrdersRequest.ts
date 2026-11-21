import type {HttpRequest} from "@coreModule/helpers/types/httpRequest.types.ts";
import {orderStatuses} from "armonia/src/modules/marketplace/api/marketplace/private/order/order.schema-def.ts";

export const SERVICE_ORDERS_PAGE_SIZE = 10;

/** The buyer's service orders, a page at a time; the services section asks it ahead for a hovered link. */
export const SERVICE_ORDERS_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/order/my", cache: true};

/** The page and status an address asks for (`?page=&status=`). */
export function serviceOrdersRequestBody(params: URLSearchParams) {
    const requested = params.get("status");
    return {
        page: Math.max(1, Number(params.get("page")) || 1),
        limit: SERVICE_ORDERS_PAGE_SIZE,
        status: orderStatuses.find((value) => value === requested),
    };
}
