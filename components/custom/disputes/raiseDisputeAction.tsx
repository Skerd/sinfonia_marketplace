import withLanguage, {type ResolveLanguageKey, type ResolveLanguageKeyImpl, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {type ComponentType, useEffect, useImperativeHandle, useMemo, useState} from "react";
import {IconAlertTriangle, IconLoader2} from "@tabler/icons-react";
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
import {Alert, AlertDescription} from "@coreModule/components/ui/alert.tsx";

function bindRaiseDisputeLanguageKey(resolveLanguageKey: ResolveLanguageKey): ResolveLanguageKeyImpl {
    return (key, returnUndefinedIfNeeded = false) => {
        if (key.startsWith("axios.")) {
            return resolveLanguageKey(`raise.${key}`, returnUndefinedIfNeeded);
        }
        return resolveLanguageKey(key, returnUndefinedIfNeeded);
    };
}

type RaisePayload = {
    order: string;
    reason: string;
};

type RaiseDisputeActionPublicProps = {
    orderId: string;
    displayName?: string;
    openAlert?: boolean;
    url?: string;
    resolveLanguageKey: ResolveLanguageKey;
    onSuccess?: () => void;
    onCancel?: () => void;
};

type RaiseDisputeActionProps = WithAxiosType<unknown, RaisePayload> & RaiseDisputeActionPublicProps;

function RaiseDisputeAction({
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
}: RaiseDisputeActionProps) {
    const {create} = useAccess("disputes");
    const [open, setOpen] = useState<boolean>(!!openAlert);
    const [reason, setReason] = useState("");

    useImperativeHandle(innerRef, () => ({
        success: () => {
            setOpen(false);
            setReason("");
            onSuccess();
        },
    }));

    useEffect(() => {
        if (!create) return;
        setOpen(!!openAlert);
    }, [openAlert, create]);

    useEffect(() => {
        if (open) setReason("");
    }, [open]);

    useEffect(() => {
        if (!open) onCancel();
    }, [open, onCancel]);

    if (!create) return <HiddenElement />;

    const reasonTrimmed = reason.trim();
    const submitBlocked = reasonTrimmed.length === 0 || loading;

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {resolveLanguageKey("raise.title")}
                        {displayName ? ` — ${displayName}` : ""}
                    </AlertDialogTitle>
                    <AlertDialogDescription>{resolveLanguageKey("raise.description")}</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex flex-col gap-y-2 py-4">
                    <Label htmlFor="raise-dispute-reason">{resolveLanguageKey("raise.reasonLabel")}</Label>
                    <Textarea
                        id="raise-dispute-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={resolveLanguageKey("raise.reasonPlaceholder")}
                        disabled={loading}
                        className="min-h-[100px]"
                        maxLength={2000}
                    />
                </div>
                {error ? (
                    <Alert variant="destructive">
                        <AlertDescription>{error.message}</AlertDescription>
                    </Alert>
                ) : null}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>{resolveLanguageKey("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={submitBlocked}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (submitBlocked) return;
                            onFilterChange({order: orderId, reason: reasonTrimmed});
                        }}
                    >
                        {loading ? (
                            <IconLoader2 className="size-4 animate-spin" />
                        ) : (
                            <IconAlertTriangle size={16} className="text-warning" />
                        )}
                        {resolveLanguageKey("raise.confirm")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

const RaiseDisputeActionWithAxios = compose(
    withAxios<unknown, RaisePayload>(
        {
            method: "PUT",
            url: "toBeDeterminedByProp",
            data: {},
        },
        true,
    ),
    withDebug(true, true, "disputes"),
)(RaiseDisputeAction) as ComponentType<RaiseDisputeActionPublicProps>;

type RaiseDisputeActionShellProps = WithLanguageType & Omit<RaiseDisputeActionPublicProps, "resolveLanguageKey">;

function RaiseDisputeActionShell({resolveLanguageKey, ...rest}: RaiseDisputeActionShellProps) {
    const bound = useMemo(() => bindRaiseDisputeLanguageKey(resolveLanguageKey), [resolveLanguageKey]);
    return <RaiseDisputeActionWithAxios {...rest} resolveLanguageKey={bound} />;
}

export default compose(
    withLanguage("src/modules/marketplace/components/custom/disputes/raiseDisputeAction.tsx"),
    withDebug(true, true, "disputes"),
)(RaiseDisputeActionShell);
