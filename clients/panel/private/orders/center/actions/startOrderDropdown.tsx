import {compose} from "redux";
import {useSelector} from "react-redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import type {Order} from "armonia/src/modules/marketplace/api/marketplace/private/order/order.dto.ts";
import {IconPlayerPlay} from "@tabler/icons-react";

type StartOrderDropdownProps = WithLanguageType & {
    order: Order;
    onAction: (action: string) => void;
};

function StartOrderDropdown({order, onAction, resolveLanguageKey}: StartOrderDropdownProps) {
    const actionKey = "start";
    const shortcut = "2";
    const {write} = useAccess("orders");
    const {id: currentUserId} = useSelector((state: RootState) => state.authentication.user);

    const isProvider = order.provider?._id === currentUserId;
    const canStart = isProvider && order.status === "accepted" && !!write;

    const triggerAction = () => {
        if (!canStart) return;
        onAction(actionKey);
    };
    useKeyboardShortcuts(shortcut, triggerAction);

    if (!canStart) {
        return null;
    }

    return (
        <DropdownMenuItem onClick={() => triggerAction()}>
            <IconPlayerPlay size={16} className="text-info" />
            <span className="text-info">{resolveLanguageKey("title")}</span>
            <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/orders/center/actions/startOrderDropdown.tsx"),
    withDebug(true, true, "orders"),
)(StartOrderDropdown);
