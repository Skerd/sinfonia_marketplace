import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import type {TaskRequest} from "armonia/src/modules/marketplace/api/marketplace/private/taskRequest/taskRequest.dto.ts";
import {IconBell} from "@tabler/icons-react";

type NotifyAllTaskRequestDropdownProps = WithLanguageType & {
    entity: TaskRequest;
    onAction: (action: string) => void;
};

function NotifyAllTaskRequestDropdown({onAction, resolveLanguageKey}: NotifyAllTaskRequestDropdownProps) {
    const actionKey = "notifyAll";
    const shortcut = "1";

    const triggerAction = () => {
        onAction(actionKey);
    };
    useKeyboardShortcuts(shortcut, triggerAction);

    return (
        <DropdownMenuItem
            onClick={() => {triggerAction();}}
        >
            <IconBell className="size-4" />
            {resolveLanguageKey("title")}
            <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/taskRequests/center/actions/notifyAllTaskRequestDropdown.tsx"),
    withDebug(true, true, "taskRequests"),
)(NotifyAllTaskRequestDropdown);
