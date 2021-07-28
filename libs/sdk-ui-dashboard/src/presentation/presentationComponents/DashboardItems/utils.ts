// (C) 2020-2021 GoodData Corporation
import { WidgetType } from "@gooddata/sdk-backend-spi";
import { VisType } from "@gooddata/sdk-ui";

const typeVisTypeCssClassMapping: {
    [visType in VisType]?: string;
} = {
    headline: "viz-type-headline",
    xirr: "viz-type-xirr",
    column: "viz-type-column",
    bar: "viz-type-bar",
    line: "viz-type-line",
    area: "viz-type-area",
    combo: "viz-type-combo",
    combo2: "viz-type-combo2",
    scatter: "viz-type-scatter",
    bubble: "viz-type-bubble",
    pie: "viz-type-pie",
    donut: "viz-type-donut",
    treemap: "viz-type-treemap",
    heatmap: "viz-type-heatmap",
    table: "viz-type-table",
    pushpin: "viz-type-pushpin",
};

export function getVisTypeCssClass(widgetType: WidgetType, type?: VisType): string {
    if (widgetType === "kpi") {
        return "viz-type-kpi";
    }

    return typeVisTypeCssClassMapping[type!] ?? "";
}
