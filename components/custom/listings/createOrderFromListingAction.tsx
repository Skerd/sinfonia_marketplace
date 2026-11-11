import withLanguage, {type ResolveLanguageKey, type ResolveLanguageKeyImpl, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {type ComponentType, useEffect, useImperativeHandle, useMemo, useState} from "react";
import {IconLoader2, IconShoppingCart} from "@tabler/icons-react";
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
import type {CreateOrderFromListingFormType} from "armonia/src/modules/marketplace/api/marketplace/private/order/createOrderFromListing.form.validator.ts";
import {Alert, AlertDescription} from "@coreModule/components/ui/alert.tsx";

function bindCreateOrderAxiosLanguageKey(resolveLanguageKey: ResolveLanguageKey): ResolveLanguageKeyImpl {
    return (key, returnUndefinedIfNeeded = false) => {
        if (key.startsWith("axios.")) {
            return resolveLanguageKey(`createOrder.${key}`, returnUndefinedIfNeeded);
        }
        return resolveLanguageKey(key, returnUndefinedIfNeeded);
    };
}

type CreateOrderFromListingActionPublicProps = {
    listingId: string;
    displayName?: string;
    openAlert?: boolean;
    url?: string;
    resolveLanguageKey: ResolveLanguageKey;
    onSuccess?: () => void;
    onCancel?: () => void;
};

type CreateOrderFromListingActionProps = WithAxiosType<ActionMessage, CreateOrderFromListingFormType> &
    CreateOrderFromListingActionPublicProps;

function CreateOrderFromListingAction({
    listingId,
    displayName,
    openAlert,
    resolveLanguageKey,
    innerRef,
    onFilterChange,
    onSuccess = () => {},
    onCancel = () => {},
    loading,
    error,
}: CreateOrderFromListingActionProps) {
    const {write} = useAccess("orders");
    const [open, setOpen] = useState<boolean>(!!openAlert);
    const [note, setNote] = useState("");

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
        if (open) setNote("");
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
                        {resolveLanguageKey("createOrder.title")}
                        {displayName ? ` — ${displayName}` : ""}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {resolveLanguageKey("createOrder.description")}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex flex-col py-4 gap-y-2">
                    <Label htmlFor="orderNote">{resolveLanguageKey("createOrder.noteLabel")}</Label>
                    <Textarea
                        id="orderNote"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={resolveLanguageKey("createOrder.notePlaceholder")}
                        disabled={loading}
                        className="min-h-[100px]"
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
                        disabled={loading}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onFilterChange({
                                listing: listingId,
                                ...(note.trim() ? {note: note.trim()} : {}),
                            });
                        }}
                    >
                        {loading ? (
                            <IconLoader2 className="size-4 animate-spin" />
                        ) : (
                            <IconShoppingCart size={16} className="text-info" />
                        )}
                        {resolveLanguageKey("createOrder.confirm")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

const CreateOrderFromListingActionWithAxios = compose(
    withAxios<ActionMessage, CreateOrderFromListingFormType>(
        {
            method: "POST",
            url: "toBeDeterminedByProp",
            data: {},
        },
        true,
    ),
    withDebug(true, true, "orders"),
)(CreateOrderFromListingAction) as ComponentType<CreateOrderFromListingActionPublicProps>;

type CreateOrderFromListingActionShellProps = WithLanguageType &
    Omit<CreateOrderFromListingActionPublicProps, "resolveLanguageKey">;

function CreateOrderFromListingActionShell({resolveLanguageKey, ...rest}: CreateOrderFromListingActionShellProps) {
    const boundResolveLanguageKey = useMemo(
        () => bindCreateOrderAxiosLanguageKey(resolveLanguageKey),
        [resolveLanguageKey],
    );

    return (
        <CreateOrderFromListingActionWithAxios
            {...rest}
            resolveLanguageKey={boundResolveLanguageKey}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/components/custom/listings/createOrderFromListingAction.tsx"),
    withDebug(true, true, "orders"),
)(CreateOrderFromListingActionShell);
