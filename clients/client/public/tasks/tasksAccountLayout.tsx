import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import AccountShell from "@coreModule/clients/portal/account/accountShell.tsx";
import {useSectionBase} from "@coreModule/clients/portal/shared/sectionBase.tsx";

/** The task board's part of the visitor's account (D172): their own tasks; profile and security live in the portal's account. */
function TasksAccountLayout({resolveLanguageKey}: WithLanguageType) {
    const base = useSectionBase();
    return (
        <AccountShell
            navLabel={resolveLanguageKey("navLabel")}
            items={[
                {to: "/account", end: true, label: resolveLanguageKey("navAccount")},
                {to: `${base}/account/jobs`, end: false, label: resolveLanguageKey("navTasks")},
            ]}
        />
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/client/public/tasks/tasksAccountLayout.tsx"),
    withDebug(true, true),
)(TasksAccountLayout);
