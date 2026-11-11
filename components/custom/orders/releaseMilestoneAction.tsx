import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useEffect, useImperativeHandle, useState} from "react";
import {IconCoins, IconLoader2} from "@tabler/icons-react";
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
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@coreModule/components/ui/select.tsx";
import DisplayValue from "@coreModule/components/viewEngine/widgets/display/displayValue.tsx";
import type {ActionMessage} from "armonia/src/modules/core/types/shared.types.ts";
import type {OrderMilestone} from "armonia/src/modules/marketplace/api/marketplace/private/orderMilestone/orderMilestone.dto.ts";
import type {ReleaseOrderMilestoneFormType} from "armonia/src/modules/marketplace/api/marketplace/private/orderMilestone/orderMilestone.schema-def.ts";
import {Alert, AlertDescription} from "@coreModule/components/ui/alert.tsx";

type ReleaseMilestoneActionProps = WithLanguageType & WithAxiosType<ActionMessage, ReleaseOrderMilestoneFormType> & {
    /** The order's pending milestones, from the order sheet. */
    milestones: OrderMilestone[];
    displayName?: string;
    onSuccess: () => void;
    onCancel: () => void;
};

/** The customer pays one pending milestone out of the order's escrow to the provider. */
function ReleaseMilestoneAction({
    milestones,
    displayName,
    resolveLanguageKey,
    innerRef,
    onPost,
    onSuccess,
    onCancel,
    loading,
    error,
}: ReleaseMilestoneActionProps) {
    const [open, setOpen] = useState(true);
    const [milestoneId, setMilestoneId] = useState(milestones[0]?._id ?? "");

    useImperativeHandle(innerRef, () => ({
        success: () => {
            setOpen(false);
            onSuccess();
        },
    }));

    useEffect(() => {
        if (!open) onCancel();
    }, [open, onCancel]);

    const selected = milestones.find((milestone) => milestone._id === milestoneId);

    return (
        <AlertDialog open={open} onOpenChange={(next) => !loading && setOpen(next)}>
            <AlertDialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {resolveLanguageKey("title")}
                        {displayName ? ` — ${displayName}` : ""}
                    </AlertDialogTitle>
                    <AlertDialogDescription>{resolveLanguageKey("description")}</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex flex-col gap-y-2 py-4">
                    <Label>{resolveLanguageKey("milestoneLabel")}</Label>
                    <Select value={milestoneId} onValueChange={setMilestoneId} disabled={loading}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={resolveLanguageKey("milestonePlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                            {milestones.map((milestone) => (
                                <SelectItem key={milestone._id} value={milestone._id}>{milestone.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selected ? (
                        <span className="text-sm font-semibold">
                            <DisplayValue path="amount" type="currency" value={{amount: selected.amount, currency: selected.currency}} />
                        </span>
                    ) : null}
                </div>
                {error ? (
                    <Alert variant="destructive">
                        <AlertDescription>{error.message}</AlertDescription>
                    </Alert>
                ) : null}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>{resolveLanguageKey("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={loading || !selected}
                        className="hover:bg-success hover:text-success-foreground"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onPost({milestone: milestoneId});
                        }}
                    >
                        {loading ? <IconLoader2 className="size-4 animate-spin" /> : <IconCoins size={16} />}
                        {resolveLanguageKey("confirm")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/components/custom/orders/releaseMilestoneAction.tsx"),
    withAxios({method: "post", url: "/api/marketplace/order/releaseMilestone", data: {}}, true),
    withDebug(true, true, "orders"),
)(ReleaseMilestoneAction);
