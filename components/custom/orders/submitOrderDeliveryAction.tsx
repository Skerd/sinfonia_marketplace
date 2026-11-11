import withLanguage, {type ResolveLanguageKey, type ResolveLanguageKeyImpl, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {type ComponentType, useEffect, useImperativeHandle, useMemo, useRef, useState} from "react";
import {IconLoader2, IconPackageImport} from "@tabler/icons-react";
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
import {Button} from "@coreModule/components/ui/button.tsx";
import SingleFile from "@coreModule/components/viewEngine/widgets/media/singleFile.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {ActionMessage} from "armonia/src/modules/core/types/shared.types.ts";
import type {SubmitOrderDeliveryFormType} from "armonia/src/modules/marketplace/api/marketplace/private/order/submitOrderDelivery.form.validator.ts";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Alert, AlertDescription} from "@coreModule/components/ui/alert.tsx";

function bindSubmitDeliveryAxiosLanguageKey(resolveLanguageKey: ResolveLanguageKey): ResolveLanguageKeyImpl {
    return (key, returnUndefinedIfNeeded = false) => {
        if (key.startsWith("axios.")) {
            return resolveLanguageKey(`submitDelivery.${key}`, returnUndefinedIfNeeded);
        }
        return resolveLanguageKey(key, returnUndefinedIfNeeded);
    };
}

type SubmitOrderDeliveryActionPublicProps = {
    orderId: string;
    displayName?: string;
    openAlert?: boolean;
    url?: string;
    resolveLanguageKey: ResolveLanguageKey;
    onSuccess?: () => void;
    onCancel?: () => void;
};

type SubmitOrderDeliveryActionProps = WithAxiosType<ActionMessage, SubmitOrderDeliveryFormType> &
    SubmitOrderDeliveryActionPublicProps;

/** Files one delivery can carry from this dialog. */
const MAX_ATTACHMENTS = 10;

function SubmitOrderDeliveryAction({
    orderId,
    displayName,
    openAlert,
    resolveLanguageKey,
    innerRef,
    onPost,
    onSuccess = () => {},
    onCancel = () => {},
    loading,
    error,
}: SubmitOrderDeliveryActionProps) {
    const {write} = useAccess("orders");
    const [open, setOpen] = useState<boolean>(!!openAlert);
    const [message, setMessage] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        if (open) {
            setMessage("");
            setFiles([]);
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
                        {resolveLanguageKey("submitDelivery.title")}
                        {displayName ? ` — ${displayName}` : ""}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {resolveLanguageKey("submitDelivery.description")}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex flex-col py-4 gap-y-2">
                    <Label htmlFor="deliveryMessage">{resolveLanguageKey("submitDelivery.messageLabel")}</Label>
                    <Textarea
                        id="deliveryMessage"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={resolveLanguageKey("submitDelivery.messagePlaceholder")}
                        disabled={loading}
                        className="min-h-[100px]"
                    />
                    <Label className="mt-2">{resolveLanguageKey("submitDelivery.attachmentsLabel")}</Label>
                    <Input
                        bare
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        multiple
                        onChange={(e) => {
                            const picked = Array.from(e.target.files ?? []);
                            setFiles((prev) => [...prev, ...picked].slice(0, MAX_ATTACHMENTS));
                            e.target.value = "";
                        }}
                        disabled={loading || files.length >= MAX_ATTACHMENTS}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading || files.length >= MAX_ATTACHMENTS}
                    >
                        {resolveLanguageKey("submitDelivery.addFile")}
                    </Button>
                    {files.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {files.map((file, index) => (
                                <SingleFile
                                    key={`delivery-file-${index}-${file.name}`}
                                    file={{id: `delivery-file-${index}`, file, path: URL.createObjectURL(file), body: undefined}}
                                    canDownload={false}
                                    canRemove
                                    isBig={false}
                                    onRemove={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                                />
                            ))}
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
                        disabled={loading}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onPost({
                                _id: orderId,
                                ...(message.trim() ? {message: message.trim()} : {}),
                                ...(files.length > 0 ? {attachments: files} : {}),
                            });
                        }}
                    >
                        {loading ? (
                            <IconLoader2 className="size-4 animate-spin" />
                        ) : (
                            <IconPackageImport size={16} className="text-success" />
                        )}
                        {resolveLanguageKey("submitDelivery.confirm")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

const SubmitOrderDeliveryActionWithAxios = compose(
    withAxios<ActionMessage, SubmitOrderDeliveryFormType>(
        {
            method: "POST",
            url: "toBeDeterminedByProp",
            data: {},
        },
        true,
    ),
    withDebug(true, true, "orders"),
)(SubmitOrderDeliveryAction) as ComponentType<SubmitOrderDeliveryActionPublicProps>;

type SubmitOrderDeliveryActionShellProps = WithLanguageType &
    Omit<SubmitOrderDeliveryActionPublicProps, "resolveLanguageKey">;

function SubmitOrderDeliveryActionShell({resolveLanguageKey, ...rest}: SubmitOrderDeliveryActionShellProps) {
    const boundResolveLanguageKey = useMemo(
        () => bindSubmitDeliveryAxiosLanguageKey(resolveLanguageKey),
        [resolveLanguageKey],
    );

    return (
        <SubmitOrderDeliveryActionWithAxios
            {...rest}
            resolveLanguageKey={boundResolveLanguageKey}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/components/custom/orders/submitOrderDeliveryAction.tsx"),
    withDebug(true, true, "orders"),
)(SubmitOrderDeliveryActionShell);
