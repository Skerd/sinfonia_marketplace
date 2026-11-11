import {compose} from "redux";
import {useSelector} from "react-redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import type {Order} from "armonia/src/modules/marketplace/api/marketplace/private/order/order.dto.ts";
import {IconPackageImport} from "@tabler/icons-react";

type SubmitOrderDeliveryDropdownProps = WithLanguageType & {
    order: Order;
    onAction: (action: string) => void;
};

function SubmitOrderDeliveryDropdown({order, onAction, resolveLanguageKey}: SubmitOrderDeliveryDropdownProps) {
    const actionKey = "submitDelivery";
    const shortcut = "5";
    const {write} = useAccess("orders");
    const {id: currentUserId} = useSelector((state: RootState) => state.authentication.user);

    const isProvider = order.provider?._id === currentUserId;
    const canSubmit = isProvider && order.status === "in_progress" && !order.deliverySubmitted && !!write;

    const triggerAction = () => {
        if (!canSubmit) return;
        onAction(actionKey);
    };
    useKeyboardShortcuts(shortcut, triggerAction);

    if (!canSubmit) {
        return null;
    }

    return (
        <DropdownMenuItem onClick={() => triggerAction()}>
            <IconPackageImport size={16} className="text-success" />
            <span className="text-success">{resolveLanguageKey("title")}</span>
            <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/orders/center/actions/submitOrderDeliveryDropdown.tsx"),
    withDebug(true, true, "orders"),
)(SubmitOrderDeliveryDropdown);
