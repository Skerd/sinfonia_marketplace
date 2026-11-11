import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {IconCircleCheck} from "@tabler/icons-react";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {Dispute} from "armonia/src/modules/marketplace/api/marketplace/private/dispute/dispute.dto.ts";

type Props = WithLanguageType & {
    dispute: Dispute;
    onAction: (action: string) => void;
};

function ResolveDisputeDropdown({dispute, onAction, resolveLanguageKey}: Props) {
    const {write} = useAccess("disputes");

    const openish = dispute.status === "open" || dispute.status === "under_review";
    const canShow = !!write && !dispute.deletedAt && openish;

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
    withLanguage("src/modules/marketplace/clients/panel/private/disputes/center/actions/resolveDisputeDropdown.tsx"),
    withDebug(true, true, "disputes"),
)(ResolveDisputeDropdown);
