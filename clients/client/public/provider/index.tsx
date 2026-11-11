import {useEffect, useState} from "react";
import {Link, useSearchParams} from "react-router-dom";
import {compose} from "redux";
import {IconCalendarTime, IconChevronRight, IconStar} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {formatDate} from "@coreModule/helpers/general/dateTime.ts";
import {resolvePublicMediaUrl} from "@coreModule/clients/portal/shared/portalMedia.ts";
import ShopListingCard from "@marketplaceModule/clients/client/public/shared/shopListingCard.tsx";
import ShopMarketplaceReviews from "@marketplaceModule/clients/client/public/shared/shopMarketplaceReviews.tsx";
import {ShopAvailability, ShopProviderAvatar} from "@marketplaceModule/clients/client/public/shared/shopMarketplace.tsx";
import type {ShopProviderResponse} from "armonia/src/modules/marketplace/api/marketplace/public/shopMarketplace/shopMarketplace.types.ts";
import {useSectionBase} from "@coreModule/clients/portal/shared/sectionBase.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";

const PROVIDER_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/shopProvider"};
const LANGUAGE_PATH = "src/modules/marketplace/clients/client/public/provider/index.tsx";

function ProviderPage({resolveLanguageKey, languageCode}: WithLanguageType) {
    const base = useSectionBase();
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id") ?? "";
    const [providerCount, setProviderCount] = useState(0);
    useEffect(() => {
        if (id) setProviderCount((count) => count + 1);
    }, [id]);
    const providerRequest = useHttpRequest<ShopProviderResponse>(PROVIDER_REQUEST, {id}, providerCount);
    const data: ShopProviderResponse["data"] | null = providerRequest.error ? null : providerRequest.data?.data ?? null;
    // Waits for an id, as before the first request.
    const loading = providerRequest.loading || providerCount === 0;

    if (id && loading) {
        return (
            <div className="flex flex-col gap-8" aria-busy="true" aria-label={resolveLanguageKey("loading")}>
                <div className="h-56 animate-pulse rounded-3xl bg-muted" />
                <div className="grid gap-6 sm:grid-cols-3">
                    {Array.from({length: 3}, (_, i) => <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />)}
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
                <h1 className="font-display text-3xl font-semibold">{resolveLanguageKey("notFound")}</h1>
                <p className="text-muted-foreground">{resolveLanguageKey("notFoundMessage")}</p>
                <Button asChild variant="link" className="h-auto p-0"><Link to={`${base}/services`}>{resolveLanguageKey("backToServices")}</Link></Button>
            </div>
        );
    }

    const {provider, listings} = data;
    const portfolio = (provider.portfolio ?? []).map(resolvePublicMediaUrl).filter((url): url is string => Boolean(url));

    return (
        <div className="flex flex-col gap-14 sm:gap-20">
            <div className="flex flex-col gap-6">
                <nav aria-label={resolveLanguageKey("breadcrumb")} className="text-sm text-muted-foreground">
                    <ol className="flex flex-wrap items-center gap-1.5">
                        <li><Link to={`${base}/services`} className="hover:text-foreground">{resolveLanguageKey("services")}</Link></li>
                        <li aria-hidden><IconChevronRight className="h-3.5 w-3.5" /></li>
                        <li aria-current="page" className="text-foreground">{provider.name}</li>
                    </ol>
                </nav>

                <section className="grid gap-8 rounded-3xl bg-muted p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr]">
                    <div className="flex flex-col gap-5">
                        <div className="flex items-center gap-5">
                            <ShopProviderAvatar name={provider.name} size="lg" />
                            <div className="flex min-w-0 flex-col gap-1.5">
                                <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{provider.name}</h1>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                    {provider.reviewCount ? (
                                        <a href="#shop-reviews" className="inline-flex items-center gap-1 hover:text-foreground">
                                            <IconStar className="h-4 w-4 fill-foreground text-foreground" aria-hidden />
                                            {resolveLanguageKey("ratingSummary")
                                                .replace("{average}", provider.averageRating?.toFixed(1) ?? "")
                                                .replace("{count}", String(provider.reviewCount))}
                                        </a>
                                    ) : null}
                                    {provider.completionRate != null && (
                                        <span>{resolveLanguageKey("completionRate").replace("{rate}", String(provider.completionRate))}</span>
                                    )}
                                    {provider.memberSince && (
                                        <span>{resolveLanguageKey("memberSince").replace("{date}", formatDate(provider.memberSince, {format: {year: "numeric", month: "long"}}))}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {provider.bio && <p className="whitespace-pre-line text-[16px] leading-relaxed text-muted-foreground">{provider.bio}</p>}
                        {provider.skills?.length ? (
                            <ul className="flex flex-wrap gap-2" aria-label={resolveLanguageKey("skills")}>
                                {provider.skills.map(skill => (
                                    <li key={skill} className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium">{skill}</li>
                                ))}
                            </ul>
                        ) : null}
                    </div>
                    {provider.availability?.length ? (
                        <div className="flex flex-col gap-3 rounded-2xl bg-card p-5">
                            <h2 className="inline-flex items-center gap-2 text-sm font-semibold">
                                <IconCalendarTime className="h-4 w-4" aria-hidden />
                                {resolveLanguageKey("availability")}
                            </h2>
                            <ShopAvailability slots={provider.availability} languageCode={languageCode} />
                            {provider.availabilityTimeZone && (
                                <p className="text-xs text-muted-foreground">
                                    {resolveLanguageKey("availabilityTimeZone").replace("{zone}", provider.availabilityTimeZone)}
                                </p>
                            )}
                        </div>
                    ) : null}
                </section>
            </div>

            <section className="flex flex-col gap-6" aria-labelledby="shop-provider-services">
                <h2 id="shop-provider-services" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                    {resolveLanguageKey("servicesBy").replace("{name}", provider.name)}
                </h2>
                <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {listings.map(listing => (
                        <ShopListingCard key={listing._id} listing={listing} />
                    ))}
                </div>
            </section>

            {portfolio.length > 0 && (
                <section className="flex flex-col gap-6" aria-labelledby="shop-provider-portfolio">
                    <h2 id="shop-provider-portfolio" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{resolveLanguageKey("portfolio")}</h2>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {portfolio.map(url => (
                            <img key={url} src={url} alt="" loading="lazy" className="aspect-square w-full rounded-2xl bg-muted object-cover" />
                        ))}
                    </div>
                </section>
            )}

            <ShopMarketplaceReviews providerId={provider._id} average={provider.averageRating} count={provider.reviewCount} />
        </div>
    );
}

export default compose(
    withLanguage(LANGUAGE_PATH),
    withDebug(true, true),
)(ProviderPage);
