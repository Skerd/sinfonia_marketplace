import {compose} from "redux";
import {useSelector} from "react-redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import type {TaskLead} from "armonia/src/modules/marketplace/api/marketplace/private/taskLead/taskLead.dto.ts";
import {IconSend} from "@tabler/icons-react";
import {leadIsOpenFor} from "./leadActionGate.ts";

type QuoteTaskLeadDropdownProps = WithLanguageType & {
    lead: TaskLead;
    onAction: (action: string) => void;
};

function QuoteTaskLeadDropdown({lead, onAction, resolveLanguageKey}: QuoteTaskLeadDropdownProps) {
    const actionKey = "quote";
    const shortcut = "1";
    const {write} = useAccess("taskleads");
    const {id: currentUserId} = useSelector((state: RootState) => state.authentication.user);
    const allowed = leadIsOpenFor(lead, currentUserId, write);

    const triggerAction = () => {
        if (allowed) onAction(actionKey);
    };
    useKeyboardShortcuts(shortcut, triggerAction);

    if (!allowed) return null;

    return (
        <DropdownMenuItem onClick={() => triggerAction()}>
            <IconSend size={16} className="text-primary" />
            <span className="text-primary">{resolveLanguageKey("title")}</span>
            <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/taskLeads/center/actions/quoteTaskLeadDropdown.tsx"),
    withDebug(true, true, "taskleads"),
)(QuoteTaskLeadDropdown);
