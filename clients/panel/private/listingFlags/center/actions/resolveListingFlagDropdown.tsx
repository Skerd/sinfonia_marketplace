import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {IconCircleCheck} from "@tabler/icons-react";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {ListingFlag} from "armonia/src/modules/marketplace/api/marketplace/private/listingFlag/listingFlag.dto.ts";

type Props = WithLanguageType & {
    listingFlag: ListingFlag;
    onAction: (action: string) => void;
};

function ResolveListingFlagDropdown({listingFlag, onAction, resolveLanguageKey}: Props) {
    const {write} = useAccess("listingflags");
    const canShow = !!write && !listingFlag.deletedAt && listingFlag.status === "pending";

    if (!canShow) {
        return null;
    }

    return (
        <DropdownMenuItem onClick={() => onAction("resolve")}>
            <IconCircleCheck size={16} className="text-success" />
            <span>{resolveLanguageKey("title")}</span>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/listingFlags/center/actions/resolveListingFlagDropdown.tsx"),
    withDebug(true, true, "listingflags"),
)(ResolveListingFlagDropdown);
