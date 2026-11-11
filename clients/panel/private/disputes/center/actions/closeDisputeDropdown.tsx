import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {IconCircleX} from "@tabler/icons-react";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {Dispute} from "armonia/src/modules/marketplace/api/marketplace/private/dispute/dispute.dto.ts";

type Props = WithLanguageType & {
    dispute: Dispute;
    onAction: (action: string) => void;
};

function CloseDisputeDropdown({dispute, onAction, resolveLanguageKey}: Props) {
    const {write} = useAccess("disputes");

    const openish = dispute.status === "open" || dispute.status === "under_review";
    const canShow = !!write && !dispute.deletedAt && openish;

    if (!canShow) {
        return null;
    }

    return (
        <DropdownMenuItem onClick={() => onAction("close")}>
            <IconCircleX size={16} className="text-destructive" />
            <span className="">{resolveLanguageKey("title")}</span>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/disputes/center/actions/closeDisputeDropdown.tsx"),
    withDebug(true, true, "disputes"),
)(CloseDisputeDropdown);
