import withLanguage, {type ResolveLanguageKey, type ResolveLanguageKeyImpl, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {type ComponentType, useEffect, useImperativeHandle, useMemo, useState} from "react";
import {IconCircleCheck, IconCircleX, IconLoader2, IconPlayerPlay} from "@tabler/icons-react";
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
import type {OrderStatus} from "armonia/src/modules/marketplace/api/marketplace/private/order/order.schema-def.ts";
import {Alert, AlertDescription} from "@coreModule/components/ui/alert.tsx";

const STATUS_BY_ACTION: Record<"accept" | "start" | "cancel" | "acceptDelivery", OrderStatus> = {
    accept: "accepted",
    start: "in_progress",
    cancel: "cancelled",
    acceptDelivery: "completed",
};

export type OrderConfirmActionKey = keyof typeof STATUS_BY_ACTION;

function bindActionAxiosLanguageKey(
    actionKey: OrderConfirmActionKey,
    resolveLanguageKey: ResolveLanguageKey,
): ResolveLanguageKeyImpl {
    const languagePrefix =
        actionKey === "cancel" ? "cancelOrder" : actionKey === "acceptDelivery" ? "acceptDelivery" : actionKey;
    return (key, returnUndefinedIfNeeded = false) => {
        if (key.startsWith("axios.")) {
            return resolveLanguageKey(`${languagePrefix}.${key}`, returnUndefinedIfNeeded);
        }
        if (key === "title" || key === "description" || key === "confirm") {
            return resolveLanguageKey(`${languagePrefix}.${key}`, returnUndefinedIfNeeded);
        }
        return resolveLanguageKey(key, returnUndefinedIfNeeded);
    };
}

type OrderActionConfirmActionPublicProps = {
    orderId: string;
    displayName?: string;
    actionKey: OrderConfirmActionKey;
    openAlert?: boolean;
    url?: string;
    resolveLanguageKey: ResolveLanguageKey;
    onSuccess?: (newStatus: OrderStatus) => void;
    onCancel?: () => void;
};

type OrderActionConfirmActionProps = WithAxiosType<ActionMessage> & OrderActionConfirmActionPublicProps;

function OrderActionConfirmAction({
    orderId,
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
}: OrderActionConfirmActionProps) {
    const {write} = useAccess("orders");
    const [open, setOpen] = useState<boolean>(!!openAlert);

    const newStatus = STATUS_BY_ACTION[actionKey];

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

    const ActionIcon =
        actionKey === "accept" || actionKey === "acceptDelivery"
            ? IconCircleCheck
            : actionKey === "start"
              ? IconPlayerPlay
              : IconCircleX;
    const iconClass =
        actionKey === "cancel"
            ? "text-destructive"
            : actionKey === "start"
              ? "text-info"
              : "text-success";

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {resolveLanguageKey("title")}
                        {displayName ? ` — ${displayName}` : ""}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {resolveLanguageKey("description")}
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
                            onFilterChange({_id: orderId});
                        }}
                    >
                        {loading ? (
                            <IconLoader2 className="size-4 animate-spin" />
                        ) : (
                            <ActionIcon size={16} className={iconClass} />
                        )}
                        {resolveLanguageKey("confirm")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

const OrderActionConfirmActionWithAxios = compose(
    withAxios<ActionMessage, {_id: string}>(
        {
            method: "POST",
            url: "toBeDeterminedByProp",
            data: {},
        },
        true,
    ),
    withDebug(true, true, "orders"),
)(OrderActionConfirmAction) as ComponentType<OrderActionConfirmActionPublicProps>;

type OrderActionConfirmActionShellProps = WithLanguageType &
    Omit<OrderActionConfirmActionPublicProps, "resolveLanguageKey">;

function OrderActionConfirmActionShell({resolveLanguageKey, actionKey, ...rest}: OrderActionConfirmActionShellProps) {
    const boundResolveLanguageKey = useMemo(
        () => bindActionAxiosLanguageKey(actionKey, resolveLanguageKey),
        [actionKey, resolveLanguageKey],
    );

    return (
        <OrderActionConfirmActionWithAxios
            {...rest}
            actionKey={actionKey}
            resolveLanguageKey={boundResolveLanguageKey}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/components/custom/orders/orderActionConfirmAction.tsx"),
    withDebug(true, true, "orders"),
)(OrderActionConfirmActionShell);
