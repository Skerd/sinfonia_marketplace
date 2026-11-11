import withLanguage, {type ResolveLanguageKey, type ResolveLanguageKeyImpl, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {type ComponentType, useEffect, useImperativeHandle, useMemo, useState} from "react";
import {IconBuildingBank, IconLoader2, IconRefresh} from "@tabler/icons-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@coreModule/components/ui/alert-dialog.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {ActionMessage} from "armonia/src/modules/core/types/shared.types.ts";
import {Alert, AlertDescription} from "@coreModule/components/ui/alert.tsx";

export type ConnectActionKey = "createAccountLink" | "refreshAccountStatus";

type ConnectAccountResponse = ActionMessage & {
    url?: string;
    stripeAccountId?: string;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    detailsSubmitted?: boolean;
};

function bindActionAxiosLanguageKey(
    actionKey: ConnectActionKey,
    resolveLanguageKey: ResolveLanguageKey,
): ResolveLanguageKeyImpl {
    return (key, returnUndefinedIfNeeded = false) => {
        if (key.startsWith("axios.")) {
            return resolveLanguageKey(`${actionKey}.${key}`, returnUndefinedIfNeeded);
        }
        if (key === "title" || key === "description" || key === "confirm") {
            return resolveLanguageKey(`${actionKey}.${key}`, returnUndefinedIfNeeded);
        }
        return resolveLanguageKey(key, returnUndefinedIfNeeded);
    };
}

type ConnectAccountActionPublicProps = {
    actionKey: ConnectActionKey;
    displayName?: string;
    openAlert?: boolean;
    url?: string;
    resolveLanguageKey: ResolveLanguageKey;
    onSuccess?: (result: ConnectAccountResponse) => void;
    onCancel?: () => void;
};

type ConnectAccountActionProps = WithAxiosType<ConnectAccountResponse> & ConnectAccountActionPublicProps;

function ConnectAccountAction({
    actionKey,
    displayName,
    openAlert,
    resolveLanguageKey,
    innerRef,
    onFilterChange,
    onSuccess = () => {},
    onCancel = () => {},
    loading,
    error,
}: ConnectAccountActionProps) {
    const {write} = useAccess("providerProfiles");
    const [open, setOpen] = useState<boolean>(!!openAlert);

    useImperativeHandle(innerRef, () => ({
        success: (data: ConnectAccountResponse) => {
            setOpen(false);
            if (actionKey === "createAccountLink" && data?.url) {
                window.open(data.url, "_blank", "noopener,noreferrer");
            }
            onSuccess(data ?? {});
        },
    }));

    useEffect(() => {
        if (!write) return;
        setOpen(!!openAlert);
    }, [openAlert, write]);

    useEffect(() => {
        if (!open) onCancel();
    }, [open, onCancel]);

    if (!write) return <HiddenElement />;

    const ActionIcon = actionKey === "createAccountLink" ? IconBuildingBank : IconRefresh;
    const iconClass = actionKey === "createAccountLink" ? "text-primary" : "text-info";

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {resolveLanguageKey("title")}
                        {displayName ? ` — ${displayName}` : ""}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {resolveLanguageKey("description")}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {error ? (
                    <Alert variant="destructive">
                        <AlertDescription>{error.message}</AlertDescription>
                    </Alert>
                ) : null}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>{resolveLanguageKey("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={loading}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onFilterChange({} as Record<string, never>);
                        }}
                    >
                        {loading ? (
                            <IconLoader2 className="size-4 animate-spin" />
                        ) : (
                            <ActionIcon size={16} className={iconClass} />
                        )}
                        {resolveLanguageKey("confirm")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

const ConnectAccountActionWithAxios = compose(
    withAxios<ConnectAccountResponse, Record<string, never>>(
        {
            method: "POST",
            url: "toBeDeterminedByProp",
            data: {},
        },
        true,
    ),
    withDebug(true, true, "providerProfiles"),
)(ConnectAccountAction) as ComponentType<ConnectAccountActionPublicProps>;

type ConnectAccountActionShellProps = WithLanguageType &
    Omit<ConnectAccountActionPublicProps, "resolveLanguageKey">;

function ConnectAccountActionShell({resolveLanguageKey, actionKey, ...rest}: ConnectAccountActionShellProps) {
    const boundResolveLanguageKey = useMemo(
        () => bindActionAxiosLanguageKey(actionKey, resolveLanguageKey),
        [actionKey, resolveLanguageKey],
    );

    return (
        <ConnectAccountActionWithAxios
            {...rest}
            actionKey={actionKey}
            resolveLanguageKey={boundResolveLanguageKey}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/components/custom/providerProfile/connectAccountAction.tsx"),
    withDebug(true, true, "providerProfiles"),
)(ConnectAccountActionShell);
