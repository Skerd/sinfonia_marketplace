import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {useActionAccess} from "@coreModule/helpers/hooks/useActionAccess.ts";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import type {TaskBoardTask} from "armonia/src/modules/marketplace/api/marketplace/private/taskBoard/taskBoard.types.ts";
import {IconSend} from "@tabler/icons-react";
import {boardTaskTakesQuote} from "./taskBoardGate.ts";

type QuoteTaskBoardDropdownProps = WithLanguageType & {
    task: TaskBoardTask;
    onAction: (action: string) => void;
};

/** "Send a quote" on a task of the board (D172), for those who may quote and while the task takes one. */
function QuoteTaskBoardDropdown({task, onAction, resolveLanguageKey}: QuoteTaskBoardDropdownProps) {
    const actionKey = "quote";
    const shortcut = "1";
    const allowed = boardTaskTakesQuote(task, useActionAccess("taskleads", "quoteJob"));

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
    withLanguage("src/modules/marketplace/clients/panel/private/taskBoard/center/actions/quoteTaskBoardDropdown.tsx"),
    withDebug(true, true, "taskleads"),
)(QuoteTaskBoardDropdown);
