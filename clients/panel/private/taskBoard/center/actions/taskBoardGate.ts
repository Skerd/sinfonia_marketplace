import type {TaskBoardTask} from "armonia/src/modules/marketplace/api/marketplace/private/taskBoard/taskBoard.types.ts";

/**
 * Whether the caller can still quote on a task of the board (D172): it is open, and they have no lead on it yet or a
 * lead they have not answered. The server also keeps one live quote per company.
 */
export function boardTaskTakesQuote(task: TaskBoardTask, canQuote: boolean): boolean {
    if (!canQuote || task.status !== "open") return false;
    return !task.myLead || task.myLead.status === "new" || task.myLead.status === "viewed";
}
