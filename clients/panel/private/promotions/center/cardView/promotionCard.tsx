import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import type {Promotion} from "armonia/src/modules/marketplace/api/marketplace/private/promotion/promotion.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import PromotionSheetView from "@marketplaceModule/clients/panel/private/promotions/center/sheetView/promotionSheetView.tsx";
import PausePromotionDropdown from "@marketplaceModule/clients/panel/private/promotions/center/actions/pausePromotionDropdown.tsx";
import ResumePromotionDropdown from "@marketplaceModule/clients/panel/private/promotions/center/actions/resumePromotionDropdown.tsx";
import StopPromotionDropdown from "@marketplaceModule/clients/panel/private/promotions/center/actions/stopPromotionDropdown.tsx";
import ChangePromotionLifecycleAction from "@marketplaceModule/components/custom/promotions/changePromotionLifecycleAction.tsx";
import {IconCalendar, IconListDetails, IconSparkles, IconStar} from "@tabler/icons-react";
import {DATE_FORMATS, formatDate} from "@coreModule/helpers/general/dateTime.ts";
import {useCompanyTimeZone} from "@coreModule/helpers/hooks/useCompanyTimeZone.ts";
import StatusBadge from "@coreModule/components/entityPage/sheet/statusBadge.tsx";
import DisplayValue from "@coreModule/components/viewEngine/widgets/display/displayValue.tsx";
import EntityCard from "@coreModule/components/entityPage/list/card/entityCard.tsx";
import EntityCardRow from "@coreModule/components/entityPage/list/card/entityCardRow.tsx";
import {accessFieldPathExists} from "@coreModule/helpers/context/accessContext.tsx";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";
import type {ReactNode, RefObject} from "react";

export type PromotionDisplayStatus = "stopped" | "paused" | "upcoming" | "active" | "ended";

function deriveDatePhase(startAt: Date | string, endAt: Date | string): "upcoming" | "active" | "ended" {
    const now = Date.now();
    const start = new Date(startAt).getTime();
    const end = new Date(endAt).getTime();
    if (now < start) return "upcoming";
    if (now > end) return "ended";
    return "active";
}

function derivePromotionDisplayStatus(promotion: Promotion): PromotionDisplayStatus {
    const lc = promotion.lifecycleStatus ?? "active";
    if (lc === "stopped") return "stopped";
    if (lc === "paused") return "paused";
    return deriveDatePhase(promotion.startAt, promotion.endAt);
}

type PromotionCardProps = WithLanguageType & {
    promotion: Promotion;
    fetchId?: string;
    onDelete?: (deleted?: Promotion, response?: DeletedData) => void;
    onRestore?: () => void;
    hideActions?: boolean;
    sheetOnly?: boolean;
    innerRef?: RefObject<WithAxiosLifecycleRef<Promotion> | null>;
};

function PromotionCard({
    promotion,
    fetchId,
    onDelete,
    onRestore,
    hideActions = false,
    sheetOnly = false,
    resolveLanguageKey,
    innerRef,
}: PromotionCardProps) {
    // The run is read on the company calendar (GLB-09).
    const companyZone = useCompanyTimeZone();
    const day = (value: Date | string) => formatDate(value, {timeZone: companyZone, format: DATE_FORMATS.mediumDate});
    return (
        <EntityCard
            resource="promotions"
            entity={promotion}
            fetchId={fetchId}
            singleUrl="/api/marketplace/promotion/single"
            onDelete={onDelete}
            onRestore={onRestore}
            hideActions={hideActions}
            hideEdit
            sheetOnly={sheetOnly}
            editPath={() => ""}
            Sheet={PromotionSheetView}
            sheetEntityProp="promotion"
            deleteUrl="/api/marketplace/promotion"
            restoreUrl="/api/marketplace/promotion/restore"
            failedTitle={resolveLanguageKey("failedTitle")}
            failedDescription={resolveLanguageKey("failedDescription")}
            titlePath="name"
            innerRef={innerRef}
            sheetProps={({entity: row, setEntity}) => ({
                fetchId,
                onListLifecyclePatched: (patch: Partial<Promotion>) => setEntity({...row, ...patch}),
            })}
            extraDialogs={({action, setAction, entity: row, setEntity}) => {
                const listingTitle = row.listing?.title || row.listing?.name;
                return (
                    <>
                        {(action === "pause" || action === "resume" || action === "stop") && (
                            <ChangePromotionLifecycleAction
                                promotionId={row._id}
                                listingTitle={listingTitle}
                                verb={action}
                                openAlert
                                url={`/api/marketplace/promotion/${action}`}
                                onSuccess={(patch: Partial<Promotion>) => {
                                    setEntity({...row, ...patch});
                                    setAction("");
                                }}
                                onCancel={() => setAction("")}
                            />
                        )}
                    </>
                );
            }}
        >
            {({entity: row, read, setAction}) => {
                const lifecycle = row.lifecycleStatus ?? "active";
                const displayStatus = derivePromotionDisplayStatus(row);
                const endStillFuture =
                    !!row.endAt && !Number.isNaN(new Date(row.endAt).getTime())
                        ? new Date(row.endAt).getTime() > Date.now()
                        : false;
                return (
                    <>
                        <EntityCard.Header
                            titlePath={["name", "listing.title"]}
                            title={row.name || row.listing?.title}
                            badgesBesideTitle
                            badges={
                                <>
                                    {/* Derived from the lifecycle and both dates, so it needs all three; tones come from the lifecycle (UX-02). */}
                                    {accessFieldPathExists(read, "lifecycleStatus") && accessFieldPathExists(read, "startAt") && accessFieldPathExists(read, "endAt") ? (
                                        <StatusBadge tableConfigKey="promotions" field="lifecycleStatus" value={displayStatus} label={String(resolveLanguageKey(displayStatus))} />
                                    ) : null}
                                    {accessFieldPathExists(read, "type") && row.type ? (
                                        <DisplayValue path="type" value={resolveLanguageKey(row.type)}>
                                            {(formatted: ReactNode) => (
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center gap-1 text-3xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0",
                                                        row.type === "featured" ? "bg-warning/20 text-warning" : "bg-info/20 text-info",
                                                    )}
                                                >
                                                    {row.type === "featured" ? (
                                                        <IconSparkles className="w-3 h-3" />
                                                    ) : (
                                                        <IconStar className="w-3 h-3" />
                                                    )}
                                                    {formatted}
                                                </span>
                                            )}
                                        </DisplayValue>
                                    ) : null}
                                </>
                            }
                        >
                            {!row.deletedAt && lifecycle === "active" && (
                                <PausePromotionDropdown onAction={setAction} />
                            )}
                            {!row.deletedAt && lifecycle === "paused" && endStillFuture && (
                                <ResumePromotionDropdown onAction={setAction} />
                            )}
                            {!row.deletedAt && lifecycle !== "stopped" && (
                                <StopPromotionDropdown onAction={setAction} />
                            )}
                        </EntityCard.Header>
                        <EntityCard.Body>
                            <EntityCardRow
                                icon={IconListDetails}
                                label={resolveLanguageKey("listing")}
                                tooltip={resolveLanguageKey("listing")}
                                path="listing.title"
                                value={row.listing?.title}
                            />
                            <EntityCardRow
                                icon={IconCalendar}
                                label={resolveLanguageKey("period")}
                                tooltip={resolveLanguageKey("period")}
                                show={accessFieldPathExists(read, "startAt") && accessFieldPathExists(read, "endAt")}
                                value={`${day(row.startAt)} – ${day(row.endAt)}`}
                            />
                        </EntityCard.Body>
                    </>
                );
            }}
        </EntityCard>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/promotions/center/cardView/promotionCard.tsx"),
    withDebug(true, true, "promotions"),
)(PromotionCard);
