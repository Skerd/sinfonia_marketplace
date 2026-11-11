import withLanguage, {type ResolveLanguageKey, type ResolveLanguageKeyImpl, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {type ComponentType, useEffect, useImperativeHandle, useMemo, useRef, useState} from "react";
import {IconCircleCheck, IconCircleX, IconLoader2} from "@tabler/icons-react";
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

function bindActionAxiosLanguageKey(
    actionKey: "activate" | "deactivate",
    resolveLanguageKey: ResolveLanguageKey,
): ResolveLanguageKeyImpl {
    return (key, returnUndefinedIfNeeded = false) => {
        if (key.startsWith("axios.")) {
            return resolveLanguageKey(`${actionKey}.${key}`, returnUndefinedIfNeeded);
        }
        return resolveLanguageKey(key, returnUndefinedIfNeeded);
    };
}

type ChangeListingStatusActionProps = WithAxiosType<ActionMessage> & {
    listingId: string;
    listingTitle?: string;
    targetStatus: "active" | "inactive";
    openAlert?: boolean;
    resolveLanguageKey: ResolveLanguageKey;
    onSuccess?: (targetStatus: "active" | "inactive") => void;
    onCancel?: () => void;
};

function ChangeListingStatusAction({
    listingId,
    listingTitle,
    targetStatus,
    openAlert,
    resolveLanguageKey,
    innerRef,
    onFilterChange,
    onSuccess = () => {},
    onCancel = () => {},
    loading,
    error,
}: ChangeListingStatusActionProps) {
    const {write} = useAccess("listings");
    /**
     * Start closed and open on the next macrotask. Opening an AlertDialog in the same turn as a
     * DropdownMenuItem select races Radix RemoveScroll / body `pointer-events`, which flashes the page.
     * Same deferral pattern as apiSelect → create dialog (`queueMicrotask`).
     */
    const [open, setOpen] = useState(false);
    const hasBeenOpenRef = useRef(false);

    useImperativeHandle(innerRef, () => ({
        success: () => {
            setOpen(false);
            onSuccess(targetStatus);
        },
    }));

    useEffect(() => {
        if (!write || !openAlert) {
            setOpen(false);
            return;
        }
        const timer = window.setTimeout(() => setOpen(true), 0);
        return () => window.clearTimeout(timer);
    }, [openAlert, write]);

    useEffect(() => {
        if (open) {
            hasBeenOpenRef.current = true;
            return;
        }
        // Skip the initial closed frame before the deferred open — that is not a user cancel.
        if (hasBeenOpenRef.current) onCancel();
    }, [open]);

    if (!write) return <HiddenElement />;

    const isActivate = targetStatus === "active";
    const actionKey = isActivate ? "activate" : "deactivate";

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {resolveLanguageKey(`${actionKey}.title`)}
                        {listingTitle ? ` '${listingTitle}'` : ""}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {resolveLanguageKey(`${actionKey}.description`)}
                        {listingTitle ? ` '${listingTitle}'` : ""}?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {error ? (
                    <Alert variant="destructive">
                        <AlertDescription>{error.message}</AlertDescription>
                    </Alert>
                ) : null}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>
                        {resolveLanguageKey("cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onFilterChange({_id: listingId});
                        }}
                        disabled={loading}
                    >
                        {loading ? (
                            <IconLoader2 className="animate-spin" />
                        ) : isActivate ? (
                            <IconCircleCheck size={16} />
                        ) : (
                            <IconCircleX size={16} />
                        )}
                        {resolveLanguageKey(`${actionKey}.confirm`)}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

const ChangeListingStatusActionWithAxios = compose(
    withAxios(
        {
            method: "POST",
            url: "toBeDeterminedByProp",
            data: {},
        },
        true,
    ),
    withDebug(true, true, "listings"),
)(ChangeListingStatusAction) as ComponentType<ChangeListingStatusActionShellProps>;

type ChangeListingStatusActionShellProps = WithLanguageType & {
    listingId: string;
    listingTitle?: string;
    targetStatus: "active" | "inactive";
    openAlert?: boolean;
    url?: string;
    onSuccess?: (targetStatus: "active" | "inactive") => void;
    onCancel?: () => void;
};

function ChangeListingStatusActionShell({
    resolveLanguageKey,
    targetStatus,
    ...rest
}: ChangeListingStatusActionShellProps) {
    const actionKey = targetStatus === "active" ? "activate" : "deactivate";
    const boundResolveLanguageKey = useMemo(
        () => bindActionAxiosLanguageKey(actionKey, resolveLanguageKey),
        [actionKey, resolveLanguageKey],
    );

    return (
        <ChangeListingStatusActionWithAxios
            {...rest}
            targetStatus={targetStatus}
            resolveLanguageKey={boundResolveLanguageKey}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/components/custom/listings/changeListingStatusAction.tsx"),
)(ChangeListingStatusActionShell);
