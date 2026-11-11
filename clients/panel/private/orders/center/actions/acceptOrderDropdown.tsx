import {compose} from "redux";
import {useSelector} from "react-redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import type {Order} from "armonia/src/modules/marketplace/api/marketplace/private/order/order.dto.ts";
import {IconCircleCheck} from "@tabler/icons-react";

type AcceptOrderDropdownProps = WithLanguageType & {
    order: Order;
    onAction: (action: string) => void;
};

function AcceptOrderDropdown({order, onAction, resolveLanguageKey}: AcceptOrderDropdownProps) {
    const actionKey = "accept";
    const shortcut = "1";
    const {write} = useAccess("orders");
    const {id: currentUserId} = useSelector((state: RootState) => state.authentication.user);

    const isProvider = order.provider?._id === currentUserId;
    const canAccept = isProvider && order.status === "pending" && !!write;

    const triggerAction = () => {
        if (!canAccept) return;
        onAction(actionKey);
    };
    useKeyboardShortcuts(shortcut, triggerAction);

    if (!canAccept) {
        return null;
    }

    return (
        <DropdownMenuItem onClick={() => triggerAction()}>
            <IconCircleCheck size={16} className="text-success" />
            <span className="text-success">{resolveLanguageKey("title")}</span>
            <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/orders/center/actions/acceptOrderDropdown.tsx"),
    withDebug(true, true, "orders"),
)(AcceptOrderDropdown);
