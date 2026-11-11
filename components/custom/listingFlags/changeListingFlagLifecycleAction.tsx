import withLanguage, {type ResolveLanguageKey, type ResolveLanguageKeyImpl, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {ComponentType} from "react";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useEffect, useImperativeHandle, useMemo, useState} from "react";
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
import {Label} from "@coreModule/components/ui/label.tsx";
import {Textarea} from "@coreModule/components/ui/textarea.tsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@coreModule/components/ui/select.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {ActionMessage} from "armonia/src/modules/core/types/shared.types.ts";
import type {ListingFlag} from "armonia/src/modules/marketplace/api/marketplace/private/listingFlag/listingFlag.dto.ts";
import {Alert, AlertDescription} from "@coreModule/components/ui/alert.tsx";

export type ListingFlagLifecycleVerb = "resolve" | "dismiss";

function bindListingFlagLifecycleLanguageKey(
    verb: ListingFlagLifecycleVerb,
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
    resolve: IconCircleCheck,
    dismiss: IconCircleX,
};

function buildSuccessPatch(verb: ListingFlagLifecycleVerb, resolution: string): Partial<ListingFlag> {
    if (verb === "resolve") {
        return {status: "reviewed", resolution: resolution.trim()};
    }
    return {status: "dismissed", resolution: resolution.trim()};
}

export type ChangeListingFlagLifecycleActionProps = WithAxiosType<ActionMessage> & {
    listingFlagId: string;
    listingFlagTitle?: string;
    verb: ListingFlagLifecycleVerb;
    openAlert?: boolean;
    resolveLanguageKey: ResolveLanguageKey;
    onSuccess?: (patch: Partial<ListingFlag>) => void;
    onCancel?: () => void;
};

export type ChangeListingFlagLifecycleCallerProps = Omit<
    ChangeListingFlagLifecycleActionProps,
    keyof WithAxiosType<ActionMessage>
>;

function ChangeListingFlagLifecycleAction({
    listingFlagId,
    listingFlagTitle,
    verb,
    openAlert,
    resolveLanguageKey,
    innerRef,
    onFilterChange,
    onSuccess = () => {},
    onCancel = () => {},
    loading,
    error,
}: ChangeListingFlagLifecycleActionProps) {
    const {write} = useAccess("listingflags");
    const [open, setOpen] = useState<boolean>(!!openAlert);
    const [resolution, setResolution] = useState("");
    const [listingAction, setListingAction] = useState<"none" | "deactivate">("none");
    const Icon = verbIcon[verb];

    const resolutionTrimmed = resolution.trim();
    const submitBlocked = !resolutionTrimmed.length || loading;

    useImperativeHandle(
        innerRef,
        () => ({
            success: () => {
                setOpen(false);
                setResolution("");
                setListingAction("none");
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
        if (open) {
            setResolution("");
            setListingAction("none");
        }
    }, [open]);

    useEffect(() => {
        if (!open) onCancel();
    }, [open, onCancel]);

    if (!write) return <HiddenElement />;

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {resolveLanguageKey(`${verb}.title`)}
                        {listingFlagTitle ? ` — ${listingFlagTitle}` : ""}
                    </AlertDialogTitle>
                    <AlertDialogDescription>{resolveLanguageKey(`${verb}.description`)}</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-3 py-2">
                    <div className="grid gap-2">
                        <Label htmlFor="listing-flag-resolution">{resolveLanguageKey("resolutionLabel")}</Label>
                        <Textarea
                            id="listing-flag-resolution"
                            rows={4}
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                            placeholder={resolveLanguageKey("resolutionPlaceholder")}
                            maxLength={2000}
                            className="resize-y min-h-24 text-sm"
                        />
                        <p className="text-muted-foreground text-xs">{resolveLanguageKey("resolutionHint")}</p>
                    </div>
                    {verb === "resolve" && (
                        <div className="grid gap-2">
                            <Label>{resolveLanguageKey("listingActionLabel")}</Label>
                            <Select
                                value={listingAction}
                                onValueChange={(v) => setListingAction(v as "none" | "deactivate")}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={resolveLanguageKey("listingActionPlaceholder")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{resolveLanguageKey("listingAction_values.none")}</SelectItem>
                                    <SelectItem value="deactivate">
                                        {resolveLanguageKey("listingAction_values.deactivate")}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
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
                            const payload: {_id: string; resolution: string; listingAction?: "none" | "deactivate"} = {
                                _id: listingFlagId,
                                resolution: resolutionTrimmed,
                            };
                            if (verb === "resolve") {
                                payload.listingAction = listingAction;
                            }
                            onFilterChange(payload);
                        }}
                        disabled={submitBlocked}
                    >
                        {loading ? <IconLoader2 className="animate-spin" /> : <Icon size={16} />}
                        {resolveLanguageKey(`${verb}.confirm`)}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

const ChangeListingFlagLifecycleActionWithAxios = compose(
    withAxios<ActionMessage, {_id: string; resolution?: string; listingAction?: string}>(
        {
            method: "POST",
            url: "toBeDeterminedByProp",
            data: {},
        },
        true,
    ),
    withDebug(true, true, "listingflags"),
)(ChangeListingFlagLifecycleAction) as ComponentType<ChangeListingFlagLifecycleCallerProps>;

type ChangeListingFlagLifecycleActionShellProps = WithLanguageType & {
    listingFlagId: string;
    listingFlagTitle?: string;
    verb: ListingFlagLifecycleVerb;
    openAlert?: boolean;
    url?: string;
    onSuccess?: (patch: Partial<ListingFlag>) => void;
    onCancel?: () => void;
};

function ChangeListingFlagLifecycleActionShell({
    resolveLanguageKey,
    verb,
    ...rest
}: ChangeListingFlagLifecycleActionShellProps) {
    const boundResolveLanguageKey = useMemo(
        () => bindListingFlagLifecycleLanguageKey(verb, resolveLanguageKey),
        [verb, resolveLanguageKey],
    );

    return (
        <ChangeListingFlagLifecycleActionWithAxios
            {...rest}
            verb={verb}
            resolveLanguageKey={boundResolveLanguageKey}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/components/custom/listingFlags/changeListingFlagLifecycleAction.tsx"),
    withDebug(true, true, "listingflags"),
)(ChangeListingFlagLifecycleActionShell);
