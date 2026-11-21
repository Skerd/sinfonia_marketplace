import {compose} from "redux";
import {Link} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";

/** The visitor's own tasks live in the task board's account pages (D172); the portal account links there. */
function TasksAccountLinks({resolveLanguageKey}: WithLanguageType) {
    return (
        <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="lg" className="px-4">
                <Link to="/tasks/account/jobs">{resolveLanguageKey("myTasks")}</Link>
            </Button>
        </div>
    );
}

export default compose(withLanguage("src/modules/marketplace/clients/portal/tasksAccountLinks.tsx"))(TasksAccountLinks);
