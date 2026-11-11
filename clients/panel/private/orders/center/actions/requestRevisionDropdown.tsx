import {compose} from "redux";
import {useSelector} from "react-redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import type {Order} from "armonia/src/modules/marketplace/api/marketplace/private/order/order.dto.ts";
import {IconRotate} from "@tabler/icons-react";

type RequestRevisionDropdownProps = WithLanguageType & {
    order: Order;
    onAction: (action: string) => void;
};

function RequestRevisionDropdown({order, onAction, resolveLanguageKey}: RequestRevisionDropdownProps) {
    const actionKey = "requestRevision";
    const shortcut = "7";
    const {write} = useAccess("orders");
    const {id: currentUserId} = useSelector((state: RootState) => state.authentication.user);

    const isCustomer = order.customer?._id === currentUserId;
    const canRequest = isCustomer && order.status === "in_progress" && !!order.deliverySubmitted && !!write;

    const triggerAction = () => {
        if (!canRequest) return;
        onAction(actionKey);
    };
    useKeyboardShortcuts(shortcut, triggerAction);

    if (!canRequest) {
        return null;
    }

    return (
        <DropdownMenuItem onClick={() => triggerAction()}>
            <IconRotate size={16} className="text-warning" />
            <span className="text-warning">{resolveLanguageKey("title")}</span>
            <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/orders/center/actions/requestRevisionDropdown.tsx"),
    withDebug(true, true, "orders"),
)(RequestRevisionDropdown);
