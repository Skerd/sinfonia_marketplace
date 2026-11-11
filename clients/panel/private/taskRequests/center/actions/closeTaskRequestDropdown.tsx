import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {TaskRequest} from "armonia/src/modules/marketplace/api/marketplace/private/taskRequest/taskRequest.dto.ts";
import {IconLock} from "@tabler/icons-react";

type CloseTaskRequestDropdownProps = WithLanguageType & {
    entity: TaskRequest;
    onAction: (action: string) => void;
};

function CloseTaskRequestDropdown({entity, onAction, resolveLanguageKey}: CloseTaskRequestDropdownProps) {
    const actionKey = "close";
    const shortcut = "2";
    const {write} = useAccess("taskRequests");

    const canClose = entity.status === "open" && !!write?.status;

    const triggerAction = () => {
        if (!canClose) return;
        onAction(actionKey);
    };
    useKeyboardShortcuts(shortcut, triggerAction);

    if (!canClose) {
        return null;
    }

    return (
        <DropdownMenuItem
            onClick={() => {triggerAction();}}
        >
            <IconLock className="size-4" />
            {resolveLanguageKey("title")}
            <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/taskRequests/center/actions/closeTaskRequestDropdown.tsx"),
    withDebug(true, true, "taskRequests"),
)(CloseTaskRequestDropdown);
