import {useEffect, useRef} from "react";
import {useWebSocketRoom} from "@coreModule/helpers/hooks/useWebSocketRoom.ts";
import {registerWebSocketMessageHandler} from "@coreModule/helpers/websocket/webSocketMessages.ts";
import {
    MarketplaceWebSocketMessageCodes,
    type TaskQuoteReceivedPayload,
    type TaskUpdatedPayload,
} from "armonia/src/modules/marketplace/websocket/types.ts";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const TASK_STATUSES: readonly TaskUpdatedPayload["status"][] = ["open", "closed", "awarded"];

/** A `TASK_UPDATED` frame's payload, read field by field; null when it is not one. */
export function readTaskUpdate(payload: Record<string, unknown>): TaskUpdatedPayload | null {
    const {taskId, status, quotes} = payload;
    const known = TASK_STATUSES.find((value) => value === status);
    if (typeof taskId !== "string" || !known || !isRecord(quotes) || typeof quotes.count !== "number") return null;
    return {
        taskId,
        status: known,
        quotes: {count: quotes.count, ...(typeof quotes.average === "number" ? {average: quotes.average} : {})},
    };
}

/**
 * Live task changes (D172): holds the broadcast `room` (the board's, or one task's) while mounted and hands each
 * `TASK_UPDATED` to `onUpdate`. Signed-in sessions only: without a socket nothing arrives and the page shows what it
 * loaded.
 */
export function useTaskUpdates(room: string | null | undefined, onUpdate: (update: TaskUpdatedPayload) => void): void {
    useWebSocketRoom(room);
    const latest = useRef(onUpdate);
    latest.current = onUpdate;
    useEffect(() => registerWebSocketMessageHandler(MarketplaceWebSocketMessageCodes.TASK_UPDATED, (payload) => {
        const update = readTaskUpdate(payload);
        if (update) latest.current(update);
    }), []);
}

/** The buyer's own task page: `onQuote` runs when a quote reaches one of their tasks (D172). */
export function useQuoteReceived(onQuote: (received: TaskQuoteReceivedPayload) => void): void {
    const latest = useRef(onQuote);
    latest.current = onQuote;
    useEffect(() => registerWebSocketMessageHandler(MarketplaceWebSocketMessageCodes.TASK_QUOTE_RECEIVED, (payload) => {
        if (typeof payload.taskId === "string") latest.current({taskId: payload.taskId});
    }), []);
}
