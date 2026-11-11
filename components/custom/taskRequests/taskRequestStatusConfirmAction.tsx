import withLanguage, {type ResolveLanguageKey, type ResolveLanguageKeyImpl, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {type ComponentType, useEffect, useImperativeHandle, useMemo, useState} from "react";
import {IconLoader2} from "@tabler/icons-react";
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
import type {TaskRequestStatus} from "armonia/src/modules/marketplace/api/marketplace/private/taskRequest/taskRequest.schema-def.ts";
import {Alert, AlertDescription} from "@coreModule/components/ui/alert.tsx";

function bindActionAxiosLanguageKey(actionKey: "close" | "reopen", resolveLanguageKey: ResolveLanguageKey,): ResolveLanguageKeyImpl {
    return (key, returnUndefinedIfNeeded = false) => {
        if (key.startsWith("axios.")) {
            return resolveLanguageKey(`${actionKey}.${key}`, returnUndefinedIfNeeded);
        }
        return resolveLanguageKey(key, returnUndefinedIfNeeded);
    };
}

type TaskRequestStatusConfirmActionPublicProps = {
    taskRequestId: string;
    displayName?: string;
    actionKey: "close" | "reopen";
    openAlert?: boolean;
    url?: string;
    resolveLanguageKey: ResolveLanguageKey;
    onSuccess?: (newStatus: TaskRequestStatus) => void;
    onCancel?: () => void;
};

type TaskRequestStatusConfirmActionProps = WithAxiosType<ActionMessage> &
    TaskRequestStatusConfirmActionPublicProps;

function TaskRequestStatusConfirmAction({
    taskRequestId,
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
}: TaskRequestStatusConfirmActionProps) {
    const {write} = useAccess("taskRequests");
    const [open, setOpen] = useState<boolean>(!!openAlert);

    const newStatus: TaskRequestStatus = actionKey === "close" ? "closed" : "open";

    useImperativeHandle(innerRef, () => ({
        success: () => {
            setOpen(false);
            onSuccess(newStatus);
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
                            resolveLanguageKey(`${actionKey}.confirm`)
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

const TaskRequestStatusConfirmActionWithAxios = compose(
    withAxios<ActionMessage, {_id: string}>(
        {
            method: "POST",
            url: "toBeDeterminedByProp",
            data: {},
        },
        true,
    ),
    withDebug(true, true, "taskRequests"),
)(TaskRequestStatusConfirmAction) as ComponentType<TaskRequestStatusConfirmActionPublicProps>;

type TaskRequestStatusConfirmActionShellProps = WithLanguageType &
    Omit<TaskRequestStatusConfirmActionPublicProps, "resolveLanguageKey">;

function TaskRequestStatusConfirmActionShell({
    resolveLanguageKey,
    actionKey,
    ...rest
}: TaskRequestStatusConfirmActionShellProps) {

    const boundResolveLanguageKey = useMemo(() => bindActionAxiosLanguageKey(actionKey, resolveLanguageKey), [actionKey, resolveLanguageKey],);

    return (
        <TaskRequestStatusConfirmActionWithAxios
            {...rest}
            actionKey={actionKey}
            resolveLanguageKey={boundResolveLanguageKey}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/components/custom/taskRequests/taskRequestStatusConfirmAction.tsx"),
    withDebug(true, true, "taskRequests"),
)(TaskRequestStatusConfirmActionShell);
