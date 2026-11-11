import {compose} from "redux";
import {useEffect, useState} from "react";
import {useSelector} from "react-redux";
import {IconBuildingBank, IconPlus, IconRefresh} from "@tabler/icons-react";
import {toast} from "sonner";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import SimpleError from "@coreModule/components/custom/errors/errorViewWrapper.tsx";
import {ContentSection} from "@coreModule/clients/panel/private/accountSettings/components/content-section.tsx";
import type {TableResponse} from "armonia/src/modules/core/types/shared.types.ts";
import type {ProviderProfile} from "armonia/src/modules/marketplace/api/marketplace/private/providerProfile/providerProfile.dto.ts";
import ConnectAccountAction, {
    type ConnectActionKey,
} from "@marketplaceModule/components/custom/providerProfile/connectAccountAction.tsx";
import ProviderProfileSection, {type ProviderProfileSectionField} from "./providerProfileSection.tsx";

const PROFILES_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/providerProfile"};
const CREATE_PROFILE_REQUEST: HttpRequest = {method: "PUT", url: "/api/marketplace/providerProfile"};
const SECTIONS: ProviderProfileSectionField[] = ["bio", "skills", "timezone", "availability", "portfolio"];

type AccountProviderProfileProps = WithLanguageType & {
    specificUserId?: string;
};

/** Account settings tab: a user has one provider profile, shown as sections that are edited and saved one at a time. */
function AccountProviderProfile({resolveLanguageKey, specificUserId}: AccountProviderProfileProps) {
    const currentUserId = useSelector((state: RootState) => state.authentication.user.id);
    const ownerId = specificUserId || currentUserId;
    const [profileCount, setProfileCount] = useState(0);
    const [action, setAction] = useState<ConnectActionKey | "">("");
    const [createCount, setCreateCount] = useState(0);

    const reload = () => setProfileCount((n) => n + 1);
    useEffect(() => {
        if (ownerId) reload();
    }, [ownerId]);
    const profileRequest = useHttpRequest<TableResponse<ProviderProfile>>(
        PROFILES_REQUEST,
        {offset: 0, limit: 20, userId: ownerId},
        profileCount,
    );
    const profile = profileRequest.data?.data?.find((row) => !row.deletedAt) ?? null;
    // Waits for an owner, as before the first request.
    const loading = profileRequest.loading || profileCount === 0;
    const error = !!profileRequest.error;

    const {loading: creating} = useHttpRequest(CREATE_PROFILE_REQUEST, {userId: ownerId}, createCount, true, {
        success: reload,
        error: () => toast.error(String(resolveLanguageKey("empty.createFailed"))),
    });
    const createProfile = () => setCreateCount((n) => n + 1);

    // Stripe Connect onboarding always acts on the signed-in user's own profile.
    const isOwnProfile = !!profile && profile.user?._id === currentUserId;
    const connectStatus = profile?.stripePayoutsEnabled
        ? "connect.payoutsEnabled"
        : profile?.stripeAccountId
          ? "connect.setupIncomplete"
          : "connect.notConnected";

    return (
        <ContentSection title={resolveLanguageKey("title")} desc={resolveLanguageKey("description")}>
            <>
                {/* Refetches after a save keep the sections on screen; only the first load shows the loader. */}
                {loading && !profile ? (
                    <Loader />
                ) : error ? (
                    <SimpleError
                        title={resolveLanguageKey("failTitle")}
                        description={resolveLanguageKey("failDescription")}
                        onClick={reload}
                    />
                ) : profile ? (
                    <div className="flex flex-col gap-y-(--density-gap)">
                        {isOwnProfile && (
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/30 p-3">
                                <span
                                    className={cn(
                                        "text-sm font-medium",
                                        profile.stripePayoutsEnabled
                                            ? "text-success"
                                            : profile.stripeAccountId
                                              ? "text-warning"
                                              : "text-muted-foreground",
                                    )}
                                >
                                    {resolveLanguageKey(connectStatus)}
                                </span>
                                <div className="flex gap-2">
                                    {!profile.stripePayoutsEnabled && (
                                        <Button size="sm" onClick={() => setAction("createAccountLink")}>
                                            <IconBuildingBank size={16} />
                                            {resolveLanguageKey(profile.stripeAccountId ? "connect.continue" : "connect.start")}
                                        </Button>
                                    )}
                                    {!!profile.stripeAccountId && (
                                        <Button size="sm" variant="outline" onClick={() => setAction("refreshAccountStatus")}>
                                            <IconRefresh size={16} />
                                            {resolveLanguageKey("connect.refresh")}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                        {SECTIONS.map((field) => (
                            <ProviderProfileSection key={field} profile={profile} field={field} onSaved={reload} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border p-6">
                        <div>
                            <h4 className="text-sm font-medium">{resolveLanguageKey("empty.title")}</h4>
                            <p className="text-sm text-muted-foreground">{resolveLanguageKey("empty.description")}</p>
                        </div>
                        <Button size="sm" disabled={creating} onClick={createProfile}>
                            <IconPlus size={16} />
                            {resolveLanguageKey("empty.create")}
                        </Button>
                    </div>
                )}
                {!!action && (
                    <ConnectAccountAction
                        actionKey={action}
                        openAlert
                        url={`/api/marketplace/providerProfile/${action}`}
                        onSuccess={() => {
                            setAction("");
                            reload();
                        }}
                        onCancel={() => setAction("")}
                    />
                )}
            </>
        </ContentSection>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/providerProfile/accountProviderProfile.tsx"),
    withDebug(true, true, "providerProfiles"),
)(AccountProviderProfile);
