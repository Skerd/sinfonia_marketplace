import {compose} from "redux";
import {useSelector} from "react-redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import type {Listing} from "armonia/src/modules/marketplace/api/marketplace/private/listing/listing.dto.ts";
import {IconShoppingCart} from "@tabler/icons-react";

type CreateOrderFromListingDropdownProps = WithLanguageType & {
    listing: Listing;
    onAction: (action: string) => void;
};

function CreateOrderFromListingDropdown({listing, onAction, resolveLanguageKey}: CreateOrderFromListingDropdownProps) {
    const {write} = useAccess("orders");
    const {id: currentUserId} = useSelector((state: RootState) => state.authentication.user);

    const isProvider = listing.provider?._id === currentUserId;
    const canOrder = !isProvider && listing.status === "active" && !listing.deletedAt && !!write;

    if (!canOrder) {
        return null;
    }

    return (
        <DropdownMenuItem onClick={() => onAction("createOrderFromListing")}>
            <IconShoppingCart size={16} className="text-info" />
            <span className="text-info">{resolveLanguageKey("title")}</span>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/listings/center/actions/createOrderFromListingDropdown.tsx"),
    withDebug(true, true, "orders"),
)(CreateOrderFromListingDropdown);
