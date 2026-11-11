import withLanguage, {type ResolveLanguageKey, type ResolveLanguageKeyImpl, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {ComponentType} from "react";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useEffect, useImperativeHandle, useMemo, useState} from "react";
import {IconClipboardList, IconCircleCheck, IconCircleX, IconLoader2} from "@tabler/icons-react";
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
import type {Dispute} from "armonia/src/modules/marketplace/api/marketplace/private/dispute/dispute.dto.ts";
import {Alert, AlertDescription} from "@coreModule/components/ui/alert.tsx";

export type DisputeLifecycleVerb = "startReview" | "resolve" | "close";

function bindDisputeLifecycleLanguageKey(
    verb: DisputeLifecycleVerb,
    resolveLanguageKey: ResolveLanguageKey,
): ResolveLanguageKeyImpl {
    return (key, returnUndefinedIfNeeded = false) => {
        if (key.startsWith("axios.")) {
            return resolveLanguageKey(`${verb}.${key}`, returnUndefinedIfNeeded);
        }
        return resolveLanguageKey(key, returnUndefinedIfNeeded);
    };
}

const verbIcon = {
    startReview: IconClipboardList,
    resolve: IconCircleCheck,
    close: IconCircleX,
};

function buildSuccessPatch(verb: DisputeLifecycleVerb, resolution: string): Partial<Dispute> {
    if (verb === "startReview") {
        return {status: "under_review"};
    }
    if (verb === "resolve") {
        return {status: "resolved", resolution: resolution.trim()};
    }
    return {status: "closed", resolution: resolution.trim()};
}

export type ChangeDisputeLifecycleActionProps = WithAxiosType<ActionMessage> & {
    disputeId: string;
    disputeTitle?: string;
    verb: DisputeLifecycleVerb;
    openAlert?: boolean;
    resolveLanguageKey: ResolveLanguageKey;
    onSuccess?: (patch: Partial<Dispute>) => void;
    onCancel?: () => void;
};

/** Props callers pass; `withAxios` supplies `WithAxiosType` fields. */
export type ChangeDisputeLifecycleCallerProps = Omit<ChangeDisputeLifecycleActionProps, keyof WithAxiosType<ActionMessage>>;

function ChangeDisputeLifecycleAction({
    disputeId,
    disputeTitle,
    verb,
    openAlert,
    resolveLanguageKey,
    innerRef,
    onFilterChange,
    onSuccess = () => {},
    onCancel = () => {},
    loading,
    error,
}: ChangeDisputeLifecycleActionProps) {
    const {write} = useAccess("disputes");
    const [open, setOpen] = useState<boolean>(!!openAlert);
    const [resolution, setResolution] = useState("");
    const Icon = verbIcon[verb];

    const resolutionTrimmed = resolution.trim();
    const requiresResolution = verb === "resolve" || verb === "close";
    const resolutionBlocked = requiresResolution && (!resolutionTrimmed.length || loading);
    const startReviewBlocked = verb === "startReview" && loading;

    useImperativeHandle(
        innerRef,
        () => ({
            success: () => {
                setOpen(false);
                setResolution("");
                onSuccess(buildSuccessPatch(verb, resolution));
            },
        }),
        [verb, resolution, onSuccess],
    );

    useEffect(() => {
        if (!write) return;
        setOpen(!!openAlert);
    }, [openAlert, write]);

    useEffect(() => {
        if (open && requiresResolution) {
            setResolution("");
        }
    }, [open, requiresResolution]);

    useEffect(() => {
        if (!open) onCancel();
    }, [open, onCancel]);

    if (!write) return <HiddenElement />;

    const submitBlocked = verb === "startReview" ? startReviewBlocked : resolutionBlocked;

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {resolveLanguageKey(`${verb}.title`)}
                        {disputeTitle ? ` — ${disputeTitle}` : ""}
                    </AlertDialogTitle>
                    <AlertDialogDescription>{resolveLanguageKey(`${verb}.description`)}</AlertDialogDescription>
                </AlertDialogHeader>
                {requiresResolution && (
                    <div className="grid gap-2 py-2">
                        <Label htmlFor="dispute-resolution">{resolveLanguageKey("resolutionLabel")}</Label>
                        <Textarea
                            id="dispute-resolution"
                            rows={4}
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                            placeholder={resolveLanguageKey("resolutionPlaceholder")}
                            maxLength={2000}
                            className="resize-y min-h-24 text-sm"
                        />
                        <p className="text-muted-foreground text-xs">{resolveLanguageKey("resolutionHint")}</p>
                    </div>
                )}
                {error ? (
                    <Alert variant="destructive">
                        <AlertDescription>{error.message}</AlertDescription>
                    </Alert>
                ) : null}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>{resolveLanguageKey("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (submitBlocked) return;
                            const payload =
                                verb === "startReview"
                                    ? {_id: disputeId}
                                    : {_id: disputeId, resolution: resolutionTrimmed};
                            onFilterChange(payload);
                        }}
                        disabled={submitBlocked}
                    >
                        {loading ? (
                            <IconLoader2 className="animate-spin" />
                        ) : (
                            <Icon size={16} />
                        )}
                        {resolveLanguageKey(`${verb}.confirm`)}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

const ChangeDisputeLifecycleActionWithAxios = compose(
    withAxios<ActionMessage, {_id: string; resolution?: string}>(
        {
            method: "POST",
            url: "toBeDeterminedByProp",
            data: {},
        },
        true,
    ),
    withDebug(true, true, "disputes"),
)(ChangeDisputeLifecycleAction) as ComponentType<ChangeDisputeLifecycleCallerProps>;

type ChangeDisputeLifecycleActionShellProps = WithLanguageType & {
    disputeId: string;
    disputeTitle?: string;
    verb: DisputeLifecycleVerb;
    openAlert?: boolean;
    url?: string;
    onSuccess?: (patch: Partial<Dispute>) => void;
    onCancel?: () => void;
};

function ChangeDisputeLifecycleActionShell({
    resolveLanguageKey,
    verb,
    ...rest
}: ChangeDisputeLifecycleActionShellProps) {
    const boundResolveLanguageKey = useMemo(
        () => bindDisputeLifecycleLanguageKey(verb, resolveLanguageKey),
        [verb, resolveLanguageKey],
    );

    return <ChangeDisputeLifecycleActionWithAxios {...rest} verb={verb} resolveLanguageKey={boundResolveLanguageKey} />;
}

export default compose(
    withLanguage("src/modules/marketplace/components/custom/disputes/changeDisputeLifecycleAction.tsx"),
    withDebug(true, true, "disputes"),
)(ChangeDisputeLifecycleActionShell);
