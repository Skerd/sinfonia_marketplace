import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {IconClipboardList} from "@tabler/icons-react";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {Dispute} from "armonia/src/modules/marketplace/api/marketplace/private/dispute/dispute.dto.ts";

type Props = WithLanguageType & {
    dispute: Dispute;
    onAction: (action: string) => void;
};

function StartReviewDisputeDropdown({dispute, onAction, resolveLanguageKey}: Props) {
    const {write} = useAccess("disputes");

    // Only the platform company's admins decide a dispute (D191, D197); its list marks the rows they decide.
    const canShow =
        !!write && !!dispute.canDecide && !dispute.deletedAt && dispute.status === "open";

    if (!canShow) {
        return null;
    }

    return (
        <DropdownMenuItem onClick={() => onAction("startReview")}>
            <IconClipboardList size={16} />
            <span>{resolveLanguageKey("title")}</span>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/disputes/center/actions/startReviewDisputeDropdown.tsx"),
    withDebug(true, true, "disputes"),
)(StartReviewDisputeDropdown);
