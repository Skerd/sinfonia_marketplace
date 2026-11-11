import {compose} from "redux";
import {useSelector} from "react-redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import type {Order} from "armonia/src/modules/marketplace/api/marketplace/private/order/order.dto.ts";
import {IconTimelineEvent} from "@tabler/icons-react";

type CreateMilestoneDropdownProps = WithLanguageType & {
    order: Order;
    onAction: (action: string) => void;
};

/** The customer of an accepted or in-progress order may split it into milestones. */
function CreateMilestoneDropdown({order, onAction, resolveLanguageKey}: CreateMilestoneDropdownProps) {
    const {write} = useAccess("orders");
    const {id: currentUserId} = useSelector((state: RootState) => state.authentication.user);

    const isCustomer = order.customer?._id === currentUserId;
    const canCreate = isCustomer && (order.status === "accepted" || order.status === "in_progress") && !!write;

    if (!canCreate) {
        return null;
    }

    return (
        <DropdownMenuItem onClick={() => onAction("createMilestone")}>
            <IconTimelineEvent size={16} className="text-primary" />
            <span>{resolveLanguageKey("title")}</span>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/orders/center/actions/createMilestoneDropdown.tsx"),
    withDebug(true, true, "orders"),
)(CreateMilestoneDropdown);
