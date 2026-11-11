import {cn} from "@coreModule/components/lib/utils.ts";
import type {
    ShopAvailabilitySlot,
    ShopListingLocation,
} from "armonia/src/modules/marketplace/api/marketplace/public/shopMarketplace/shopMarketplace.types.ts";

/** "City, State, Country" with whichever levels the listing has. */
export function listingLocationLabel(location: ShopListingLocation | undefined): string {
    if (!location) return "";
    return [location.city?.name, location.state?.name, location.country?.name].filter(Boolean).join(", ");
}

function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase())
        .join("");
}

/** Provider monogram; provider photos are not public media, so the shop never requests them. */
export function ShopProviderAvatar({name, size = "md", className}: {name: string; size?: "sm" | "md" | "lg"; className?: string}) {
    return (
        <span
            aria-hidden
            className={cn(
                "inline-flex shrink-0 items-center justify-center rounded-full bg-foreground font-display font-semibold text-background",
                size === "sm" && "h-7 w-7 text-[11px]",
                size === "md" && "h-11 w-11 text-sm",
                size === "lg" && "h-20 w-20 text-2xl",
                className,
            )}
        >
            {initials(name) || "·"}
        </span>
    );
}

/** Weekday name for `dayOfWeek` (0 = Sunday) in the shopper's language. */
function weekdayName(dayOfWeek: number, languageCode: string): string {
    // 2023-01-01 was a Sunday
    return new Intl.DateTimeFormat(languageCode, {weekday: "long", timeZone: "UTC"}).format(new Date(Date.UTC(2023, 0, 1 + dayOfWeek)));
}

/** Weekly availability as one row per day, Monday first. */
export function ShopAvailability({slots, languageCode}: {slots: ShopAvailabilitySlot[]; languageCode: string}) {
    const days = [1, 2, 3, 4, 5, 6, 0]
        .map(day => ({
            day,
            windows: slots.filter(slot => slot.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime)),
        }))
        .filter(entry => entry.windows.length > 0);

    return (
        <dl className="divide-y divide-border text-sm">
            {days.map(entry => (
                <div key={entry.day} className="flex justify-between gap-6 py-2.5">
                    <dt className="capitalize text-muted-foreground">{weekdayName(entry.day, languageCode)}</dt>
                    <dd className="text-right font-medium tabular-nums">
                        {entry.windows.map(window => `${window.startTime}–${window.endTime}`).join(", ")}
                    </dd>
                </div>
            ))}
        </dl>
    );
}
