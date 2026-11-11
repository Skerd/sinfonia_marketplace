import {useMemo, useState} from "react";
import {compose} from "redux";
import withLanguage, {type WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import Header from "@coreModule/components/custom/header.tsx";
import {readPageHelp} from "@coreModule/components/custom/pageHelp.tsx";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@coreModule/components/ui/tabs.tsx";
import {ModelGraph} from "@coreModule/components/customUnchecked/systemMap/ModelGraph.tsx";
import {FlowDiagram} from "@coreModule/components/customUnchecked/systemMap/FlowDiagram.tsx";
import {CapabilitiesView} from "@coreModule/components/customUnchecked/systemMap/CapabilitiesView.tsx";
import {MARKETPLACE_SYSTEM_MAP} from "./systemMap.data.ts";

function MarketplaceSystemMap({resolveLanguageKey}: WithLanguageType) {
    const rk = (key: string) => String(resolveLanguageKey(key) ?? key);
    const [tab, setTab] = useState("models");
    // Nodes read as the panel's nouns in the user's language (UX-11), not as model class names.
    const dataset = useMemo(
        () => ({
            ...MARKETPLACE_SYSTEM_MAP,
            nodes: MARKETPLACE_SYSTEM_MAP.nodes.map((node) => ({...node, label: String(resolveLanguageKey(`nodes.${node.id}`) ?? node.label)})),
        }),
        [resolveLanguageKey],
    );

    return (
        <div className="flex h-full min-h-0 flex-col gap-4 p-6">
            <Header
                title={rk("title")}
                description={rk("description")}
                help={readPageHelp(resolveLanguageKey)}
            />

            <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-3">
                <TabsList className="w-fit shrink-0">
                    <TabsTrigger value="models">{rk("tabs.models")}</TabsTrigger>
                    <TabsTrigger value="flows">{rk("tabs.flows")}</TabsTrigger>
                    <TabsTrigger value="capabilities">{rk("tabs.capabilities")}</TabsTrigger>
                </TabsList>

                <TabsContent value="models" className="mt-0 flex-1 min-h-0 data-[state=inactive]:hidden">
                    <ModelGraph dataset={dataset} />
                </TabsContent>

                <TabsContent value="flows" className="mt-0 flex-1 min-h-0 data-[state=inactive]:hidden">
                    <FlowDiagram flows={MARKETPLACE_SYSTEM_MAP.flows} />
                </TabsContent>

                <TabsContent
                    value="capabilities"
                    className="mt-0 flex-1 min-h-0 overflow-y-auto data-[state=inactive]:hidden"
                >
                    <CapabilitiesView capabilities={MARKETPLACE_SYSTEM_MAP.capabilities} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default compose(
    withLanguage("src/modules/marketplace/clients/panel/private/marketplaceSystemMap/index.tsx"),
    withDebug(true, true),
)(MarketplaceSystemMap);
