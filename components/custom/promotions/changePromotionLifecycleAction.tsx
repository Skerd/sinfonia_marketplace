import withLanguage, {type ResolveLanguageKey, type ResolveLanguageKeyImpl, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {ComponentType} from "react";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useEffect, useImperativeHandle, useMemo, useState} from "react";
import {IconPlayerPause, IconPlayerPlay, IconLoader2, IconAlertOctagon} from "@tabler/icons-react";
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
import type {Promotion} from "armonia/src/modules/marketplace/api/marketplace/private/promotion/promotion.dto.ts";
import {Alert, AlertDescription} from "@coreModule/components/ui/alert.tsx";

export type PromotionLifecycleVerb = "pause" | "resume" | "stop";

function bindPromotionLifecycleLanguageKey(
    verb: PromotionLifecycleVerb,
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
    pause: IconPlayerPause,
    resume: IconPlayerPlay,
    stop: IconAlertOctagon,
};

export type ChangePromotionLifecycleActionProps = WithAxiosType<ActionMessage> & {
    promotionId: string;
    listingTitle?: string;
    verb: PromotionLifecycleVerb;
    openAlert?: boolean;
    resolveLanguageKey: ResolveLanguageKey;
    onSuccess?: (patch: Partial<Promotion>) => void;
    onCancel?: () => void;
};

/** Props callers pass; `withAxios` supplies `WithAxiosType` fields. */
export type ChangePromotionLifecycleCallerProps = Omit<ChangePromotionLifecycleActionProps, keyof WithAxiosType<ActionMessage>>;

function buildSuccessPatch(verb: PromotionLifecycleVerb, stopReason: string): Partial<Promotion> {
    if (verb === "pause") return {lifecycleStatus: "paused"};
    if (verb === "resume") return {lifecycleStatus: "active"};
    return {lifecycleStatus: "stopped", stopReason: stopReason.trim()};
}

function ChangePromotionLifecycleAction({
    promotionId,
    listingTitle,
    verb,
    openAlert,
    resolveLanguageKey,
    innerRef,
    onFilterChange,
    onSuccess = () => {},
    onCancel = () => {},
    loading,
    error,
}: ChangePromotionLifecycleActionProps) {
    const {write} = useAccess("promotions");
    const [open, setOpen] = useState<boolean>(!!openAlert);
    const [stopReason, setStopReason] = useState("");
    const Icon = verbIcon[verb];

    const stopReasonTrimmed = stopReason.trim();
    const stopSubmitBlocked = verb === "stop" && (stopReasonTrimmed.length === 0 || loading);

    useImperativeHandle(
        innerRef,
        () => ({
            success: () => {
                setOpen(false);
                setStopReason("");
                onSuccess(buildSuccessPatch(verb, stopReason));
            },
        }),
        [verb, stopReason, onSuccess],
    );

    useEffect(() => {
        if (!write) return;
        setOpen(!!openAlert);
    }, [openAlert, write]);

    useEffect(() => {
        if (open && verb === "stop") {
            setStopReason("");
        }
    }, [open, verb]);

    useEffect(() => {
        if (!open) onCancel();
    }, [open, onCancel]);

    if (!write) return <HiddenElement />;

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {resolveLanguageKey(`${verb}.title`)}
                        {listingTitle ? ` '${listingTitle}'` : ""}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {resolveLanguageKey(`${verb}.description`)}
                        {listingTitle ? ` '${listingTitle}'` : ""}
                        {verb !== "stop" ? "?" : ""}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {verb === "stop" && (
                    <div className="grid gap-2 py-2">
                        <Label htmlFor="promotion-stop-reason">{resolveLanguageKey("stop.reasonLabel")}</Label>
                        <Textarea
                            id="promotion-stop-reason"
                            rows={4}
                            value={stopReason}
                            onChange={(e) => setStopReason(e.target.value)}
                            placeholder={resolveLanguageKey("stop.reasonPlaceholder")}
                            maxLength={2000}
                            className="resize-y min-h-24 text-sm"
                        />
                        <p className="text-xs text-muted-foreground">{resolveLanguageKey("stop.reasonHint")}</p>
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
                            if (stopSubmitBlocked) return;
                            const payload =
                                verb === "stop"
                                    ? {_id: promotionId, stopReason: stopReasonTrimmed}
                                    : {_id: promotionId};
                            onFilterChange(payload);
                        }}
                        disabled={verb === "stop" ? stopSubmitBlocked : loading}
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

const ChangePromotionLifecycleActionWithAxios = compose(
    withAxios(
        {
            method: "POST",
            url: "toBeDeterminedByProp",
            data: {},
        },
        true,
    ),
    withDebug(true, true, "promotions"),
)(ChangePromotionLifecycleAction) as ComponentType<ChangePromotionLifecycleCallerProps>;

type ChangePromotionLifecycleActionShellProps = WithLanguageType & {
    promotionId: string;
    listingTitle?: string;
    verb: PromotionLifecycleVerb;
    openAlert?: boolean;
    url?: string;
    onSuccess?: (patch: Partial<Promotion>) => void;
    onCancel?: () => void;
};

function ChangePromotionLifecycleActionShell({
    resolveLanguageKey,
    verb,
    ...rest
}: ChangePromotionLifecycleActionShellProps) {
    const boundResolveLanguageKey = useMemo(() => bindPromotionLifecycleLanguageKey(verb, resolveLanguageKey), [verb, resolveLanguageKey]);

    return <ChangePromotionLifecycleActionWithAxios {...rest} verb={verb} resolveLanguageKey={boundResolveLanguageKey} />;
}

export default compose(withLanguage("src/modules/marketplace/components/custom/promotions/changePromotionLifecycleAction.tsx"))(
    ChangePromotionLifecycleActionShell,
);
