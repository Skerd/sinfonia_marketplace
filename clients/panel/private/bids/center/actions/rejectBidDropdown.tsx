import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {Bid} from "armonia/src/modules/marketplace/api/marketplace/private/bid/bid.dto.ts";
import {IconCircleX} from "@tabler/icons-react";

type RejectBidDropdownProps = WithLanguageType & {
    bid: Bid;
    onAction: (action: string) => void;
};

function RejectBidDropdown({bid, onAction, resolveLanguageKey}: RejectBidDropdownProps) {
    const actionKey = "reject";
    const shortcut = "2";
    const {write} = useAccess("marketplacebids");

    const canReject = bid.status === "pending" && !!write;

    const triggerAction = () => {
        if (!canReject) return;
        onAction(actionKey);
    };
    useKeyboardShortcuts(shortcut, triggerAction);

    if (!canReject) {
        return null;
    }

    return (
        <DropdownMenuItem onClick={() => triggerAction()}>
            <IconCircleX size={16} className="text-destructive" />
            <span className="text-destructive">{resolveLanguageKey("title")}</span>
            <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/bids/center/actions/rejectBidDropdown.tsx"),
    withDebug(true, true, "marketplacebids"),
)(RejectBidDropdown);
