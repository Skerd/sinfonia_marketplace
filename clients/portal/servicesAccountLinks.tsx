import {compose} from "redux";
import {Link} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {usePortalSite} from "@coreModule/clients/portal/shared/portalSiteContext.tsx";

const LINKS = ["orders", "jobs"] as const;

/**
 * Service orders and posted jobs live in the services' own account pages; the portal account links there. Where the
 * task board is (D172), its own link leads to the jobs, so this one does not repeat it.
 */
function ServicesAccountLinks({resolveLanguageKey}: WithLanguageType) {
    const {sections} = usePortalSite();
    const links = sections.some((section) => section.section === "tasks") ? LINKS.filter((link) => link !== "jobs") : LINKS;
    return (
        <div className="flex flex-wrap gap-2">
            {links.map((link) => (
                <Button key={link} asChild variant="outline" size="lg" className="px-4">
                    <Link to={`/services/account/${link}`}>{resolveLanguageKey(link)}</Link>
                </Button>
            ))}
        </div>
    );
}

export default compose(withLanguage("src/modules/marketplace/clients/portal/servicesAccountLinks.tsx"))(ServicesAccountLinks);
