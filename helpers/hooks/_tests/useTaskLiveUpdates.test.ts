import {describe, expect, it} from "vitest";
import {readTaskUpdate} from "../useTaskLiveUpdates.ts";

describe("a live task update's payload (D172)", () => {
    it("reads the task, its status and the public quote numbers", () => {
        expect(readTaskUpdate({taskId: "t1", status: "open", quotes: {count: 3, average: 61.85}}))
            .toEqual({taskId: "t1", status: "open", quotes: {count: 3, average: 61.85}});
        expect(readTaskUpdate({taskId: "t1", status: "awarded", quotes: {count: 2}})).toEqual({taskId: "t1", status: "awarded", quotes: {count: 2}});
    });

    it("ignores a frame that is not one, and anything it should not carry", () => {
        expect(readTaskUpdate({status: "open", quotes: {count: 1}})).toBeNull();
        expect(readTaskUpdate({taskId: "t1", status: "deleted", quotes: {count: 1}})).toBeNull();
        expect(readTaskUpdate({taskId: "t1", status: "open", quotes: "3"})).toBeNull();
        expect(readTaskUpdate({taskId: "t1", status: "open", quotes: {count: 1, amounts: [40]}})).toEqual({taskId: "t1", status: "open", quotes: {count: 1}});
    });
});
