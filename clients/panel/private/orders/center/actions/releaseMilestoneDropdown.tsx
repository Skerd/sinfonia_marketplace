import {compose} from "redux";
import {useSelector} from "react-redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import type {Order} from "armonia/src/modules/marketplace/api/marketplace/private/order/order.dto.ts";
import {IconCoins} from "@tabler/icons-react";

type ReleaseMilestoneDropdownProps = WithLanguageType & {
    order: Order;
    onAction: (action: string) => void;
};

/** The customer releases a pending milestone of an in-progress order without an open dispute. */
function ReleaseMilestoneDropdown({order, onAction, resolveLanguageKey}: ReleaseMilestoneDropdownProps) {
    const {write} = useAccess("orders");
    const {id: currentUserId} = useSelector((state: RootState) => state.authentication.user);

    const isCustomer = order.customer?._id === currentUserId;
    const hasPending = (order.milestones ?? []).some((milestone) => milestone.status === "pending");
    const canRelease = isCustomer && order.status === "in_progress" && hasPending && !order.hasActiveDispute && !!write;

    if (!canRelease) {
        return null;
    }

    return (
        <DropdownMenuItem onClick={() => onAction("releaseMilestone")}>
            <IconCoins size={16} className="text-success" />
            <span className="text-success">{resolveLanguageKey("title")}</span>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/orders/center/actions/releaseMilestoneDropdown.tsx"),
    withDebug(true, true, "orders"),
)(ReleaseMilestoneDropdown);
