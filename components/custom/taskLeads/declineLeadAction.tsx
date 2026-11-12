import withLanguage, {type ResolveLanguageKey, type ResolveLanguageKeyImpl, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {type ComponentType, useEffect, useImperativeHandle, useMemo, useState} from "react";
import {IconCircleX, IconLoader2} from "@tabler/icons-react";
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
import {Alert, AlertDescription} from "@coreModule/components/ui/alert.tsx";
import type {ActionMessage} from "armonia/src/modules/core/types/shared.types.ts";
import type {TaskLead} from "armonia/src/modules/marketplace/api/marketplace/private/taskLead/taskLead.dto.ts";

function bindDeclineAxiosLanguageKey(resolveLanguageKey: ResolveLanguageKey): ResolveLanguageKeyImpl {
    return (key, returnUndefinedIfNeeded = false) =>
        resolveLanguageKey(key.startsWith("axios.") ? `decline.${key}` : key, returnUndefinedIfNeeded);
}

type DeclineLeadActionPublicProps = {
    lead: TaskLead;
    openAlert?: boolean;
    url?: string;
    resolveLanguageKey: ResolveLanguageKey;
    onSuccess?: (patch: Partial<TaskLead>) => void;
    onCancel?: () => void;
};

type DeclineLeadActionProps = WithAxiosType<ActionMessage> & DeclineLeadActionPublicProps;

/** The provider passes on a lead (D143); the buyer is not told. */
function DeclineLeadAction({lead, openAlert, resolveLanguageKey, innerRef, onFilterChange, onSuccess = () => {}, onCancel = () => {}, loading, error}: DeclineLeadActionProps) {
    const [open, setOpen] = useState<boolean>(!!openAlert);

    useImperativeHandle(innerRef, () => ({
        success: () => {
            setOpen(false);
            onSuccess({status: "declined"});
        },
    }));

    useEffect(() => setOpen(!!openAlert), [openAlert]);
    useEffect(() => {
        if (!open) onCancel();
    }, [open, onCancel]);

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>{resolveLanguageKey("decline.title")}{lead.taskRequest?.title ? ` — ${lead.taskRequest.title}` : ""}</AlertDialogTitle>
                    <AlertDialogDescription>{resolveLanguageKey("decline.description")}</AlertDialogDescription>
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
                            onFilterChange({_id: lead._id});
                        }}
                    >
                        {loading ? <IconLoader2 className="size-4 animate-spin" /> : <IconCircleX size={16} className="text-destructive" />}
                        {resolveLanguageKey("decline.confirm")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

const DeclineLeadActionWithAxios = compose(
    withAxios<ActionMessage, {_id: string}>({method: "POST", url: "toBeDeterminedByProp", data: {}}, true),
    withDebug(true, true, "taskleads"),
)(DeclineLeadAction) as ComponentType<DeclineLeadActionPublicProps>;

type DeclineLeadActionShellProps = WithLanguageType & Omit<DeclineLeadActionPublicProps, "resolveLanguageKey">;

function DeclineLeadActionShell({resolveLanguageKey, ...rest}: DeclineLeadActionShellProps) {
    const bound = useMemo(() => bindDeclineAxiosLanguageKey(resolveLanguageKey), [resolveLanguageKey]);
    return <DeclineLeadActionWithAxios url="/api/marketplace/taskLead/decline" {...rest} resolveLanguageKey={bound} />;
}

export default compose(
    withLanguage("src/modules/marketplace/components/custom/taskLeads/declineLeadAction.tsx"),
    withDebug(true, true, "taskleads"),
)(DeclineLeadActionShell);
