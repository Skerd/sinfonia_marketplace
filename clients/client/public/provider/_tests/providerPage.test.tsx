import {render, screen} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";
import {MemoryRouter} from "react-router-dom";
import type {ShopProviderProfile} from "armonia/src/modules/marketplace/api/marketplace/public/shopMarketplace/shopMarketplace.types.ts";

const {http} = vi.hoisted(() => ({http: {provider: undefined as unknown}}));

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => (props: Record<string, unknown>) => (
        <Wrapped {...props} languageCode="en-US" resolveLanguageKey={(key: string) => (key === "availabilityTimeZone" ? "Times in {zone}" : key)}/>
    ),
}));
vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => Wrapped,
}));
vi.mock("@coreModule/helpers/hooks/useHttpRequest.ts", () => ({
    default: () => ({loading: false, error: null, data: {data: {provider: http.provider, listings: []}}}),
}));
vi.mock("@coreModule/clients/portal/shared/sectionBase.tsx", () => ({useSectionBase: () => ""}));
vi.mock("@marketplaceModule/clients/client/public/shared/shopListingCard.tsx", () => ({default: () => null}));
vi.mock("@marketplaceModule/clients/client/public/shared/shopMarketplaceReviews.tsx", () => ({default: () => null}));

import ProviderPage from "../index.tsx";

const PROVIDER: ShopProviderProfile = {
    _id: "6a1f0c2b9d3e4f5a6b7c8d9e",
    name: "Pat Painter",
    availability: [{dayOfWeek: 1, startTime: "09:00", endTime: "17:00"}],
    availabilityTimeZone: "Europe/Berlin",
};

function renderPage() {
    render(
        <MemoryRouter initialEntries={[`/provider?id=${PROVIDER._id}`]}>
            <ProviderPage/>
        </MemoryRouter>,
    );
}

describe("shop provider page availability (TD-F41)", () => {
    beforeEach(() => {
        http.provider = PROVIDER;
    });

    it("names the time zone the provider's windows are in", () => {
        renderPage();

        expect(screen.getByText("09:00–17:00")).toBeInTheDocument();
        expect(screen.getByText("Times in Europe/Berlin")).toBeInTheDocument();
    });

    it("shows no zone line when the provider lists no windows", () => {
        http.provider = {_id: PROVIDER._id, name: PROVIDER.name};
        renderPage();

        expect(screen.queryByText(/Times in/)).not.toBeInTheDocument();
        expect(screen.queryByText("availability")).not.toBeInTheDocument();
    });
});
