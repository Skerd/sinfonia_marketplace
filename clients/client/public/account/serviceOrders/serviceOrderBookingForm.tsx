import {useState} from "react";
import {compose} from "redux";
import {useSelector} from "react-redux";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {toast} from "sonner";
import dayjs, {type Dayjs} from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {handleError} from "@coreModule/helpers/general/errors.ts";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {DateInput} from "@coreModule/components/custom/inputs/dateInput.tsx";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@coreModule/components/ui/form.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {createBookingFormSchema} from "armonia/src/modules/marketplace/api/marketplace/private/booking/createBooking.form.validator.ts";
import type {
    ProviderAvailability,
    ProviderAvailabilitySlot,
} from "armonia/src/modules/marketplace/api/marketplace/private/providerProfile/providerProfile.dto.ts";

dayjs.extend(utc);
dayjs.extend(timezone);

const LANGUAGE_PATH = "src/modules/marketplace/clients/client/public/account/serviceOrders/serviceOrderBookingForm.tsx";

const BOOK_REQUEST: HttpRequest = {method: "PUT", url: "/api/marketplace/booking/createMine"};
/** With a time token, DateInput emits ISO instants for the wall clock picked in `timeZone`. */
const VALUE_FORMAT = "YYYY-MM-DD[T]HH:mm";

/** Monday first, then by start time. */
const weekOrder = (dayOfWeek: number) => (dayOfWeek + 6) % 7;

/** A window as the buyer reads it; `provider` is the provider's own wall clock, set when it reads differently. */
type WindowRow = {
    dayOfWeek: number;
    start: string;
    end: string;
    /** Weekday of `end` when it falls on a later day than `start`. */
    endDayOfWeek?: number;
    provider?: ProviderAvailabilitySlot;
};

/** `HH:mm` on `date` in `zone`; `24:00` is the next day's midnight (WeeklyHoursSlot). */
function instantOf(date: string, time: string, zone: string): Dayjs {
    return time === "24:00"
        ? dayjs.tz(`${dayjs(date).add(1, "day").format("YYYY-MM-DD")}T00:00`, zone)
        : dayjs.tz(`${date}T${time}`, zone);
}

/**
 * The provider's weekly window in the buyer's zone. It is placed on the window's next date (today included), so the
 * offset is the one the buyer is about to book under; a DST change later on can move it by an hour.
 */
function windowInZone(window: ProviderAvailabilitySlot, providerZone: string, timeZone: string, now: Dayjs): WindowRow {
    const providerToday = now.tz(providerZone);
    const date = dayjs(providerToday.format("YYYY-MM-DD"))
        .add((window.dayOfWeek - providerToday.day() + 7) % 7, "day")
        .format("YYYY-MM-DD");
    const start = instantOf(date, window.startTime, providerZone).tz(timeZone);
    const end = instantOf(date, window.endTime, providerZone).tz(timeZone);
    const endsNextDay = end.format("YYYY-MM-DD") !== start.format("YYYY-MM-DD");
    const endsAtMidnight = endsNextDay && end.format("HH:mm") === "00:00";
    const row: WindowRow = {
        dayOfWeek: start.day(),
        start: start.format("HH:mm"),
        end: endsAtMidnight ? "24:00" : end.format("HH:mm"),
        endDayOfWeek: endsNextDay && !endsAtMidnight ? end.day() : undefined,
    };
    // Two zone names with the same offset read the same; brackets would only repeat the times
    const same = row.dayOfWeek === window.dayOfWeek && row.start === window.startTime && row.end === window.endTime;
    return same ? row : {...row, provider: window};
}

type ServiceOrderBookingFormProps = WithLanguageType & {
    orderId: string;
    /** The provider's windows; a session must fit inside one (D105). None means any time. */
    availability?: ProviderAvailability;
    onBooked: () => void;
    onCancel: () => void;
};

/** The buyer schedules the session of their own active services order; the server checks the order's state and the provider's hours. */
function ServiceOrderBookingForm({orderId, availability, onBooked, onCancel, languageCode, resolveLanguageKey, resolveLanguageValue}: ServiceOrderBookingFormProps) {
    const profileTimeZone = useSelector((state: RootState) => state.authentication.user?.timezone);
    const timeZone = profileTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const formSchema = createBookingFormSchema(languageCode, resolveLanguageValue("form"));
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {order: orderId, startAt: "", endAt: "", timezone: timeZone},
    });
    const [startAt, endAt] = form.watch(["startAt", "endAt"]);
    const today = dayjs().format("YYYY-MM-DD");

    const [submission, setSubmission] = useState<{body: Record<string, unknown>; count: number}>({body: {}, count: 0});
    const {loading} = useHttpRequest(BOOK_REQUEST, submission.body, submission.count, true, {
        success: () => {
            toast.success(resolveLanguageKey("booked"));
            onBooked();
        },
        error: (err) => handleError(err, {context: "ServiceOrderBooking", showToast: true, fallbackMessage: resolveLanguageKey("bookError")}),
    });

    // The pickers run on the buyer's clock, so the windows are shown on it too (TD-F43).
    const providerZone = availability?.timeZone;
    const converted = providerZone !== undefined && providerZone !== timeZone;
    const now = dayjs();
    const windows: WindowRow[] = (availability?.windows ?? [])
        .map((window) => converted
            ? windowInZone(window, providerZone, timeZone, now)
            : {dayOfWeek: window.dayOfWeek, start: window.startTime, end: window.endTime})
        .sort((a, b) => weekOrder(a.dayOfWeek) - weekOrder(b.dayOfWeek) || a.start.localeCompare(b.start));

    const submit = form.handleSubmit((values) => setSubmission((current) => ({body: values, count: current.count + 1})));

    return (
        <Form {...form}>
            <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl bg-muted p-5" aria-labelledby="shop-service-booking">
                <p id="shop-service-booking" className="font-semibold">{resolveLanguageKey("title")}</p>
                <p className="text-sm text-muted-foreground">{resolveLanguageKey("message").replace("{zone}", timeZone)}</p>
                {availability && windows.length > 0 && (
                    <section className="flex flex-col gap-2 rounded-xl bg-card p-4" aria-labelledby="shop-service-booking-hours">
                        <p id="shop-service-booking-hours" className="text-sm font-medium">{resolveLanguageKey("availability.title")}</p>
                        <p className="text-xs text-muted-foreground">
                            {converted
                                ? resolveLanguageKey("availability.converted").replace("{zone}", timeZone).replace("{providerZone}", availability.timeZone)
                                : resolveLanguageKey("availability.zone").replace("{zone}", availability.timeZone)}
                        </p>
                        <ul className="flex flex-col divide-y divide-border/50 text-sm">
                            {windows.map((window) => (
                                <li key={`${window.dayOfWeek}-${window.start}-${window.end}`} className="flex justify-between gap-4 py-1.5">
                                    <span>{resolveLanguageKey(`weekday.${window.dayOfWeek}`)}</span>
                                    <span className="text-right text-muted-foreground">
                                        {window.start} – {window.endDayOfWeek === undefined ? "" : `${resolveLanguageKey(`weekday.${window.endDayOfWeek}`)} `}{window.end}
                                        {window.provider && (
                                            <span className="block text-xs">
                                                ({window.provider.dayOfWeek === window.dayOfWeek ? "" : `${resolveLanguageKey(`weekday.${window.provider.dayOfWeek}`)} `}
                                                {window.provider.startTime} – {window.provider.endTime})
                                            </span>
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                    {(["startAt", "endAt"] as const).map((name) => (
                        <FormField
                            key={name}
                            control={form.control}
                            name={name}
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{resolveLanguageKey(`form.${name}Label`)}</FormLabel>
                                    <FormControl>
                                        <DateInput
                                            valueFormat={VALUE_FORMAT}
                                            timeZone={timeZone}
                                            minDate={today}
                                            value={typeof field.value === "string" ? field.value : ""}
                                            onChange={field.onChange}
                                            placeholder={resolveLanguageKey(`form.${name}Placeholder`)}
                                            disabled={loading}
                                            className="bg-card"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ))}
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button size="lg" type="submit" disabled={loading || !startAt || !endAt}>
                        {resolveLanguageKey(loading ? "working" : "submit")}
                    </Button>
                    <Button variant="outline" size="lg" type="button" disabled={loading} onClick={onCancel}>
                        {resolveLanguageKey("back")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

export default compose(
    withLanguage(LANGUAGE_PATH),
    withDebug(true, true),
)(ServiceOrderBookingForm);
