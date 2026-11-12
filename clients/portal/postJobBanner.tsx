import {compose} from "redux";
import {Link} from "react-router-dom";
import {IconTool, IconArrowRight} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {usePortalSession} from "@coreModule/clients/portal/shared/portalSession.tsx";
import {usePortalSite} from "@coreModule/clients/portal/shared/portalSiteContext.tsx";
import {useSectionBase} from "@coreModule/clients/portal/shared/sectionBase.tsx";
import type {ShopListingTaxonomyResponse} from "armonia/src/modules/marketplace/api/marketplace/public/shopMarketplace/shopMarketplace.types.ts";

const TAXONOMY_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/shopListingTaxonomy"};

/**
 * "Post a job" on top of the services tab, shown while someone here offers services: a buyer describes the job once
 * and the providers who do that work answer with quotes. Posting needs an account, so signed-out visitors sign in or
 * up first.
 */
function PostJobBanner({resolveLanguageKey}: WithLanguageType) {
    const base = useSectionBase();
    const {site} = usePortalSite();
    const {isAuthenticated} = usePortalSession();
    const taxonomy = useHttpRequest<ShopListingTaxonomyResponse>(TAXONOMY_REQUEST, {}, 1);

    if (!taxonomy.data?.data.listingCount) return null;
    const companySite = site?.scope === "company";
    const target = `${base}/account/jobs/new`;
    const href = isAuthenticated ? target : `/login?next=${encodeURIComponent(target)}`;

    return (
        <section className="flex flex-col gap-5 rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:flex-row sm:items-center sm:gap-6 sm:p-8">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground" aria-hidden>
                <IconTool size={30} stroke={1.6} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{resolveLanguageKey(companySite ? "titleCompany" : "title")}</h2>
                <p className="text-muted-foreground">
                    {resolveLanguageKey(companySite ? "subtitleCompany" : "subtitle")}
                </p>
                {!isAuthenticated ? <p className="text-sm text-muted-foreground">{resolveLanguageKey("accountNeeded")}</p> : null}
            </div>
            <Button asChild size="lg" className="shrink-0 self-start sm:self-center">
                <Link to={href}>
                    {resolveLanguageKey(isAuthenticated ? "cta" : "ctaSignIn")}
                    <IconArrowRight className="h-4 w-4" aria-hidden />
                </Link>
            </Button>
        </section>
    );
}

export default compose(withLanguage("src/modules/marketplace/clients/portal/postJobBanner.tsx"))(PostJobBanner);
