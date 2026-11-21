import {useEffect, useMemo, useState} from "react";
import {Link, useLocation} from "react-router-dom";
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {usePortalSession} from "@coreModule/clients/portal/shared/portalSession.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {Textarea} from "@coreModule/components/ui/textarea.tsx";
import {NativeSelect, NativeSelectOption} from "@coreModule/components/ui/native-select.tsx";
import {useServicesConfig} from "@marketplaceModule/clients/client/public/shared/servicesConfigContext.tsx";
import ServiceStatus from "@marketplaceModule/clients/client/public/shared/serviceStatus.tsx";
import type {PublicTask} from "armonia/src/modules/marketplace/api/marketplace/public/shopTask/shopTask.types.ts";
import type {TaskBoardPortalOptionsResponse} from "armonia/src/modules/marketplace/api/marketplace/private/taskBoard/taskBoard.types.ts";

const OPTIONS_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/taskBoard/portalOptions"};
const QUOTE_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/taskLead/quoteJob"};
const PROPOSAL_MAX = 5000;

type PortalQuotePanelProps = WithLanguageType & {
    task: PublicTask;
    /** Read the task again after a quote: its count (and average) changed. */
    onQuoted: () => void;
};

/**
 * Quoting from the portal (D172): a signed-in user who belongs to a services company quotes for it right on the task
 * page, as one of their companies (`actAs`), with the same permission their role there gives in the panel. Their
 * company's quote shows once sent; a company keeps one live quote per task.
 */
function PortalQuotePanel({task, onQuoted, resolveLanguageKey}: PortalQuotePanelProps) {
    const {isAuthenticated} = usePortalSession();
    const {formatMoney} = useServicesConfig();
    const location = useLocation();

    const [optionsCount, setOptionsCount] = useState(0);
    useEffect(() => {
        if (isAuthenticated) setOptionsCount((count) => count + 1);
    }, [isAuthenticated, task._id]);
    const optionsBody = useMemo(() => ({_id: task._id}), [task._id]);
    const options = useHttpRequest<TaskBoardPortalOptionsResponse>(OPTIONS_REQUEST, optionsBody, optionsCount, true, {}, {hideIfError: true});
    const companies = options.error ? [] : options.data?.data ?? [];

    const [companyId, setCompanyId] = useState("");
    useEffect(() => {
        if (!companies.some((option) => option.company._id === companyId)) setCompanyId(companies[0]?.company._id ?? "");
    }, [companies, companyId]);
    const chosen = companies.find((option) => option.company._id === companyId);

    const [amount, setAmount] = useState("");
    const [days, setDays] = useState("1");
    const [proposal, setProposal] = useState("");
    const [sendCount, setSendCount] = useState(0);
    const quoteBody = useMemo(() => ({
        _id: task._id, actAs: companyId, amount: Number(amount), deliveryDays: Number(days), proposal: proposal.trim(),
    }), [task._id, companyId, amount, days, proposal]);
    const send = useHttpRequest(QUOTE_REQUEST, quoteBody, sendCount, true, {
        success: () => {
            setAmount("");
            setProposal("");
            setOptionsCount((count) => count + 1);
            onQuoted();
        },
    });

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col gap-3 rounded-3xl border border-border p-6">
                <p className="font-medium">{resolveLanguageKey("proTitle")}</p>
                <p className="text-sm text-muted-foreground">{resolveLanguageKey("signInMessage")}</p>
                <Button asChild variant="outline" className="self-start">
                    <Link to={`/login?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`}>{resolveLanguageKey("signIn")}</Link>
                </Button>
            </div>
        );
    }
    // Only members of a services company quote; for anyone else there is nothing to offer here.
    if (!companies.length || task.status !== "open") return null;

    const amountNum = Number(amount);
    const daysNum = Number(days);
    const canSend = !!companyId && amount !== "" && Number.isFinite(amountNum) && amountNum >= 0
        && Number.isInteger(daysNum) && daysNum >= 0 && proposal.trim().length > 0 && proposal.length <= PROPOSAL_MAX;
    const currency = task.currency?.abbreviation ?? task.currency?.symbol ?? "";

    return (
        <section className="flex flex-col gap-4 rounded-3xl border border-primary/30 bg-primary/5 p-6" aria-labelledby="portal-quote-title">
            <h2 id="portal-quote-title" className="font-display text-xl font-semibold tracking-tight">{resolveLanguageKey("title")}</h2>
            {companies.length > 1 ? (
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="portalQuoteCompany">{resolveLanguageKey("quoteAs")}</Label>
                    <NativeSelect id="portalQuoteCompany" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                        {companies.map((option) => <NativeSelectOption key={option.company._id} value={option.company._id}>{option.company.name}</NativeSelectOption>)}
                    </NativeSelect>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">{resolveLanguageKey("quotingAs").replace("{company}", chosen?.company.name ?? "")}</p>
            )}

            {chosen?.quote ? (
                <div className="flex flex-col gap-2 rounded-2xl bg-background p-4">
                    <div className="flex items-center justify-between gap-3">
                        <span className="font-display text-xl font-semibold tabular-nums">{formatMoney(chosen.quote.amount, chosen.quote.currency ?? task.currency)}</span>
                        <ServiceStatus kind="bidStatus" value={chosen.quote.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {resolveLanguageKey(chosen.quote.deliveryDays === 1 ? "daysOne" : "daysOther").replace("{count}", String(chosen.quote.deliveryDays))}
                    </p>
                    <p className="whitespace-pre-line text-sm">{chosen.quote.proposal}</p>
                    <p className="text-xs text-muted-foreground">{resolveLanguageKey("oneQuote")}</p>
                </div>
            ) : (
                <form
                    className="flex flex-col gap-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (canSend) setSendCount((count) => count + 1);
                    }}
                >
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="portalQuoteAmount">{String(resolveLanguageKey("amount")).replace("{currency}", currency)}</Label>
                            <Input id="portalQuoteAmount" type="number" min={0} step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={send.loading} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="portalQuoteDays">{resolveLanguageKey("days")}</Label>
                            <Input id="portalQuoteDays" type="number" min={0} step={1} value={days} onChange={(e) => setDays(e.target.value)} disabled={send.loading} />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="portalQuoteProposal">{resolveLanguageKey("proposal")}</Label>
                        <Textarea id="portalQuoteProposal" rows={4} maxLength={PROPOSAL_MAX} placeholder={String(resolveLanguageKey("proposalPlaceholder"))} value={proposal} onChange={(e) => setProposal(e.target.value)} disabled={send.loading} />
                    </div>
                    {send.error?.message ? <p className="text-sm text-destructive">{send.error.message}</p> : null}
                    <Button type="submit" disabled={!canSend || send.loading} className="self-start">{resolveLanguageKey("send")}</Button>
                    <p className="text-xs text-muted-foreground">{resolveLanguageKey("sealedNote")}</p>
                </form>
            )}
        </section>
    );
}

export default compose(withLanguage("src/modules/marketplace/clients/client/public/tasks/portalQuotePanel.tsx"))(PortalQuotePanel);
