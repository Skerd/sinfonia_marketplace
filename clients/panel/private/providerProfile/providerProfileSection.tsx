import {compose} from "redux";
import {useMemo, useState, type ReactNode} from "react";
import {IconPencil} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import {useViewConfigState} from "@coreModule/helpers/hooks/useViewConfig.ts";
import {hasAccessPath} from "@coreModule/components/viewEngine/engine/access.ts";
import EditFormViewRenderer from "@coreModule/components/viewEngine/editFormViewRenderer.tsx";
import SheetMediaFilesStrip from "@coreModule/components/viewEngine/sheet/widgets/sheetMediaFilesStrip.tsx";
import WeeklyHours from "@coreModule/components/viewEngine/sheet/widgets/weeklyHours.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import type {ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {editProviderProfileFormSchema} from "armonia/src/modules/marketplace/api/marketplace/private/providerProfile/editProviderProfile.form.validator.ts";
import type {ProviderProfile} from "armonia/src/modules/marketplace/api/marketplace/private/providerProfile/providerProfile.dto.ts";
import {providerProfileInitialValues, type ProviderProfileFormValues} from "./editProviderProfile.tsx";

export type ProviderProfileSectionField = "bio" | "skills" | "timezone" | "availability" | "portfolio";

/** Section heading per field — keys from the edit form dictionary this component shares. */
const SECTION_TITLE_KEYS: Record<ProviderProfileSectionField, string> = {
    bio: "form.bioLabel",
    skills: "form.skillsLabel",
    timezone: "form.timezoneLabel",
    availability: "form.section.availability",
    portfolio: "form.section.portfolio",
};

function findFieldNode(nodes: ViewNode[] | undefined, name: string): ViewNode | undefined {
    for (const node of nodes ?? []) {
        if (node.field?.name === name) return node;
        const found = findFieldNode(node.children, name);
        if (found) return found;
    }
    return undefined;
}

type ProviderProfileSectionProps = WithLanguageType & WithAxiosType<ProviderProfile, Partial<ProviderProfileFormValues>> & {
    profile: ProviderProfile;
    field: ProviderProfileSectionField;
    onSaved: () => void;
};

/** One provider-profile field shown read-only, edited and saved on its own (PATCH sends only this field). */
function ProviderProfileSection({
    profile,
    field,
    onSaved,
    resolveLanguageKey,
    languageCode,
    loading,
    innerRef,
    onPost,
}: ProviderProfileSectionProps) {
    const [editing, setEditing] = useState(false);
    const {read, write} = useAccess("providerProfiles");
    const {config} = useViewConfigState("providerprofiles", "form:edit");
    const writeFields = useMemo(() => (write || {}) as Record<string, unknown>, [write]);
    const readFields = useMemo(() => (read || {}) as Record<string, unknown>, [read]);
    const formSchema = useMemo(
        () => editProviderProfileFormSchema(languageCode, resolveLanguageKey("form"), writeFields, readFields),
        [languageCode, resolveLanguageKey, writeFields, readFields],
    );
    const editConfig = useMemo(() => {
        const node = findFieldNode(config?.nodes, field);
        if (!config || !node?.field) return undefined;
        // Section header owns the title — clear the field label / FormRepeater section title
        // so toggling edit does not swap one heading for another and shift the layout.
        return {
            ...config,
            nodes: [{
                ...node,
                field: {
                    ...node.field,
                    label: undefined,
                    widgetProps: node.field.widgetProps
                        ? {...node.field.widgetProps, title: undefined}
                        : undefined,
                },
            }],
        };
    }, [config, field]);
    const initialValues = useMemo(
        () => ({_id: profile._id, [field]: providerProfileInitialValues(profile, writeFields)[field]}),
        [profile, writeFields, field],
    );

    if (!read || !hasAccessPath(readFields, field)) return null;
    const canEdit = !!editConfig && !!write && hasAccessPath(writeFields, field);

    const empty = <p className="text-sm text-muted-foreground">{resolveLanguageKey("account.empty")}</p>;
    let display: ReactNode;
    if (field === "bio") {
        display = profile.bio ? <p className="whitespace-pre-wrap text-sm">{profile.bio}</p> : empty;
    } else if (field === "skills") {
        display = profile.skills?.length ? (
            <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}
            </div>
        ) : empty;
    } else if (field === "timezone") {
        display = profile.timezone
            ? <p className="text-sm">{profile.timezone}</p>
            : <p className="text-sm text-muted-foreground">{resolveLanguageKey("account.timezoneDefault")}</p>;
    } else if (field === "availability") {
        // The same compact week as the sheet (UX-08).
        display = profile.availability?.length ? (
            <WeeklyHours rows={profile.availability} closedLabel={String(resolveLanguageKey("account.notAvailable"))} />
        ) : empty;
    } else {
        display = profile.portfolio?.length ? (
            <SheetMediaFilesStrip media={profile.portfolio} resolveLanguageKey={resolveLanguageKey} />
        ) : empty;
    }

    return (
        <section className="flex flex-col gap-(--density-pad) rounded-lg border border-border/50 p-(--density-pad)">
            {/* min-h-7 matches Button size="sm" so the title row stays put when Edit hides. */}
            <div className="flex min-h-7 items-center justify-between gap-2">
                <h4 className="text-sm font-medium">{resolveLanguageKey(SECTION_TITLE_KEYS[field])}</h4>
                {canEdit && !editing && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
                        <IconPencil size={14} />
                        {resolveLanguageKey("account.edit")}
                    </Button>
                )}
            </div>
            {editing && editConfig ? (
                <EditFormViewRenderer<Partial<ProviderProfileFormValues>>
                    config={editConfig}
                    resolveLanguageKey={resolveLanguageKey}
                    formSchema={formSchema}
                    initialValues={initialValues}
                    loading={loading}
                    loadingDataErrorTitle="errorTitle"
                    loadingDataErrorDescription="errorDescription"
                    innerRef={innerRef}
                    onSubmit={(data) => onPost({_id: profile._id, [field]: data[field]})}
                    onCancel={() => setEditing(false)}
                    onSuccess={() => {
                        setEditing(false);
                        onSaved();
                    }}
                    writeAccess={writeFields}
                    hideChrome
                />
            ) : (
                display
            )}
        </section>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/providerProfile/editProviderProfile.tsx"),
    withAxios<ProviderProfile, Partial<ProviderProfileFormValues>>({url: "/api/marketplace/providerProfile", method: "PATCH", data: {}}, true),
    withDebug(true, true, "providerProfiles"),
)(ProviderProfileSection);
