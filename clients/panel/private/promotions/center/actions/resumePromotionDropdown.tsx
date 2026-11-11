import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {IconPlayerPlay} from "@tabler/icons-react";

type ResumePromotionDropdownProps = WithLanguageType & {
    onAction: (action: string) => void;
};

function ResumePromotionDropdown({onAction, resolveLanguageKey}: ResumePromotionDropdownProps) {
    return (
        <DropdownMenuItem onClick={() => onAction("resume")}>
            <IconPlayerPlay size={16} className="text-success" />
            <span>{resolveLanguageKey("title")}</span>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/promotions/center/actions/resumePromotionDropdown.tsx"),
    withDebug(true, true, "promotions"),
)(ResumePromotionDropdown);
