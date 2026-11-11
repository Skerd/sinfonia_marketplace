import {compose} from "redux";
import {useSelector} from "react-redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {DropdownMenuItem, DropdownMenuShortcut} from "@coreModule/components/ui/dropdown-menu.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import {useKeyboardShortcuts} from "@coreModule/helpers/hooks/useKeyboardShortcut.ts";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import type {ProviderProfile} from "armonia/src/modules/marketplace/api/marketplace/private/providerProfile/providerProfile.dto.ts";
import {IconRefresh} from "@tabler/icons-react";

type RefreshAccountStatusDropdownProps = WithLanguageType & {
    profile: ProviderProfile;
    onAction: (action: string) => void;
};

function RefreshAccountStatusDropdown({profile, onAction, resolveLanguageKey}: RefreshAccountStatusDropdownProps) {
    const actionKey = "refreshAccountStatus";
    const shortcut = "2";
    const {write} = useAccess("providerProfiles");
    const {id: currentUserId} = useSelector((state: RootState) => state.authentication.user);

    const isOwner = profile.user?._id === currentUserId;
    const canShow = isOwner && !!profile.stripeAccountId && !!write && !profile.deletedAt;

    const triggerAction = () => {
        if (!canShow) return;
        onAction(actionKey);
    };
    useKeyboardShortcuts(shortcut, triggerAction);

    if (!canShow) {
        return null;
    }

    return (
        <DropdownMenuItem onClick={() => triggerAction()}>
            <IconRefresh size={16} className="text-info" />
            <span className="text-info">{resolveLanguageKey("title")}</span>
            <DropdownMenuShortcut>⌘{shortcut}</DropdownMenuShortcut>
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/providerProfile/center/actions/refreshAccountStatusDropdown.tsx"),
    withDebug(true, true, "providerProfiles"),
)(RefreshAccountStatusDropdown);
