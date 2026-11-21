import {describe, expect, it} from "vitest";
import type {TaskBoardTask} from "armonia/src/modules/marketplace/api/marketplace/private/taskBoard/taskBoard.types.ts";
import {boardTaskTakesQuote} from "../center/actions/taskBoardGate.ts";

const task = (fields: Partial<TaskBoardTask> = {}): TaskBoardTask => ({
    _id: "t1", name: "TASK-1", title: "Leaking tap", status: "open", quotes: {count: 0}, ...fields,
});

describe("quoting on a task of the board (D172)", () => {
    it("is offered on an open task without a lead, or with a lead not yet answered", () => {
        expect(boardTaskTakesQuote(task(), true)).toBe(true);
        expect(boardTaskTakesQuote(task({myLead: {_id: "l1", status: "new"}}), true)).toBe(true);
        expect(boardTaskTakesQuote(task({myLead: {_id: "l1", status: "viewed"}}), true)).toBe(true);
    });

    it("is not offered without the permission, on a closed or awarded task, or once the lead is answered", () => {
        expect(boardTaskTakesQuote(task(), false)).toBe(false);
        expect(boardTaskTakesQuote(task({status: "closed"}), true)).toBe(false);
        expect(boardTaskTakesQuote(task({status: "awarded"}), true)).toBe(false);
        for (const status of ["quoted", "declined", "won", "lost", "expired"] as const) {
            expect(boardTaskTakesQuote(task({myLead: {_id: "l1", status}}), true)).toBe(false);
        }
    });
});
