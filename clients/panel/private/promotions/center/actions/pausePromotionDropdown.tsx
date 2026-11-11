import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {IconPlayerPause} from "@tabler/icons-react";

type PausePromotionDropdownProps = WithLanguageType & {
    onAction: (action: string) => void;
};

function PausePromotionDropdown({onAction, resolveLanguageKey}: PausePromotionDropdownProps) {
    return (
        <DropdownMenuItem onClick={() => onAction("pause")}>
            <IconPlayerPause size={16} className="text-warning" />
            <span>{resolveLanguageKey("title")}</span>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/promotions/center/actions/pausePromotionDropdown.tsx"),
    withDebug(true, true, "promotions"),
)(PausePromotionDropdown);
