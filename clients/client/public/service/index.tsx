import {useEffect, useMemo, useState} from "react";
import {Link, useNavigate, useSearchParams} from "react-router-dom";
import {compose} from "redux";
import {IconCheck, IconChevronDown, IconChevronRight, IconClock, IconPhotoOff, IconMapPin, IconStar} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {handleError} from "@coreModule/helpers/general/errors.ts";
import {formatDate} from "@coreModule/helpers/general/dateTime.ts";
import {resolvePublicMediaUrl} from "@coreModule/clients/portal/shared/portalMedia.ts";
import {usePortalSession} from "@coreModule/clients/portal/shared/portalSession.tsx";
import ShopListingCard, {listingPriceLabel} from "@marketplaceModule/clients/client/public/shared/shopListingCard.tsx";
import ShopMarketplaceReviews from "@marketplaceModule/clients/client/public/shared/shopMarketplaceReviews.tsx";
import {
    listingLocationLabel,
    ShopAvailability,
    ShopProviderAvatar,
} from "@marketplaceModule/clients/client/public/shared/shopMarketplace.tsx";
import {useServicesConfig} from "@marketplaceModule/clients/client/public/shared/servicesConfigContext.tsx";
import PortalSellerCard from "@coreModule/clients/portal/shared/portalSellerCard.tsx";
import {PortalInlineSignIn} from "@coreModule/clients/portal/shared/portalInlineSignIn.tsx";
import {ORDER_NOTE_MAX} from "armonia/src/modules/marketplace/api/marketplace/private/order/order.schema-def.ts";
import {useSectionBase} from "@coreModule/clients/portal/shared/sectionBase.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {Textarea} from "@coreModule/components/ui/textarea.tsx";
import {Checkbox} from "@coreModule/components/ui/checkbox.tsx";
import {Item} from "@coreModule/components/ui/item.tsx";
import type {
    ShopListingDetail,
    ShopListingResponse,
} from "armonia/src/modules/marketplace/api/marketplace/public/shopMarketplace/shopMarketplace.types.ts";
import type {PortalCurrency} from "armonia/src/modules/core/api/portal/public/portal/portal.dto.ts";
import {addMoney} from "armonia/src/modules/core/helpers/money.ts";

const LANGUAGE_PATH = "src/modules/marketplace/clients/client/public/service/index.tsx";

const DAY_MS = 24 * 60 * 60 * 1000;

/** One selectable offer: the listing's own price ("" id) or one of its packages. */
type ServiceOption = {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency?: PortalCurrency;
    deliveryDays: number;
};

/** The base offer first (when the listing has a price), then its packages in their set order. */
const LISTING_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/shopListing"};
const ORDER_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/order/createFromListing"};

function serviceOptions(listing: ShopListingDetail, standardName: string): ServiceOption[] {
    const base: ServiceOption[] = listing.price != null
        ? [{id: "", name: standardName, price: listing.price, currency: listing.currency, deliveryDays: listing.deliveryDays ?? 1}]
        : [];
    return [
        ...base,
        ...listing.packages.map(pkg => ({
            id: pkg._id,
            name: pkg.name,
            description: pkg.description,
            price: pkg.price,
            currency: pkg.currency,
            deliveryDays: pkg.deliveryDays,
        })),
    ];
}

function ServicePage({resolveLanguageKey, languageCode}: WithLanguageType) {
    const base = useSectionBase();
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id") ?? "";
    const navigate = useNavigate();
    const {formatMoney} = useServicesConfig();
    const {isAuthenticated, isHydrating, user} = usePortalSession();

    const [activeImage, setActiveImage] = useState<string | undefined>(undefined);
    const [optionId, setOptionId] = useState("");
    const [addOnIds, setAddOnIds] = useState<string[]>([]);
    const [note, setNote] = useState("");

    const [listingCount, setListingCount] = useState(0);
    useEffect(() => {
        if (id) setListingCount((count) => count + 1);
    }, [id]);
    const listingRequest = useHttpRequest<ShopListingResponse>(LISTING_REQUEST, {id}, listingCount, true, {
        success: (response) => {
            const next = response.data;
            setActiveImage(next.mainImage);
            // Without a base price the first package is the default offer
            setOptionId(next.price != null ? "" : next.packages[0]?._id ?? "");
            setAddOnIds([]);
            setNote("");
        },
    });
    const listing: ShopListingDetail | null = listingRequest.loading || listingRequest.error ? null : listingRequest.data?.data ?? null;
    // Waits for an id, as before the first request.
    const loading = listingCount === 0 || listingRequest.loading;

    const [orderCall, setOrderCall] = useState<{body: Record<string, unknown>; count: number}>({body: {}, count: 0});
    const orderRequest = useHttpRequest<{message: string; _id: string}>(ORDER_REQUEST, orderCall.body, orderCall.count, true, {
        success: (response) => navigate(`${base}/account/orders/${response._id}?placed=1`),
        error: (err) => handleError(err, {context: "Service", showToast: true, fallbackMessage: resolveLanguageKey("orderError")}),
    });
    // Stays busy after success: the page navigates to the new order.
    const ordering = orderRequest.loading || (orderCall.count > 0 && !!orderRequest.data);

    const options = useMemo(
        () => (listing ? serviceOptions(listing, resolveLanguageKey("standardPackage")) : []),
        [listing, resolveLanguageKey],
    );
    const gallery = useMemo(
        () => [...new Set([listing?.mainImage, ...(listing?.gallery ?? [])].filter((value): value is string => Boolean(value)))],
        [listing],
    );

    if (!id) return <ServiceMissing resolveLanguageKey={resolveLanguageKey} />;

    if (loading) {
        return (
            <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]" aria-busy="true" aria-label={resolveLanguageKey("loading")}>
                <div className="aspect-[4/3] animate-pulse rounded-3xl bg-muted" />
                <div className="flex flex-col gap-4 pt-4">
                    <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
                    <div className="h-10 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="mt-6 h-40 w-full animate-pulse rounded-2xl bg-muted" />
                </div>
            </div>
        );
    }

    if (!listing) return <ServiceMissing resolveLanguageKey={resolveLanguageKey} />;

    const selected = options.find(option => option.id === optionId) ?? options[0];
    // The server refuses add-ons priced in another currency than the chosen offer
    const addOns = listing.addOns.filter(addOn => !addOn.currency || !selected?.currency || addOn.currency._id === selected.currency._id);
    const chosenAddOns = addOns.filter(addOn => addOnIds.includes(addOn._id));
    const total = addMoney(selected?.price ?? 0, ...chosenAddOns.map((addOn) => addOn.price));
    const totalDays = (selected?.deliveryDays ?? 0) + chosenAddOns.reduce((sum, addOn) => sum + (addOn.deliveryDays ?? 0), 0);
    const location = listingLocationLabel(listing.location);
    const isOwnListing = Boolean(user.id) && user.id === listing.provider?._id;
    const provider = listing.provider;

    function toggleAddOn(addOnId: string) {
        setAddOnIds(current => current.includes(addOnId) ? current.filter(item => item !== addOnId) : [...current, addOnId]);
    }

    function placeOrder() {
        if (!listing || !selected) return;
        setOrderCall((current) => ({
            body: {
                listing: listing._id,
                ...(selected.id && {package: selected.id}),
                addOns: chosenAddOns.map(addOn => addOn._id),
                note: note.trim() || undefined,
            },
            count: current.count + 1,
        }));
    }

    return (
        <div className="flex flex-col gap-16 sm:gap-20">
            <div className="flex flex-col gap-6">
                <nav aria-label={resolveLanguageKey("breadcrumb")} className="text-sm text-muted-foreground">
                    <ol className="flex flex-wrap items-center gap-1.5">
                        <li><Link to={base} className="hover:text-foreground">{resolveLanguageKey("home")}</Link></li>
                        <li aria-hidden><IconChevronRight className="h-3.5 w-3.5" /></li>
                        <li><Link to={`${base}/services`} className="hover:text-foreground">{resolveLanguageKey("services")}</Link></li>
                        {listing.category && (
                            <>
                                <li aria-hidden><IconChevronRight className="h-3.5 w-3.5" /></li>
                                <li><Link to={`${base}/services?category=${encodeURIComponent(listing.category.slug)}`} className="hover:text-foreground">{listing.category.name}</Link></li>
                            </>
                        )}
                        <li aria-hidden><IconChevronRight className="h-3.5 w-3.5" /></li>
                        <li aria-current="page" className="max-w-[16rem] truncate text-foreground">{listing.title}</li>
                    </ol>
                </nav>

                {/* Phones stack gallery, then the order box, then the details; desktop keeps the order box in a sticky column */}
                <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-x-14">
                    <div className="lg:col-start-1 lg:row-start-1">
                        <div className="flex flex-col gap-3">
                            <div className="aspect-[4/3] w-full overflow-hidden rounded-3xl bg-muted">
                                {activeImage ? (
                                    <img src={resolvePublicMediaUrl(activeImage)} alt={listing.title} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                                        <IconPhotoOff className="h-8 w-8" aria-hidden />
                                        <span className="text-sm">{resolveLanguageKey("noImage")}</span>
                                    </div>
                                )}
                            </div>
                            {gallery.length > 1 && (
                                <ul className="flex gap-2 overflow-x-auto">
                                    {gallery.map((image, index) => (
                                        <li key={image} className="shrink-0">
                                            <Button
                                                type="button"
                                                variant="bare"
                                                onClick={() => setActiveImage(image)}
                                                aria-label={resolveLanguageKey("imageOf").replace("{number}", String(index + 1)).replace("{total}", String(gallery.length))}
                                                aria-pressed={activeImage === image}
                                                className={cn(
                                                    "block h-16 w-24 overflow-hidden rounded-xl border-2 transition-colors",
                                                    activeImage === image ? "border-foreground" : "border-transparent hover:border-border",
                                                )}
                                            >
                                                <img src={resolvePublicMediaUrl(image)} alt="" className="h-full w-full object-cover" />
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="order-last flex flex-col gap-10 lg:order-none lg:col-start-1 lg:row-start-2">
                        {listing.description && (
                            <section className="flex flex-col gap-3" aria-labelledby="shop-service-about">
                                <h2 id="shop-service-about" className="font-display text-2xl font-semibold tracking-tight">{resolveLanguageKey("about")}</h2>
                                <p className="whitespace-pre-line text-[16px] leading-relaxed text-muted-foreground">{listing.description}</p>
                                {listing.tags?.length ? (
                                    <ul className="mt-2 flex flex-wrap gap-2">
                                        {listing.tags.map(tag => (
                                            <li key={tag} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">#{tag}</li>
                                        ))}
                                    </ul>
                                ) : null}
                            </section>
                        )}

                        {listing.requirements?.length ? (
                            <section className="flex flex-col gap-3" aria-labelledby="shop-service-needs">
                                <h2 id="shop-service-needs" className="font-display text-2xl font-semibold tracking-tight">{resolveLanguageKey("requirementsTitle")}</h2>
                                <ul className="flex flex-col gap-2">
                                    {listing.requirements.map(requirement => (
                                        <li key={requirement} className="flex gap-2.5 text-[15px] text-muted-foreground">
                                            <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                                            {requirement}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ) : null}

                        {listing.faqs?.length ? (
                            <section className="flex flex-col gap-3" aria-labelledby="shop-service-faq">
                                <h2 id="shop-service-faq" className="font-display text-2xl font-semibold tracking-tight">{resolveLanguageKey("faqTitle")}</h2>
                                <div className="divide-y divide-border border-y border-border">
                                    {listing.faqs.map(faq => (
                                        <details key={faq.question} className="group py-4">
                                            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                                                {faq.question}
                                                <IconChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
                                            </summary>
                                            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">{faq.answer}</p>
                                        </details>
                                    ))}
                                </div>
                            </section>
                        ) : null}

                        {provider && (
                            <section className="flex flex-col gap-5 rounded-3xl bg-muted p-6 sm:p-8" aria-labelledby="shop-service-provider">
                                <h2 id="shop-service-provider" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{resolveLanguageKey("aboutProvider")}</h2>
                                <div className="flex items-center gap-4">
                                    <ShopProviderAvatar name={provider.name} size="lg" />
                                    <div className="flex min-w-0 flex-col gap-1">
                                        <Link to={`${base}/provider?id=${encodeURIComponent(provider._id)}`} className="font-display text-xl font-semibold hover:underline underline-offset-4">
                                            {provider.name}
                                        </Link>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                                            {provider.reviewCount ? (
                                                <span className="inline-flex items-center gap-1">
                                                    <IconStar className="h-4 w-4 fill-foreground text-foreground" aria-hidden />
                                                    {resolveLanguageKey("ratingSummary")
                                                        .replace("{average}", provider.averageRating?.toFixed(1) ?? "")
                                                        .replace("{count}", String(provider.reviewCount))}
                                                </span>
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
                                {provider.bio && <p className="line-clamp-4 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">{provider.bio}</p>}
                                {provider.skills?.length ? (
                                    <ul className="flex flex-wrap gap-2">
                                        {provider.skills.map(skill => (
                                            <li key={skill} className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium">{skill}</li>
                                        ))}
                                    </ul>
                                ) : null}
                                {provider.availability?.length ? (
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-sm font-semibold">{resolveLanguageKey("availability")}</h3>
                                        <ShopAvailability slots={provider.availability} languageCode={languageCode} />
                                        {provider.availabilityTimeZone && (
                                            <p className="text-xs text-muted-foreground">
                                                {resolveLanguageKey("availabilityTimeZone").replace("{zone}", provider.availabilityTimeZone)}
                                            </p>
                                        )}
                                    </div>
                                ) : null}
                                <Button asChild variant="link" className="h-auto p-0 self-start text-sm"><Link to={`${base}/provider?id=${encodeURIComponent(provider._id)}`}>
                                    {resolveLanguageKey("viewProvider")}
                                </Link></Button>
                            </section>
                        )}
                    </div>

                    <div className="flex flex-col gap-7 lg:sticky lg:top-28 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
                        <div className="flex flex-col gap-3">
                            {listing.category && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{listing.category.name}</p>}
                            <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{listing.title}</h1>
                            <PortalSellerCard sectionPath="services" seller={listing.seller} kind="service" size="card" />
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                {provider && (
                                    <Link to={`${base}/provider?id=${encodeURIComponent(provider._id)}`} className="inline-flex items-center gap-2 font-medium text-foreground hover:underline underline-offset-4">
                                        <ShopProviderAvatar name={provider.name} size="sm" />
                                        {provider.name}
                                    </Link>
                                )}
                                {listing.reviewCount ? (
                                    <a href="#shop-reviews" className="inline-flex items-center gap-1.5 hover:text-foreground">
                                        <IconStar className="h-4 w-4 fill-foreground text-foreground" aria-hidden />
                                        {resolveLanguageKey("ratingSummary")
                                            .replace("{average}", listing.avgRating?.toFixed(1) ?? "")
                                            .replace("{count}", String(listing.reviewCount))}
                                    </a>
                                ) : null}
                            </div>
                            {location && (
                                <p className="flex items-center gap-2 rounded-xl bg-muted px-3.5 py-2.5 text-sm">
                                    <IconMapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                                    <span>{resolveLanguageKey("availableIn").replace("{place}", location)}</span>
                                </p>
                            )}
                        </div>

                        {options.length > 0 ? (
                            <fieldset className="flex flex-col gap-3">
                                <legend className="mb-3 text-sm font-semibold">{resolveLanguageKey("choosePackage")}</legend>
                                <div className="flex flex-col gap-2.5">
                                    {options.map(option => {
                                        const active = option.id === selected?.id;
                                        return (
                                            <Item
                                                key={option.id || "base"}
                                                asChild
                                                variant="outline"
                                                className={cn(
                                                    "cursor-pointer flex-col items-stretch gap-1.5 p-4 text-left",
                                                    active ? "border-foreground bg-foreground text-background" : "hover:bg-muted",
                                                )}
                                            >
                                                <Button type="button" variant="bare" onClick={() => setOptionId(option.id)} aria-pressed={active}>
                                                    <span className="flex items-baseline justify-between gap-3">
                                                        <span className="font-semibold">{option.name}</span>
                                                        <span className="font-display text-lg font-semibold tabular-nums">
                                                            {listingPriceLabel(resolveLanguageKey, formatMoney(option.price, option.currency), {pricingType: listing.pricingType})}
                                                        </span>
                                                    </span>
                                                    {option.description && (
                                                        <span className={cn("text-sm leading-relaxed", active ? "text-background/80" : "text-muted-foreground")}>{option.description}</span>
                                                    )}
                                                    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", active ? "text-background/80" : "text-muted-foreground")}>
                                                        <IconClock className="h-3.5 w-3.5" aria-hidden />
                                                        {resolveLanguageKey(option.deliveryDays === 1 ? "deliveryDay" : "deliveryDays").replace("{days}", String(option.deliveryDays))}
                                                    </span>
                                                </Button>
                                            </Item>
                                        );
                                    })}
                                </div>
                            </fieldset>
                        ) : (
                            <p className="text-muted-foreground">{resolveLanguageKey("priceOnRequest")}</p>
                        )}

                        {addOns.length > 0 && (
                            <fieldset className="flex flex-col gap-3">
                                <legend className="mb-3 text-sm font-semibold">{resolveLanguageKey("addOnsTitle")}</legend>
                                <div className="flex flex-col divide-y divide-border rounded-2xl border border-border">
                                    {addOns.map(addOn => {
                                        const checked = addOnIds.includes(addOn._id);
                                        return (
                                            <label key={addOn._id} className="flex cursor-pointer items-center gap-3 px-4 py-3.5 hover:bg-muted/60">
                                                <Checkbox checked={checked} onCheckedChange={() => toggleAddOn(addOn._id)} />
                                                <span className="flex-1 text-[15px]">{addOn.name}</span>
                                                <span className="text-right text-sm tabular-nums text-muted-foreground">
                                                    +{formatMoney(addOn.price, addOn.currency)}
                                                    {addOn.deliveryDays ? ` · ${resolveLanguageKey("plusDays").replace("{days}", String(addOn.deliveryDays))}` : ""}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </fieldset>
                        )}

                        {selected && (
                            <div className="flex flex-col gap-4 rounded-2xl bg-muted p-5">
                                <dl className="flex flex-col gap-2 text-[15px]">
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-muted-foreground">{selected.name}</dt>
                                        <dd className="tabular-nums">{formatMoney(selected.price, selected.currency)}</dd>
                                    </div>
                                    {chosenAddOns.map(addOn => (
                                        <div key={addOn._id} className="flex justify-between gap-4">
                                            <dt className="text-muted-foreground">{addOn.name}</dt>
                                            <dd className="tabular-nums">+{formatMoney(addOn.price, addOn.currency)}</dd>
                                        </div>
                                    ))}
                                    <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
                                        <dt className="font-semibold">{resolveLanguageKey("total")}</dt>
                                        <dd className="font-display text-2xl font-semibold tabular-nums">{formatMoney(total, selected.currency)}</dd>
                                    </div>
                                </dl>
                                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <IconClock className="h-4 w-4" aria-hidden />
                                    {resolveLanguageKey("estimatedDelivery").replace(
                                        "{date}",
                                        formatDate(new Date(Date.now() + totalDays * DAY_MS), {format: {weekday: "short", day: "numeric", month: "long"}}),
                                    )}
                                </p>
                                <Label className="flex-col items-stretch gap-1.5">
                                    {resolveLanguageKey("noteLabel")}
                                    <Textarea
                    value={note}
                    onChange={event => setNote(event.target.value)}
                    rows={3}
                    maxLength={ORDER_NOTE_MAX}
                    placeholder={resolveLanguageKey("notePlaceholder")}
                    className="h-auto py-2.5"
                  />
                                </Label>
                                <Button size="lg"
                                    type="button"
                                    onClick={placeOrder}
                                    disabled={ordering || !isAuthenticated || isOwnListing}
                                    className="w-full"
                                >
                                    {ordering ? resolveLanguageKey("ordering") : resolveLanguageKey("orderNow")}
                                </Button>
                                {isOwnListing && <p className="text-xs text-muted-foreground">{resolveLanguageKey("ownListing")}</p>}
                                {!isHydrating && !isAuthenticated && <PortalInlineSignIn next={`${base}/service?id=${encodeURIComponent(id)}`} message={String(resolveLanguageKey("signInToOrder"))} />}
                                <p className="text-xs leading-relaxed text-muted-foreground">{resolveLanguageKey("orderHint")}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ShopMarketplaceReviews listingId={listing._id} average={listing.avgRating} count={listing.reviewCount} />

            {listing.related.length > 0 && (
                <section className="flex flex-col gap-6" aria-labelledby="shop-related">
                    <h2 id="shop-related" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{resolveLanguageKey("related")}</h2>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                        {listing.related.slice(0, 4).map(item => (
                            <ShopListingCard key={item._id} listing={item} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

function ServiceMissing({resolveLanguageKey}: Pick<WithLanguageType, "resolveLanguageKey">) {
    const base = useSectionBase();
    return (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
            <h1 className="font-display text-3xl font-semibold">{resolveLanguageKey("notFound")}</h1>
            <p className="text-muted-foreground">{resolveLanguageKey("notFoundMessage")}</p>
            <Button asChild variant="link" className="h-auto p-0"><Link to={`${base}/services`}>{resolveLanguageKey("backToServices")}</Link></Button>
        </div>
    );
}

export default compose(
    withLanguage(LANGUAGE_PATH),
    withDebug(true, true),
)(ServicePage);
