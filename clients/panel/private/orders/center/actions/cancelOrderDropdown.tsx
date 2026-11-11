import {compose} from "redux";
import {useSelector} from "react-redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import type {Order} from "armonia/src/modules/marketplace/api/marketplace/private/order/order.dto.ts";
import {IconCircleX} from "@tabler/icons-react";

type CancelOrderDropdownProps = WithLanguageType & {
    order: Order;
    onAction: (action: string) => void;
};

function CancelOrderDropdown({order, onAction, resolveLanguageKey}: CancelOrderDropdownProps) {
    const actionKey = "cancel";
    const shortcut = "3";
    const {write} = useAccess("orders");
    const {id: currentUserId} = useSelector((state: RootState) => state.authentication.user);

    const isProvider = order.provider?._id === currentUserId;
    const isCustomer = order.customer?._id === currentUserId;
    const isFinal = order.status === "completed" || order.status === "cancelled";
    // As on the server: the customer only before work starts, nobody while a dispute is open
    const canCancel = (isProvider || (isCustomer && order.status !== "in_progress"))
        && !isFinal && !order.hasActiveDispute && !!write;

    const triggerAction = () => {
        if (!canCancel) return;
        onAction(actionKey);
    };
    useKeyboardShortcuts(shortcut, triggerAction);

    if (!canCancel) {
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
    withLanguage("src/modules/marketplace/clients/panel/private/orders/center/actions/cancelOrderDropdown.tsx"),
    withDebug(true, true, "orders"),
)(CancelOrderDropdown);
