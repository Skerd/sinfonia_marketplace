import { compose } from "redux";
import { IconPlus } from "@tabler/icons-react";
import withLanguage, { WithLanguageType } from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import EntityListPage, {EntityListCreateButton, EntityListHeader} from "@coreModule/components/entityPage/pages/entityListPage.tsx";
import type { ProviderProfile } from "armonia/src/modules/marketplace/api/marketplace/private/providerProfile/providerProfile.dto.ts";
import ProviderProfileCard from "./center/cardView/providerProfileCard.tsx";
import type { DeletedData } from "armonia/src/modules/core/types/shared.types.ts";
import CreateAccountLinkDropdown from "./center/actions/createAccountLinkDropdown.tsx";
import RefreshAccountStatusDropdown from "./center/actions/refreshAccountStatusDropdown.tsx";
import ConnectAccountAction, {
    type ConnectActionKey,
} from "@marketplaceModule/components/custom/providerProfile/connectAccountAction.tsx";
import {getName} from "@coreModule/helpers/general/names.ts";

const PROVIDER_PROFILE_FORM_BASE = "/tenancy/systemSettings/providerprofiles";

function buildProfileEditPath(profile: ProviderProfile) {
    const params = new URLSearchParams();
    params.set("profileId", profile._id);
    const name = getName(profile.user);
    if (name) params.set("profileName", name);
    return `${PROVIDER_PROFILE_FORM_BASE}/edit?${params.toString()}`;
}

function profileDisplayName(profile: ProviderProfile) {
    return getName(profile.user) || undefined;
}

function applyConnectPatch(result: {
    stripeAccountId?: string;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    detailsSubmitted?: boolean;
}): Partial<ProviderProfile> {
    return {
        ...(result.stripeAccountId ? {stripeAccountId: result.stripeAccountId} : {}),
        ...(result.chargesEnabled !== undefined ? {stripeChargesEnabled: result.chargesEnabled} : {}),
        ...(result.payoutsEnabled !== undefined ? {stripePayoutsEnabled: result.payoutsEnabled} : {}),
        ...(result.detailsSubmitted !== undefined ? {stripeDetailsSubmitted: result.detailsSubmitted} : {}),
        stripeAccountSyncedAt: new Date().toISOString(),
    };
}

function AllProviderProfiles({ resolveLanguageKey }: WithLanguageType) {
    return (
        <EntityListPage<ProviderProfile>
            apiUrl="/api/marketplace/providerProfile"
            collectionName="providerProfiles"
            accessModel="providerProfiles"
            tableConfigKey="providerprofiles"
            header={(ctx) => (
                <EntityListHeader ctx={ctx}>
                    <EntityListCreateButton
                        ctx={ctx}
                        path={`${PROVIDER_PROFILE_FORM_BASE}/create`}
                        icon={<IconPlus />}
                        labelKey="createProviderProfile"
                    />
                </EntityListHeader>
            )}
            buildEditPath={buildProfileEditPath}
            resolveLanguageKey={resolveLanguageKey}
            sheetLanguagePath="src/modules/marketplace/clients/panel/private/providerProfile/center/sheetView/providerProfileSheetView.tsx"
            rowActionMenu={{ hideDelete: true, allowMenuForCustomChildren: true }}
            renderActionMenuChildren={(profile, bindRowAction) => (
                <>
                    <CreateAccountLinkDropdown profile={profile} onAction={bindRowAction} />
                    <RefreshAccountStatusDropdown profile={profile} onAction={bindRowAction} />
                </>
            )}
            renderFloatingModals={({action, entity, resetAction, listRef}) => {
                if (action !== "createAccountLink" && action !== "refreshAccountStatus") return null;
                return (
                    <ConnectAccountAction
                        actionKey={action as ConnectActionKey}
                        displayName={profileDisplayName(entity)}
                        openAlert
                        url={`/api/marketplace/providerProfile/${action}`}
                        onSuccess={(result: {
                            stripeAccountId?: string;
                            chargesEnabled?: boolean;
                            payoutsEnabled?: boolean;
                            detailsSubmitted?: boolean;
                        }) => {
                            listRef.current?.updateRow?.(entity._id, applyConnectPatch(result));
                            resetAction();
                        }}
                        onCancel={resetAction}
                    />
                );
            }}
            renderCard={(profile, onDelete, onRestore) => (
                <ProviderProfileCard
                    profile={profile}
                    onDelete={(p: ProviderProfile | undefined, response?: DeletedData) => onDelete(p ?? profile, response)}
                    onRestore={() => onRestore(profile)}
                />
            )}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/providerProfile/index.tsx"),
    withDebug(true, true, "providerProfiles"),
)(AllProviderProfiles);
