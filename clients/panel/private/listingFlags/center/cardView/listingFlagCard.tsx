import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {IconCalendarEvent, IconUser} from "@tabler/icons-react";
import type {ListingFlag} from "armonia/src/modules/marketplace/api/marketplace/private/listingFlag/listingFlag.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import ListingFlagSheetView from "@marketplaceModule/clients/panel/private/listingFlags/center/sheetView/listingFlagSheetView.tsx";
import ResolveListingFlagDropdown from "@marketplaceModule/clients/panel/private/listingFlags/center/actions/resolveListingFlagDropdown.tsx";
import DismissListingFlagDropdown from "@marketplaceModule/clients/panel/private/listingFlags/center/actions/dismissListingFlagDropdown.tsx";
import ChangeListingFlagLifecycleAction, {
    type ListingFlagLifecycleVerb,
} from "@marketplaceModule/components/custom/listingFlags/changeListingFlagLifecycleAction.tsx";
import EntityCardRow from "@coreModule/components/entityPage/list/card/entityCardRow.tsx";
import EntityCard from "@coreModule/components/entityPage/list/card/entityCard.tsx";
import StatusBadge from "@coreModule/components/entityPage/sheet/statusBadge.tsx";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";
import type {RefObject} from "react";
import {accessFieldPathExists} from "@coreModule/helpers/context/accessContext.tsx";

function listingFlagEditPath(flag: ListingFlag) {
    const params = new URLSearchParams();
    params.set("listingFlagId", flag._id);
    return `/marketplace/listingflags/edit?${params.toString()}`;
}

type ListingFlagCardProps = WithLanguageType & {
    listingFlag: ListingFlag;
    fetchId?: string;
    onDelete?: (deleted?: ListingFlag, response?: DeletedData) => void;
    onRestore?: () => void;
    onLifecyclePatched?: (patch: Partial<ListingFlag>) => void;
    hideActions?: boolean;
    sheetOnly?: boolean;
    innerRef?: RefObject<WithAxiosLifecycleRef<ListingFlag> | null>;
};

function ListingFlagCard({
    listingFlag,
    fetchId,
    onDelete,
    onRestore,
    onLifecyclePatched,
    resolveLanguageKey,
    hideActions = false,
    sheetOnly = false,
    innerRef,
}: ListingFlagCardProps) {
    return (
        <EntityCard
            resource="listingflags"
            entity={listingFlag}
            fetchId={fetchId}
            singleUrl="/api/marketplace/listingFlag/single"
            onDelete={onDelete}
            onRestore={onRestore}
            hideActions={hideActions}
            hideEdit={(row) => row.status !== "pending"}
            sheetOnly={sheetOnly}
            editPath={listingFlagEditPath}
            Sheet={ListingFlagSheetView}
            sheetEntityProp="listingFlag"
            deleteUrl="/api/marketplace/listingFlag"
            restoreUrl="/api/marketplace/listingFlag/restore"
            failedTitle={resolveLanguageKey("failedTitle")}
            failedDescription={resolveLanguageKey("failedDescription")}
            titlePath="listing.title"
            innerRef={innerRef}
            sheetProps={({entity: row, setEntity}) => ({
                fetchId,
                onListLifecyclePatched: (patch: Partial<ListingFlag>) => {
                    setEntity({...row, ...patch});
                    onLifecyclePatched?.(patch);
                },
            })}
            extraDialogs={({action, setAction, entity: row, setEntity}) => (
                <>
                    {(action === "resolve" || action === "dismiss") && (
                        <ChangeListingFlagLifecycleAction
                            listingFlagId={row._id}
                            listingFlagTitle={row.listing?.title}
                            verb={action as ListingFlagLifecycleVerb}
                            openAlert
                            url={`/api/marketplace/listingFlag/${action}`}
                            onSuccess={(patch: Partial<ListingFlag>) => {
                                setEntity({...row, ...patch});
                                onLifecyclePatched?.(patch);
                                setAction("");
                            }}
                            onCancel={() => setAction("")}
                        />
                    )}
                </>
            )}
        >
            {({entity: row, read, setAction}) => (
                <>
                    {/* Named by the flagged listing and why; the status is the tone badge (UX-01, UX-02). */}
                    <EntityCard.Header
                        titlePath="listing.title"
                        title={[row.listing?.title, accessFieldPathExists(read, "reason") ? String(resolveLanguageKey(`reason_values.${row.reason}`)) : ""].filter(Boolean).join(" · ")}
                        badgesBesideTitle
                        badges={
                            <StatusBadge
                                tableConfigKey="listingflags"
                                field="status"
                                value={accessFieldPathExists(read, "status") ? row.status : undefined}
                                label={String(resolveLanguageKey(`status_values.${row.status}`))}
                            />
                        }
                    >
                        <ResolveListingFlagDropdown listingFlag={row} onAction={setAction} />
                        <DismissListingFlagDropdown listingFlag={row} onAction={setAction} />
                    </EntityCard.Header>
                    <EntityCard.Body>
                        <EntityCardRow
                            icon={IconUser}
                            label={resolveLanguageKey("reporter")}
                            tooltip={resolveLanguageKey("reporter")}
                            path="user"
                            type="user"
                            value={row.user}
                        />
                        {row.createdAt ? (
                            <EntityCardRow
                                icon={IconCalendarEvent}
                                label={resolveLanguageKey("reportedAt")}
                                tooltip={resolveLanguageKey("reportedAt")}
                                path="createdAt"
                                type="date"
                                value={row.createdAt}
                            />
                        ) : null}
                    </EntityCard.Body>
                </>
            )}
        </EntityCard>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/listingFlags/center/cardView/listingFlagCard.tsx"),
    withDebug(true, true, "listingflags"),
)(ListingFlagCard);
