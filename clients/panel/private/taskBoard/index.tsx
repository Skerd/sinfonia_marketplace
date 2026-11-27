import {compose} from "redux";
import {useEffect, useMemo, useState} from "react";
import {useSearchParams} from "react-router-dom";
import {IconChevronDown, IconFilter, IconX} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import Header from "@coreModule/components/custom/header.tsx";
import {readPageHelp} from "@coreModule/components/custom/pageHelp.tsx";
import {ListSearchBar} from "@coreModule/components/entityPage/list/cardAndTableView.tsx";
import {CardMosaic} from "@coreModule/components/entityPage/list/cardMosaic.tsx";
import {GRID_TRANSACTIONAL} from "@coreModule/components/entityPage/list/entityCard.constants.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {NativeSelect, NativeSelectOption} from "@coreModule/components/ui/native-select.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@coreModule/components/ui/popover.tsx";
import type {ApiSelectDatum} from "armonia/src/modules/core/types/shared.types.ts";
import {TASK_BOARD_DELIVERIES} from "armonia/src/modules/marketplace/api/marketplace/private/taskBoard/taskBoard.form.validator.ts";
import type {TaskBoardResponse, TaskBoardTask} from "armonia/src/modules/marketplace/api/marketplace/private/taskBoard/taskBoard.types.ts";
import TaskBoardCard from "./center/cardView/taskBoardCard.tsx";
import {useTaskUpdates} from "@marketplaceModule/helpers/hooks/useTaskLiveUpdates.ts";
import {TASK_BOARD_ROOM} from "armonia/src/modules/marketplace/websocket/types.ts";

const PAGE_SIZE = 24;
const BOARD_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/taskBoard"};
const CATEGORIES_REQUEST: HttpRequest = {method: "POST", url: "/api/marketplace/listingCategory/select"};

/**
 * The task board (D172): every open public task, newest first, whether the matching reached this company or not. Any
 * services company may quote on one; the quote opens (or uses) the provider's lead, which then lives under Leads.
 */
function TaskBoard({resolveLanguageKey}: WithLanguageType) {
    const [params, setParams] = useSearchParams();
    const search = params.get("q") ?? "";
    const category = params.get("category") ?? "";
    const delivery = params.get("delivery") ?? "";
    const [filtersOpen, setFiltersOpen] = useState(false);

    // One page at a time; a new search or filter starts again from the first.
    const [offset, setOffset] = useState(0);
    const [tasks, setTasks] = useState<TaskBoardTask[]>([]);
    const [fetchCount, setFetchCount] = useState(0);
    useEffect(() => {
        setOffset(0);
        setFetchCount((count) => count + 1);
    }, [search, category, delivery]);
    const body = useMemo(() => ({
        ...(search ? {search} : {}),
        ...(category ? {category} : {}),
        ...(delivery ? {delivery} : {}),
        offset,
        limit: PAGE_SIZE,
    }), [search, category, delivery, offset]);
    const board = useHttpRequest<TaskBoardResponse>(BOARD_REQUEST, body, fetchCount);
    useEffect(() => {
        if (!board.data) return;
        const page = board.data.data;
        setTasks((shown) => offset === 0 ? page : [...shown, ...page]);
    }, [board.data, offset]);
    const total = board.data?.total ?? 0;

    // Live (D172): a task on screen takes its new count and status; a new task brings the first page again when
    // nothing more was loaded, else it waits for the next search.
    useTaskUpdates(TASK_BOARD_ROOM, (update) => {
        const shown = tasks.some((task) => task._id === update.taskId);
        if (shown) {
            setTasks((current) => current.map((task) => task._id === update.taskId ? {...task, status: update.status, quotes: update.quotes} : task));
        } else if (offset === 0 && update.status === "open") {
            setFetchCount((count) => count + 1);
        }
    });

    const categories = useHttpRequest<{data: ApiSelectDatum[]}>(CATEGORIES_REQUEST, {limit: 100, offset: 0, topLevel: true}, 1);
    const categoryOptions = categories.data?.data ?? [];
    const categoryLabel = categoryOptions.find((option) => option.value === category)?.label;

    // One URL write per change: react-router does not queue them.
    const setFilter = (key: "q" | "category" | "delivery", value: string) => {
        const next = new URLSearchParams(params);
        if (value) next.set(key, value);
        else next.delete(key);
        setParams(next, {replace: true});
    };
    const clearAll = () => {
        const next = new URLSearchParams(params);
        for (const key of ["q", "category", "delivery"]) next.delete(key);
        setParams(next, {replace: true});
    };

    const chip = (key: "category" | "delivery", label: string) => (
        <Badge key={key} variant="secondary" className="h-6 gap-1 pr-1 text-xs">
            {label}
            <Button variant="bare" type="button" aria-label={String(resolveLanguageKey("removeFilter"))} onClick={() => setFilter(key, "")} className="rounded-sm hover:bg-muted">
                <IconX className="size-3" />
            </Button>
        </Badge>
    );
    const facets = (
        <>
            {category && categoryLabel ? chip("category", categoryLabel) : null}
            {delivery ? chip("delivery", String(resolveLanguageKey(`delivery.${delivery}`))) : null}
        </>
    );

    const loading = board.loading || fetchCount === 0;
    return (
        <div className="flex h-full flex-col overflow-hidden">
            <Header
                title={String(resolveLanguageKey("title"))}
                description={String(resolveLanguageKey("description"))}
                help={readPageHelp(resolveLanguageKey)}
            />
            <div className="flex-1 overflow-auto p-4">
                <div className="flex flex-col gap-4">
                    <ListSearchBar
                        value={search}
                        onSearch={(text) => setFilter("q", text.trim())}
                        searchable
                        placeholder={String(resolveLanguageKey("searchPlaceholder"))}
                        clearLabel={String(resolveLanguageKey("clearAll"))}
                        facets={facets}
                        hasFacets={!!category || !!delivery}
                        onClearAll={clearAll}
                        menu={
                            <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                                <PopoverTrigger asChild>
                                    <Button type="button" variant="ghost" size="sm" aria-label={String(resolveLanguageKey("filters"))} className="h-7 shrink-0 gap-0.5 px-1.5 text-muted-foreground">
                                        <IconFilter className="size-4" />
                                        <IconChevronDown className="size-3.5" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent align="end" className="flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3 p-3">
                                    <p className="flex items-center gap-1.5 text-xs font-semibold">
                                        <IconFilter className="size-3.5" />
                                        {resolveLanguageKey("filters")}
                                    </p>
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="taskBoardCategory">{resolveLanguageKey("category")}</Label>
                                        <NativeSelect id="taskBoardCategory" className="h-8 w-full text-sm" value={category} onChange={(e) => setFilter("category", e.target.value)}>
                                            <NativeSelectOption value="">{resolveLanguageKey("anyCategory")}</NativeSelectOption>
                                            {categoryOptions.map((option) => <NativeSelectOption key={String(option.value)} value={String(option.value)}>{option.label}</NativeSelectOption>)}
                                        </NativeSelect>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="taskBoardDelivery">{resolveLanguageKey("where")}</Label>
                                        <NativeSelect id="taskBoardDelivery" className="h-8 w-full text-sm" value={delivery} onChange={(e) => setFilter("delivery", e.target.value)}>
                                            <NativeSelectOption value="">{resolveLanguageKey("anywhere")}</NativeSelectOption>
                                            {TASK_BOARD_DELIVERIES.map((value) => <NativeSelectOption key={value} value={value}>{resolveLanguageKey(`delivery.${value}`)}</NativeSelectOption>)}
                                        </NativeSelect>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        }
                    />

                    {loading && tasks.length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted-foreground">{resolveLanguageKey("loading")}</p>
                    ) : tasks.length === 0 ? (
                        <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed px-6 py-12 text-center">
                            <p className="font-medium">{resolveLanguageKey("emptyTitle")}</p>
                            <p className="max-w-md text-sm text-muted-foreground">{resolveLanguageKey("emptyMessage")}</p>
                        </div>
                    ) : (
                        // The list pages' own card grid (several cards per row, as wide as the screen allows).
                        <CardMosaic className={GRID_TRANSACTIONAL}>
                            {tasks.map((task) => <TaskBoardCard key={task._id} task={task} />)}
                        </CardMosaic>
                    )}

                    {tasks.length > 0 && tasks.length < total ? (
                        <div className="flex justify-center">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={board.loading}
                                onClick={() => {
                                    setOffset(tasks.length);
                                    setFetchCount((count) => count + 1);
                                }}
                            >
                                {resolveLanguageKey("loadMore")}
                            </Button>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/taskBoard/index.tsx"),
    withDebug(true, true, "taskleads"),
)(TaskBoard);
