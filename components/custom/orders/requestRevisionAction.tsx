import withLanguage, {type ResolveLanguageKey, type ResolveLanguageKeyImpl, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {type ComponentType, useEffect, useImperativeHandle, useMemo, useState} from "react";
import {IconLoader2, IconRotate} from "@tabler/icons-react";
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
import {Label} from "@coreModule/components/ui/label.tsx";
import {Textarea} from "@coreModule/components/ui/textarea.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {ActionMessage} from "armonia/src/modules/core/types/shared.types.ts";
import type {RequestRevisionFormType} from "armonia/src/modules/marketplace/api/marketplace/private/order/requestRevision.form.validator.ts";
import {Alert, AlertDescription} from "@coreModule/components/ui/alert.tsx";

function bindRequestRevisionAxiosLanguageKey(resolveLanguageKey: ResolveLanguageKey): ResolveLanguageKeyImpl {
    return (key, returnUndefinedIfNeeded = false) => {
        if (key.startsWith("axios.")) {
            return resolveLanguageKey(`requestRevision.${key}`, returnUndefinedIfNeeded);
        }
        return resolveLanguageKey(key, returnUndefinedIfNeeded);
    };
}

type RequestRevisionActionPublicProps = {
    orderId: string;
    displayName?: string;
    openAlert?: boolean;
    url?: string;
    resolveLanguageKey: ResolveLanguageKey;
    onSuccess?: () => void;
    onCancel?: () => void;
};

type RequestRevisionActionProps = WithAxiosType<ActionMessage, RequestRevisionFormType> &
    RequestRevisionActionPublicProps;

function RequestRevisionAction({
    orderId,
    displayName,
    openAlert,
    resolveLanguageKey,
    innerRef,
    onFilterChange,
    onSuccess = () => {},
    onCancel = () => {},
    loading,
    error,
}: RequestRevisionActionProps) {
    const {write} = useAccess("orders");
    const [open, setOpen] = useState<boolean>(!!openAlert);
    const [reason, setReason] = useState("");

    useImperativeHandle(innerRef, () => ({
        success: () => {
            setOpen(false);
            onSuccess();
        },
    }));

    useEffect(() => {
        if (!write) return;
        setOpen(!!openAlert);
    }, [openAlert, write]);

    useEffect(() => {
        if (open) setReason("");
    }, [open]);

    useEffect(() => {
        if (!open) onCancel();
    }, [open, onCancel]);

    if (!write) return <HiddenElement />;

    const canSubmit = reason.trim().length >= 10;

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {resolveLanguageKey("requestRevision.title")}
                        {displayName ? ` — ${displayName}` : ""}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {resolveLanguageKey("requestRevision.description")}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex flex-col py-4 gap-y-2">
                    <Label htmlFor="revisionReason">{resolveLanguageKey("requestRevision.reasonLabel")}</Label>
                    <Textarea
                        id="revisionReason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={resolveLanguageKey("requestRevision.reasonPlaceholder")}
                        disabled={loading}
                        className="min-h-[120px]"
                    />
                    <p className="text-xs text-muted-foreground">
                        {resolveLanguageKey("requestRevision.minChars")}
                    </p>
                </div>
                {error ? (
                    <Alert variant="destructive">
                        <AlertDescription>{error.message}</AlertDescription>
                    </Alert>
                ) : null}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>{resolveLanguageKey("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={loading || !canSubmit}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onFilterChange({
                                _id: orderId,
                                reason: reason.trim(),
                            });
                        }}
                    >
                        {loading ? (
                            <IconLoader2 className="size-4 animate-spin" />
                        ) : (
                            <IconRotate size={16} className="text-warning" />
                        )}
                        {resolveLanguageKey("requestRevision.confirm")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

const RequestRevisionActionWithAxios = compose(
    withAxios<ActionMessage, RequestRevisionFormType>(
        {
            method: "POST",
            url: "toBeDeterminedByProp",
            data: {},
        },
        true,
    ),
    withDebug(true, true, "orders"),
)(RequestRevisionAction) as ComponentType<RequestRevisionActionPublicProps>;

type RequestRevisionActionShellProps = WithLanguageType &
    Omit<RequestRevisionActionPublicProps, "resolveLanguageKey">;

function RequestRevisionActionShell({resolveLanguageKey, ...rest}: RequestRevisionActionShellProps) {
    const boundResolveLanguageKey = useMemo(
        () => bindRequestRevisionAxiosLanguageKey(resolveLanguageKey),
        [resolveLanguageKey],
    );

    return (
        <RequestRevisionActionWithAxios
            {...rest}
            resolveLanguageKey={boundResolveLanguageKey}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/components/custom/orders/requestRevisionAction.tsx"),
    withDebug(true, true, "orders"),
)(RequestRevisionActionShell);
