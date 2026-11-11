import {compose} from "redux";
import {useSelector} from "react-redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import type {Order} from "armonia/src/modules/marketplace/api/marketplace/private/order/order.dto.ts";
import {IconCalendarPlus} from "@tabler/icons-react";

type ExtendOrderDropdownProps = WithLanguageType & {
    order: Order;
    onAction: (action: string) => void;
};

function ExtendOrderDropdown({order, onAction, resolveLanguageKey}: ExtendOrderDropdownProps) {
    const actionKey = "extend";
    const shortcut = "4";
    const {write} = useAccess("orders");
    const {id: currentUserId} = useSelector((state: RootState) => state.authentication.user);

    const isProvider = order.provider?._id === currentUserId;
    const isFinal = order.status === "completed" || order.status === "cancelled";
    const canExtend = isProvider && !isFinal && !!write;

    const triggerAction = () => {
        if (!canExtend) return;
        onAction(actionKey);
    };
    useKeyboardShortcuts(shortcut, triggerAction);

    if (!canExtend) {
        return null;
    }

    return (
        <DropdownMenuItem onClick={() => triggerAction()}>
            <IconCalendarPlus size={16} className="text-primary" />
            <span className="text-primary">{resolveLanguageKey("title")}</span>
            <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/orders/center/actions/extendOrderDropdown.tsx"),
    withDebug(true, true, "orders"),
)(ExtendOrderDropdown);
