import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";

const {http, buyer} = vi.hoisted(() => ({
    http: {loading: false, calls: [] as {url: string; body: Record<string, unknown>; count: number}[]},
    buyer: {timeZone: "Europe/Zurich"},
}));

const LABELS: Record<string, string> = {
    "availability.zone": "in {zone}",
    "availability.converted": "yours {zone}, provider {providerZone}",
};

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => (props: Record<string, unknown>) => (
        <Wrapped {...props} languageCode="en-US" resolveLanguageKey={(key: string) => LABELS[key] ?? key} resolveLanguageValue={() => null}/>
    ),
}));
vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => Wrapped,
}));
vi.mock("react-redux", () => ({useSelector: () => buyer.timeZone}));
vi.mock("@coreModule/helpers/hooks/useHttpRequest.ts", () => ({
    default: (request: {url: string}, body: Record<string, unknown>, count: number) => {
        http.calls.push({url: request.url, body, count});
        return {loading: http.loading, error: null, data: null};
    },
}));
// The picker's popover is not under test: a text box emitting the ISO instant the real picker would
vi.mock("@coreModule/components/custom/inputs/dateInput.tsx", async () => {
    const {Input} = await import("@coreModule/components/ui/input.tsx");
    return {
        DateInput: ({value, onChange, placeholder, disabled}: {value: string; onChange: (value: string) => void; placeholder: string; disabled?: boolean}) =>
            <Input aria-label={placeholder} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}/>,
    };
});

import ServiceOrderBookingForm from "../serviceOrderBookingForm.tsx";

const ORDER_ID = "6a1f0c2b9d3e4f5a6b7c8d9e";
const START = "2026-12-01T08:00:00.000Z";
const END = "2026-12-01T09:00:00.000Z";

function renderForm(availability?: {timeZone: string; windows: {dayOfWeek: number; startTime: string; endTime: string}[]}) {
    render(<ServiceOrderBookingForm orderId={ORDER_ID} availability={availability} onBooked={vi.fn()} onCancel={vi.fn()}/>);
    return {
        start: screen.getByLabelText("form.startAtPlaceholder"),
        end: screen.getByLabelText("form.endAtPlaceholder"),
        submit: screen.getByRole("button", {name: http.loading ? "working" : "submit"}),
    };
}

const sent = () => http.calls.filter((call) => call.count > 0);
const rows = () => Array.from(screen.getByRole("region", {name: "availability.title"}).querySelectorAll("li"), (row) => row.textContent);

describe("service order booking form (TD-B94)", () => {
    beforeEach(() => {
        http.loading = false;
        http.calls = [];
        buyer.timeZone = "Europe/Zurich";
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("keeps submit disabled until both times are picked", () => {
        const {start, submit} = renderForm();
        expect(submit).toBeDisabled();

        fireEvent.change(start, {target: {value: START}});
        expect(submit).toBeDisabled();
    });

    it("books the order with the picked slot and the buyer's timezone", async () => {
        const {start, end, submit} = renderForm();
        fireEvent.change(start, {target: {value: START}});
        fireEvent.change(end, {target: {value: END}});
        expect(submit).toBeEnabled();

        fireEvent.click(submit);

        await waitFor(() => expect(sent()).toHaveLength(1));
        expect(sent()[0]).toEqual({
            url: "/api/marketplace/booking/createMine",
            body: {order: ORDER_ID, startAt: START, endAt: END, timezone: "Europe/Zurich"},
            count: 1,
        });
    });

    it("sends nothing when the slot ends before it starts", async () => {
        const {start, end, submit} = renderForm();
        fireEvent.change(start, {target: {value: END}});
        fireEvent.change(end, {target: {value: START}});

        fireEvent.click(submit);

        expect(await screen.findByRole("alert")).toBeInTheDocument();
        expect(sent()).toHaveLength(0);
    });

    // D105: the session must fit the provider's windows, which are in the provider's zone, not the buyer's.
    it("lists the provider's windows, Monday first, labelled with the zone they share with the buyer", () => {
        renderForm({timeZone: "Europe/Zurich", windows: [
            {dayOfWeek: 0, startTime: "10:00", endTime: "12:00"},
            {dayOfWeek: 1, startTime: "14:00", endTime: "18:00"},
            {dayOfWeek: 1, startTime: "09:00", endTime: "12:00"},
        ]});

        const hours = screen.getByRole("region", {name: "availability.title"});
        expect(hours).toHaveTextContent("in Europe/Zurich");
        expect(rows()).toEqual([
            "weekday.109:00 – 12:00",
            "weekday.114:00 – 18:00",
            "weekday.010:00 – 12:00",
        ]);
    });

    // TD-F43: the pickers run on the buyer's clock, so the windows are shown on it, the provider's own in brackets.
    it("shows a UTC provider's windows on a Berlin buyer's clock, by the offset of the next such day", () => {
        vi.useFakeTimers({toFake: ["Date"]});
        vi.setSystemTime(new Date("2026-12-01T12:00:00Z")); // a Tuesday, Berlin on UTC+1
        buyer.timeZone = "Europe/Berlin";
        renderForm({timeZone: "UTC", windows: [
            {dayOfWeek: 1, startTime: "09:00", endTime: "12:00"},
            {dayOfWeek: 0, startTime: "23:30", endTime: "24:00"},
            {dayOfWeek: 1, startTime: "18:00", endTime: "24:00"},
        ]});

        expect(screen.getByRole("region", {name: "availability.title"})).toHaveTextContent("yours Europe/Berlin, provider UTC");
        expect(rows()).toEqual([
            "weekday.100:30 – 01:00(weekday.0 23:30 – 24:00)",
            "weekday.110:00 – 13:00(09:00 – 12:00)",
            "weekday.119:00 – weekday.2 01:00(18:00 – 24:00)",
        ]);
    });

    it("uses the summer offset when the next such day is in summer", () => {
        vi.useFakeTimers({toFake: ["Date"]});
        vi.setSystemTime(new Date("2026-07-01T12:00:00Z")); // Berlin on UTC+2
        buyer.timeZone = "Europe/Berlin";
        renderForm({timeZone: "UTC", windows: [{dayOfWeek: 1, startTime: "09:00", endTime: "12:00"}]});

        expect(rows()).toEqual(["weekday.111:00 – 14:00(09:00 – 12:00)"]);
    });

    it("leaves out the brackets where another zone name reads the same", () => {
        buyer.timeZone = "Europe/Berlin";
        renderForm({timeZone: "Europe/Zurich", windows: [{dayOfWeek: 1, startTime: "09:00", endTime: "24:00"}]});

        expect(rows()).toEqual(["weekday.109:00 – 24:00"]);
    });

    it("shows no windows when the provider can be booked any time", () => {
        renderForm({timeZone: "Europe/Zurich", windows: []});

        expect(screen.queryByRole("region", {name: "availability.title"})).not.toBeInTheDocument();
    });

    it("disables the inputs and both buttons while the booking is sent", () => {
        http.loading = true;
        const {start, submit} = renderForm();

        expect(start).toBeDisabled();
        expect(submit).toBeDisabled();
        expect(screen.getByRole("button", {name: "back"})).toBeDisabled();
    });
});
