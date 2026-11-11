import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import {IconCircleCheck} from "@tabler/icons-react";

type ActivateListingDropdownProps = WithLanguageType & {
    onAction: (action: string) => void;
};

function ActivateListingDropdown({onAction, resolveLanguageKey}: ActivateListingDropdownProps) {
    // The server also requires the listing's provider (or an admin)
    const {write} = useAccess("listings");
    if (!write) return null;

    return (
        <DropdownMenuItem onClick={() => onAction("activate")}>
            <IconCircleCheck size={16} className="text-success" />
            <span>{resolveLanguageKey("title")}</span>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/listings/center/actions/activateListingDropdown.tsx"),
    withDebug(true, true, "listings"),
)(ActivateListingDropdown);
