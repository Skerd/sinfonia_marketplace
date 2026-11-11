import withLanguage, {type ResolveLanguageKey, type ResolveLanguageKeyImpl, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {type ComponentType, useEffect, useImperativeHandle, useMemo, useState} from "react";
import {IconBell, IconLoader2} from "@tabler/icons-react";
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

const actionKey = "notifyAll" as const;

function bindActionAxiosLanguageKey(resolveLanguageKey: ResolveLanguageKey): ResolveLanguageKeyImpl {
    return (key, returnUndefinedIfNeeded = false) => {
        if (key.startsWith("axios.")) {
            return resolveLanguageKey(`${actionKey}.${key}`, returnUndefinedIfNeeded);
        }
        return resolveLanguageKey(key, returnUndefinedIfNeeded);
    };
}

type TaskRequestNotifyAllConfirmActionPublicProps = {
    taskRequestId: string;
    displayName?: string;
    openAlert?: boolean;
    url?: string;
    resolveLanguageKey: ResolveLanguageKey;
    onSuccess?: () => void;
    onCancel?: () => void;
};

type TaskRequestNotifyAllConfirmActionProps = WithAxiosType<ActionMessage> &
    TaskRequestNotifyAllConfirmActionPublicProps;

function TaskRequestNotifyAllConfirmAction({
    taskRequestId,
    displayName,
    openAlert,
    resolveLanguageKey,
    innerRef,
    onFilterChange,
    onSuccess = () => {},
    onCancel = () => {},
    loading,
    error,
}: TaskRequestNotifyAllConfirmActionProps) {
    const {write} = useAccess("taskRequests");
    const [open, setOpen] = useState<boolean>(!!openAlert);

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
        if (!open) onCancel();
    }, [open, onCancel]);

    if (!write) return <HiddenElement />;

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
                            onFilterChange({_id: taskRequestId});
                        }}
                    >
                        {loading ? (
                            <IconLoader2 className="size-4 animate-spin" />
                        ) : (
                            <>
                                <IconBell className="size-4" />
                                {resolveLanguageKey(`${actionKey}.confirm`)}
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

const TaskRequestNotifyAllConfirmActionWithAxios = compose(
    withAxios<ActionMessage, {_id: string}>(
        {
            method: "POST",
            url: "toBeDeterminedByProp",
            data: {},
        },
        true,
    ),
    withDebug(true, true, "taskRequests"),
)(TaskRequestNotifyAllConfirmAction) as ComponentType<TaskRequestNotifyAllConfirmActionPublicProps>;

type TaskRequestNotifyAllConfirmActionShellProps = WithLanguageType &
    Omit<TaskRequestNotifyAllConfirmActionPublicProps, "resolveLanguageKey">;

function TaskRequestNotifyAllConfirmActionShell({
    resolveLanguageKey,
    ...rest
}: TaskRequestNotifyAllConfirmActionShellProps) {
    const boundResolveLanguageKey = useMemo(
        () => bindActionAxiosLanguageKey(resolveLanguageKey),
        [resolveLanguageKey],
    );

    return (
        <TaskRequestNotifyAllConfirmActionWithAxios
            {...rest}
            resolveLanguageKey={boundResolveLanguageKey}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/components/custom/taskRequests/taskRequestNotifyAllConfirmAction.tsx"),
    withDebug(true, true, "taskRequests"),
)(TaskRequestNotifyAllConfirmActionShell);
