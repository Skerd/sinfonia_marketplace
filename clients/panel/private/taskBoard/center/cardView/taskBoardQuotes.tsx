import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {formatCurrency} from "@coreModule/helpers/general/numbers.ts";
import type {TaskBoardTask} from "armonia/src/modules/marketplace/api/marketplace/private/taskBoard/taskBoard.types.ts";

type TaskBoardQuotesProps = WithLanguageType & {task: TaskBoardTask};

/** How a task is going, as everyone may see it (D172): how many quotes and their average price, never one quote's amount. */
function TaskBoardQuotes({task, resolveLanguageKey}: TaskBoardQuotesProps) {
    const {count, average} = task.quotes;
    if (count === 0) return <span className="text-sm text-muted-foreground">{resolveLanguageKey("none")}</span>;
    const code = task.currency?.abbreviation;
    const digits = task.currency?.decimalPlaces ?? 2;
    const amount = average != null && code ? formatCurrency(average, code, {minimumFractionDigits: digits, maximumFractionDigits: digits}) : undefined;
    const counted = String(resolveLanguageKey(count === 1 ? "one" : "other")).replace("{count}", String(count));
    return (
        <span className="text-sm text-muted-foreground">
            {amount ? String(resolveLanguageKey("withAverage")).replace("{quotes}", counted).replace("{average}", amount) : counted}
        </span>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/taskBoard/center/cardView/taskBoardQuotes.tsx"),
)(TaskBoardQuotes);
