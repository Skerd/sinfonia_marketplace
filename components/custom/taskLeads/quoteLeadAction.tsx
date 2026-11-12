import withLanguage, {type ResolveLanguageKey, type ResolveLanguageKeyImpl, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {type ComponentType, useEffect, useImperativeHandle, useMemo, useState} from "react";
import {IconLoader2, IconSend} from "@tabler/icons-react";
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
import {Input} from "@coreModule/components/ui/input.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {Textarea} from "@coreModule/components/ui/textarea.tsx";
import {Alert, AlertDescription} from "@coreModule/components/ui/alert.tsx";
import type {ActionMessage} from "armonia/src/modules/core/types/shared.types.ts";
import type {TaskLead} from "armonia/src/modules/marketplace/api/marketplace/private/taskLead/taskLead.dto.ts";
import type {QuoteTaskLeadFormType} from "armonia/src/modules/marketplace/api/marketplace/private/taskLead/taskLead.schema-def.ts";

function bindQuoteAxiosLanguageKey(resolveLanguageKey: ResolveLanguageKey): ResolveLanguageKeyImpl {
    return (key, returnUndefinedIfNeeded = false) =>
        resolveLanguageKey(key.startsWith("axios.") ? `quote.${key}` : key, returnUndefinedIfNeeded);
}

type QuoteLeadActionPublicProps = {
    lead: TaskLead;
    openAlert?: boolean;
    url?: string;
    resolveLanguageKey: ResolveLanguageKey;
    onSuccess?: (patch: Partial<TaskLead>) => void;
    onCancel?: () => void;
};

type QuoteLeadActionProps = WithAxiosType<ActionMessage> & QuoteLeadActionPublicProps;

/** The provider's quote on a lead (D143): price in the job's currency, days and a short proposal. */
function QuoteLeadAction({lead, openAlert, resolveLanguageKey, innerRef, onFilterChange, onSuccess = () => {}, onCancel = () => {}, loading, error}: QuoteLeadActionProps) {
    const [open, setOpen] = useState<boolean>(!!openAlert);
    const [amount, setAmount] = useState("");
    const [deliveryDays, setDeliveryDays] = useState("1");
    const [proposal, setProposal] = useState("");

    useImperativeHandle(innerRef, () => ({
        success: () => {
            setOpen(false);
            onSuccess({status: "quoted", bid: {_id: "", amount: Number(amount), deliveryDays: Number(deliveryDays), proposal, status: "pending", currency: lead.taskRequest?.currency}});
        },
    }));

    useEffect(() => setOpen(!!openAlert), [openAlert]);
    useEffect(() => {
        if (!open) onCancel();
    }, [open, onCancel]);

    const amountNum = Number(amount);
    const daysNum = Number(deliveryDays);
    const canSubmit = amount !== "" && Number.isFinite(amountNum) && amountNum >= 0
        && Number.isInteger(daysNum) && daysNum >= 0 && proposal.trim().length > 0 && proposal.length <= 5000;
    const currency = lead.taskRequest?.currency?.abbreviation ?? lead.taskRequest?.currency?.symbol ?? "";
    const budget = lead.taskRequest?.budgetMax != null ? `${lead.taskRequest.budgetMax} ${currency}`.trim() : undefined;

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="max-w-lg" onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>{resolveLanguageKey("quote.title")}{lead.taskRequest?.title ? ` — ${lead.taskRequest.title}` : ""}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {budget ? String(resolveLanguageKey("quote.budgetHint")).replace("{budget}", budget) : resolveLanguageKey("quote.description")}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-4 py-2 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="quoteAmount">{String(resolveLanguageKey("quote.amountLabel")).replace("{currency}", currency)}</Label>
                        <Input id="quoteAmount" type="number" min={0} step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={loading} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="quoteDays">{resolveLanguageKey("quote.daysLabel")}</Label>
                        <Input id="quoteDays" type="number" min={0} step={1} value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} disabled={loading} />
                    </div>
                    <div className="flex flex-col gap-2 sm:col-span-2">
                        <Label htmlFor="quoteProposal">{resolveLanguageKey("quote.proposalLabel")}</Label>
                        <Textarea id="quoteProposal" rows={5} maxLength={5000} placeholder={String(resolveLanguageKey("quote.proposalPlaceholder"))} value={proposal} onChange={(e) => setProposal(e.target.value)} disabled={loading} />
                    </div>
                </div>
                {error ? (
                    <Alert variant="destructive">
                        <AlertDescription>{error.message}</AlertDescription>
                    </Alert>
                ) : null}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>{resolveLanguageKey("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={loading || !canSubmit}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!canSubmit) return;
                            onFilterChange({_id: lead._id, amount: amountNum, deliveryDays: daysNum, proposal: proposal.trim()});
                        }}
                    >
                        {loading ? <IconLoader2 className="size-4 animate-spin" /> : <IconSend size={16} className="text-primary" />}
                        {resolveLanguageKey("quote.confirm")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

const QuoteLeadActionWithAxios = compose(
    withAxios<ActionMessage, QuoteTaskLeadFormType>({method: "POST", url: "toBeDeterminedByProp", data: {}}, true),
    withDebug(true, true, "taskleads"),
)(QuoteLeadAction) as ComponentType<QuoteLeadActionPublicProps>;

type QuoteLeadActionShellProps = WithLanguageType & Omit<QuoteLeadActionPublicProps, "resolveLanguageKey">;

function QuoteLeadActionShell({resolveLanguageKey, ...rest}: QuoteLeadActionShellProps) {
    const bound = useMemo(() => bindQuoteAxiosLanguageKey(resolveLanguageKey), [resolveLanguageKey]);
    return <QuoteLeadActionWithAxios url="/api/marketplace/taskLead/quote" {...rest} resolveLanguageKey={bound} />;
}

export default compose(
    withLanguage("src/modules/marketplace/components/custom/taskLeads/quoteLeadAction.tsx"),
    withDebug(true, true, "taskleads"),
)(QuoteLeadActionShell);
