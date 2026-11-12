import {useEffect, useMemo, useState, type FormEvent} from "react";
import {Link, useNavigate} from "react-router-dom";
import {compose} from "redux";
import {toast} from "sonner";
import {IconArrowLeft, IconPhotoPlus, IconCurrentLocation} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {handleError} from "@coreModule/helpers/general/errors.ts";
import SinglePinMap from "@coreModule/components/viewEngine/widgets/addresses/mapWithPins.tsx";
import {useServicesConfig} from "@marketplaceModule/clients/client/public/shared/servicesConfigContext.tsx";
import {useSectionBase} from "@coreModule/clients/portal/shared/sectionBase.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {NativeSelect} from "@coreModule/components/ui/native-select.tsx";
import {Textarea} from "@coreModule/components/ui/textarea.tsx";
import type {
    ShopListingCategory,
    ShopListingTaxonomyResponse,
} from "armonia/src/modules/marketplace/api/marketplace/public/shopMarketplace/shopMarketplace.types.ts";
import type {CreateMyTaskRequestResponse} from "armonia/src/modules/marketplace/api/marketplace/private/taskRequest/taskRequest.dto.ts";

const LANGUAGE_PATH = "src/modules/marketplace/clients/client/public/account/jobs/newJob.tsx";

type ShopCountry = {_id: string; name: string; code: string};
type ShopCity = {_id: string; name: string};

/** Where the map opens before the buyer drops a pin (same default as the panel's pin picker). */
const DEFAULT_PIN = {lat: 41.3275, lng: 19.8187};

const TAXONOMY_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/shopListingTaxonomy"};
const COUNTRIES_REQUEST: HttpRequest = {method: "GET", url: "/api/portal/places/countries"};
const CITIES_REQUEST: HttpRequest = {method: "POST", url: "/api/portal/places/cities"};
const CREATE_JOB_REQUEST: HttpRequest = {method: "PUT", url: "/api/marketplace/taskRequest/createMine"};

const EMPTY_FORM = {
    title: "",
    description: "",
    category: "",
    budgetMax: "",
    street: "",
    postalCode: "",
    country: "",
    city: "",
};

/** Parents first, each followed by its children, for an indented select. */
function orderedCategories(categories: ShopListingCategory[]): {category: ShopListingCategory; depth: number}[] {
    const result: {category: ShopListingCategory; depth: number}[] = [];
    const visit = (parent: string | undefined, depth: number) => {
        for (const category of categories.filter(item => item.parent === parent)) {
            result.push({category, depth});
            visit(category._id, depth + 1);
        }
    };
    visit(undefined, 0);
    return result;
}

function NewJobPage({resolveLanguageKey}: WithLanguageType) {
    const base = useSectionBase();
    const navigate = useNavigate();
    const {config} = useServicesConfig();
    const [form, setForm] = useState(EMPTY_FORM);
    const [pin, setPin] = useState<{lat: number; lng: number} | null>(null);
    const [image, setImage] = useState<File | null>(null);
    const taxonomy = useHttpRequest<ShopListingTaxonomyResponse>(TAXONOMY_REQUEST, {}, 1);
    const countryList = useHttpRequest<{data: ShopCountry[]}>(COUNTRIES_REQUEST, {}, 1);
    const categories: ShopListingCategory[] = taxonomy.data?.data.categories ?? [];
    const countries: ShopCountry[] = countryList.data?.data ?? [];

    const [citiesCount, setCitiesCount] = useState(0);
    useEffect(() => {
        if (form.country) setCitiesCount((count) => count + 1);
    }, [form.country]);
    const cityList = useHttpRequest<{data: ShopCity[]}>(CITIES_REQUEST, {countryId: form.country}, citiesCount);
    const cities: ShopCity[] = form.country && !cityList.error ? cityList.data?.data ?? [] : [];

    const [createCall, setCreateCall] = useState<{form: FormData; count: number}>(() => ({form: new FormData(), count: 0}));
    const createRequest = useHttpRequest<CreateMyTaskRequestResponse>(CREATE_JOB_REQUEST, createCall.form, createCall.count, true, {
        success: (response) => navigate(`${base}/account/jobs/${response.data._id}?posted=1&notified=${response.data.notified}`),
        error: (err) => handleError(err, {context: "NewJob", showToast: true, fallbackMessage: resolveLanguageKey("submitError")}),
    });
    // Stays busy after success: the page navigates to the new job.
    const submitting = createRequest.loading || (createCall.count > 0 && !!createRequest.data);

    const imagePreview = useMemo(() => (image ? URL.createObjectURL(image) : undefined), [image]);
    useEffect(() => () => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
    }, [imagePreview]);

    const setField = (key: keyof typeof EMPTY_FORM, value: string) => setForm(current => ({...current, [key]: value}));
    const currency = config?.currency;
    // Remote work is matched by category alone, so it needs no address or pin (D143).
    const onsite = categories.find(category => category._id === form.category)?.delivery !== "remote";

    function locateMe() {
        navigator.geolocation?.getCurrentPosition(
            position => setPin({lat: position.coords.latitude, lng: position.coords.longitude}),
            () => toast.error(resolveLanguageKey("locationError")),
        );
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        if (onsite && !pin) {
            toast.error(resolveLanguageKey("pinRequired"));
            return;
        }
        if (!image || !currency) return;
        const payload = new FormData();
        payload.append("data", JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim() || undefined,
            category: form.category,
            budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
            currency: currency._id,
            address: onsite && pin ? {
                street: form.street.trim(),
                postalCode: form.postalCode.trim(),
                country: form.country,
                city: form.city,
                latitude: pin.lat,
                longitude: pin.lng,
            } : undefined,
        }));
        payload.append("mainImage", image);
        setCreateCall((current) => ({form: payload, count: current.count + 1}));
    }

    return (
        <div className="flex flex-col gap-8">
            <Link to={`${base}/account/jobs`} className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground">
                <IconArrowLeft className="h-4 w-4" aria-hidden />
                {resolveLanguageKey("backToJobs")}
            </Link>
            <div className="flex flex-col gap-2">
                <h1 className="font-display text-3xl font-bold tracking-tight">{resolveLanguageKey("title")}</h1>
                <p className="max-w-2xl text-muted-foreground">{resolveLanguageKey("lead")}</p>
            </div>

            <form onSubmit={submit} className="flex max-w-3xl flex-col gap-8">
                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold">{resolveLanguageKey("sectionWhat")}</h2>
                    <Label className="flex-col items-stretch gap-1.5">
                        {resolveLanguageKey("titleLabel")}
                        <Input required maxLength={200} value={form.title} onChange={event => setField("title", event.target.value)} placeholder={resolveLanguageKey("titlePlaceholder")} />
                    </Label>
                    <Label className="flex-col items-stretch gap-1.5">
                        {resolveLanguageKey("descriptionLabel")}
                        <Textarea rows={5} maxLength={5000} value={form.description} onChange={event => setField("description", event.target.value)} placeholder={resolveLanguageKey("descriptionPlaceholder")} className="h-auto py-2.5" />
                    </Label>
                    <Label className="flex-col items-stretch gap-1.5">
                        {resolveLanguageKey("categoryLabel")}
                        <NativeSelect required value={form.category} onChange={event => setField("category", event.target.value)} className="w-full">
                            <option value="">{resolveLanguageKey("categoryPlaceholder")}</option>
                            {orderedCategories(categories).map(({category, depth}) => (
                                <option key={category._id} value={category._id}>{`${"  ".repeat(depth)}${category.name}`}</option>
                            ))}
                        </NativeSelect>
                    </Label>
                    <div className="flex flex-col gap-1.5 text-sm font-medium">
                        {resolveLanguageKey("imageLabel")}
                        <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-border p-4 hover:border-foreground">
                            <span className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
                                {imagePreview ? <img src={imagePreview} alt="" className="h-full w-full object-cover" /> : <IconPhotoPlus className="h-6 w-6" aria-hidden />}
                            </span>
                            <span className="font-normal text-muted-foreground">{image?.name ?? resolveLanguageKey("imageHint")}</span>
                            <Input bare required type="file" accept="image/*" className="sr-only" onChange={event => setImage(event.target.files?.[0] ?? null)} />
                        </label>
                    </div>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold">{resolveLanguageKey("sectionBudget")}</h2>
                    <Label className="flex-col items-stretch gap-1.5 sm:max-w-xs">
                        {resolveLanguageKey("budgetMaxLabel").replace("{currency}", currency?.abbreviation ?? currency?.symbol ?? "")}
                        <Input type="number" min={1} step="0.01" inputMode="decimal" value={form.budgetMax} onChange={event => setField("budgetMax", event.target.value)} aria-describedby="new-job-budget-hint" />
                    </Label>
                    <p id="new-job-budget-hint" className="text-xs text-muted-foreground">{resolveLanguageKey("budgetHint")}</p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold">{resolveLanguageKey("sectionWhere")}</h2>
                    {onsite ? (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Label className="flex-col items-stretch gap-1.5 sm:col-span-2">
                                    {resolveLanguageKey("streetLabel")}
                                    <Input required maxLength={200} value={form.street} onChange={event => setField("street", event.target.value)} />
                                </Label>
                                <Label className="flex-col items-stretch gap-1.5">
                                    {resolveLanguageKey("countryLabel")}
                                    <NativeSelect required value={form.country} onChange={event => setForm(current => ({...current, country: event.target.value, city: ""}))} className="w-full">
                                        <option value="">{resolveLanguageKey("selectPlaceholder")}</option>
                                        {countries.map(country => <option key={country._id} value={country._id}>{country.name}</option>)}
                                    </NativeSelect>
                                </Label>
                                <Label className="flex-col items-stretch gap-1.5">
                                    {resolveLanguageKey("cityLabel")}
                                    <NativeSelect required disabled={!form.country} value={form.city} onChange={event => setField("city", event.target.value)} className="w-full">
                                        <option value="">{resolveLanguageKey("selectPlaceholder")}</option>
                                        {cities.map(city => <option key={city._id} value={city._id}>{city.name}</option>)}
                                    </NativeSelect>
                                </Label>
                                <Label className="flex-col items-stretch gap-1.5">
                                    {resolveLanguageKey("postalCodeLabel")}
                                    <Input required maxLength={20} value={form.postalCode} onChange={event => setField("postalCode", event.target.value)} />
                                </Label>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                    <span className="font-medium">{resolveLanguageKey("pinLabel")}</span>
                                    <Button variant="link" type="button" onClick={locateMe} className="h-auto gap-1.5 p-0">
                                        <IconCurrentLocation aria-hidden />
                                        {resolveLanguageKey("useMyLocation")}
                                    </Button>
                                </div>
                                <div className="h-72 overflow-hidden rounded-2xl">
                                    <SinglePinMap
                                        latitude={pin?.lat ?? DEFAULT_PIN.lat}
                                        longitude={pin?.lng ?? DEFAULT_PIN.lng}
                                        onPinChange={coords => setPin(coords)}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">{resolveLanguageKey(pin ? "pinSet" : "pinHint")}</p>
                            </div>
                        </>
                    ) : (
                        <p className="rounded-2xl bg-muted px-5 py-4 text-sm text-muted-foreground">{resolveLanguageKey("whereRemote")}</p>
                    )}
                </section>

                <div className="flex flex-wrap gap-3 border-t border-border pt-6">
                    <Button size="lg" type="submit" disabled={submitting || !currency} >
                        {resolveLanguageKey(submitting ? "submitting" : "submit")}
                    </Button>
                    <Button asChild variant="outline" size="lg"><Link to={`${base}/account/jobs`}>{resolveLanguageKey("cancel")}</Link></Button>
                </div>
            </form>
        </div>
    );
}

export default compose(
    withLanguage(LANGUAGE_PATH),
    withDebug(true, true),
)(NewJobPage);
