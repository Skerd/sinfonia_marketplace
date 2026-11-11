import {compose} from "redux";
import {Link} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";

const LINKS = ["orders", "jobs"] as const;

/** Service orders and posted jobs live in the services' own account pages; the portal account links there. */
function ServicesAccountLinks({resolveLanguageKey}: WithLanguageType) {
    return (
        <div className="flex flex-wrap gap-2">
            {LINKS.map((link) => (
                <Button key={link} asChild variant="outline" size="lg" className="px-4">
                    <Link to={`/services/account/${link}`}>{resolveLanguageKey(link)}</Link>
                </Button>
            ))}
        </div>
    );
}

export default compose(withLanguage("src/modules/marketplace/clients/portal/servicesAccountLinks.tsx"))(ServicesAccountLinks);
