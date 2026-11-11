import withLanguage, {type ResolveLanguageKey, type ResolveLanguageKeyImpl, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {type ComponentType, useEffect, useImperativeHandle, useMemo, useState} from "react";
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
import type {Bid} from "armonia/src/modules/marketplace/api/marketplace/private/bid/bid.dto.ts";
import {Alert, AlertDescription} from "@coreModule/components/ui/alert.tsx";

function bindActionAxiosLanguageKey(
    actionKey: "accept" | "reject",
    resolveLanguageKey: ResolveLanguageKey,
): ResolveLanguageKeyImpl {
    return (key, returnUndefinedIfNeeded = false) => {
        if (key.startsWith("axios.")) {
            return resolveLanguageKey(`${actionKey}.${key}`, returnUndefinedIfNeeded);
        }
        return resolveLanguageKey(key, returnUndefinedIfNeeded);
    };
}

type BidActionConfirmActionPublicProps = {
    bidId: string;
    displayName?: string;
    actionKey: "accept" | "reject";
    openAlert?: boolean;
    url?: string;
    resolveLanguageKey: ResolveLanguageKey;
    onSuccess?: (bid: Bid) => void;
    onCancel?: () => void;
};

type BidActionConfirmActionProps = WithAxiosType<Bid> & BidActionConfirmActionPublicProps;

function BidActionConfirmAction({
    bidId,
    displayName,
    actionKey,
    openAlert,
    resolveLanguageKey,
    innerRef,
    onFilterChange,
    onSuccess = () => {},
    onCancel = () => {},
    loading,
    error,
}: BidActionConfirmActionProps) {
    const {write} = useAccess("marketplacebids");
    const [open, setOpen] = useState<boolean>(!!openAlert);

    useImperativeHandle(innerRef, () => ({
        success: (responseData?: Bid) => {
            setOpen(false);
            if (responseData?._id) {
                onSuccess(responseData);
            } else {
                onSuccess({...({_id: bidId, status: (actionKey === "accept" ? "accepted" : "rejected")})} as Bid);
            }
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

    const isAccept = actionKey === "accept";

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {resolveLanguageKey(`${actionKey}.title`)}
                        {displayName ? ` — ${displayName}` : ""}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {resolveLanguageKey(`${actionKey}.description`)}
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
                            onFilterChange({_id: bidId});
                        }}
                    >
                        {loading ? (
                            <IconLoader2 className="size-4 animate-spin" />
                        ) : isAccept ? (
                            <IconCircleCheck size={16} className="text-success" />
                        ) : (
                            <IconCircleX size={16} className="text-destructive" />
                        )}
                        {resolveLanguageKey(`${actionKey}.confirm`)}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

const BidActionConfirmActionWithAxios = compose(
    withAxios<Bid, {_id: string}>(
        {
            method: "POST",
            url: "toBeDeterminedByProp",
            data: {},
        },
        true,
    ),
    withDebug(true, true, "marketplacebids"),
)(BidActionConfirmAction) as ComponentType<BidActionConfirmActionPublicProps>;

type BidActionConfirmActionShellProps = WithLanguageType &
    Omit<BidActionConfirmActionPublicProps, "resolveLanguageKey">;

function BidActionConfirmActionShell({resolveLanguageKey, actionKey, ...rest}: BidActionConfirmActionShellProps) {
    const boundResolveLanguageKey = useMemo(
        () => bindActionAxiosLanguageKey(actionKey, resolveLanguageKey),
        [actionKey, resolveLanguageKey],
    );

    return (
        <BidActionConfirmActionWithAxios
            {...rest}
            actionKey={actionKey}
            resolveLanguageKey={boundResolveLanguageKey}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/components/custom/bids/bidActionConfirmAction.tsx"),
    withDebug(true, true, "marketplacebids"),
)(BidActionConfirmActionShell);
