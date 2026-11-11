import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {IconAlertOctagon} from "@tabler/icons-react";

type StopPromotionDropdownProps = WithLanguageType & {
    onAction: (action: string) => void;
};

function StopPromotionDropdown({onAction, resolveLanguageKey}: StopPromotionDropdownProps) {
    return (
        <DropdownMenuItem onClick={() => onAction("stop")}>
            <IconAlertOctagon size={16} className="text-destructive" />
            <span>{resolveLanguageKey("title")}</span>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/promotions/center/actions/stopPromotionDropdown.tsx"),
    withDebug(true, true, "promotions"),
)(StopPromotionDropdown);
