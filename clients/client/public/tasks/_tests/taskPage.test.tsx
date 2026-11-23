import {act, render, screen} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";
import {MemoryRouter} from "react-router-dom";

const {apiClientMock, live} = vi.hoisted(() => ({
    apiClientMock: vi.fn(),
    live: {onUpdate: (_update: {taskId: string}) => undefined as void},
}));

vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: apiClientMock}));
vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => (props: Record<string, unknown>) => (
        <Wrapped {...props} languageCode="en-US" resolveLanguageKey={(key: string) => key} />
    ),
}));
vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({default: () => (Wrapped: ComponentType) => Wrapped}));
vi.mock("@coreModule/clients/portal/shared/portalSession.tsx", () => ({usePortalSession: () => ({isAuthenticated: false})}));
vi.mock("@coreModule/clients/portal/shared/portalSiteContext.tsx", () => ({usePortalSite: () => ({site: {scope: "platform", company: {name: "Arpeggio"}}, sections: []})}));
vi.mock("@coreModule/clients/portal/shared/portalSellerCard.tsx", () => ({default: () => null}));
vi.mock("@coreModule/components/viewEngine/widgets/addresses/sheetLocationMap.tsx", () => ({default: () => null}));
vi.mock("@marketplaceModule/clients/client/public/shared/servicesConfigContext.tsx", () => ({useServicesConfig: () => ({formatMoney: (amount: number) => String(amount)})}));
vi.mock("../portalQuotePanel.tsx", () => ({default: () => null}));
vi.mock("@marketplaceModule/helpers/hooks/useTaskLiveUpdates.ts", () => ({
    useTaskUpdates: (_room: string | null, onUpdate: (update: {taskId: string}) => void) => {
        live.onUpdate = onUpdate;
    },
}));

import TaskPage from "../taskPage.tsx";
import {clearResponseCache} from "@coreModule/helpers/apiClient/responseCache.ts";

const task = (count: number) => ({data: {
    _id: "t1", title: "Fix a dripping kitchen tap", description: "Under the sink.", status: "open",
    category: {name: "Plumbing", slug: "plumbing"}, quotes: {count}, quotedBy: [],
}});

describe("the public task page (D172)", () => {
    beforeEach(() => {
        clearResponseCache();
        apiClientMock.mockReset();
    });

    it("keeps the task on screen while a live quote refreshes it (TD-F144)", async () => {
        apiClientMock.mockResolvedValueOnce({data: task(1)});
        render(<MemoryRouter initialEntries={["/tasks/task?id=t1"]}><TaskPage /></MemoryRouter>);
        expect(await screen.findByRole("heading", {name: "Fix a dripping kitchen tap"})).toBeInTheDocument();
        expect(document.title).toBe("Fix a dripping kitchen tap · Arpeggio");

        let answer: (value: {data: unknown}) => void = () => undefined;
        apiClientMock.mockImplementationOnce(() => new Promise((resolve) => { answer = resolve; }));
        act(() => live.onUpdate({taskId: "t1"}));

        expect(apiClientMock).toHaveBeenCalledTimes(2);
        expect(screen.getByRole("heading", {name: "Fix a dripping kitchen tap"})).toBeInTheDocument();
        expect(screen.queryByLabelText("loading")).toBeNull();

        await act(async () => answer({data: task(2)}));
        expect(screen.getByRole("heading", {name: "Fix a dripping kitchen tap"})).toBeInTheDocument();
    });
});
