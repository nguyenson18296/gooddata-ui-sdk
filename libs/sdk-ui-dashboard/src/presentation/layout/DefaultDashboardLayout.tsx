// (C) 2020 GoodData Corporation
import React, { useMemo } from "react";
import {
    isWidget,
    widgetId,
    widgetUri,
    isInsightWidget,
    isDashboardLayoutEmpty,
    IDashboardLayout,
} from "@gooddata/sdk-backend-spi";
import {
    ObjRef,
    IInsight,
    insightId,
    insightUri,
    areObjRefsEqual,
    objRefToString,
} from "@gooddata/sdk-model";

import {
    selectInsights,
    selectSettings,
    selectBasicLayout,
    useDashboardSelector,
    selectIsExport,
} from "../../model";
import { useDashboardComponentsContext } from "../dashboardContexts";

import { DashboardLayoutWidget } from "./DashboardLayoutWidget";
import { EmptyDashboardError } from "./EmptyDashboardError";
import { DashboardLayoutProps } from "./types";
import {
    DashboardLayout,
    DashboardLayoutBuilder,
    DashboardLayoutItemModifications,
    DashboardLayoutItemsSelector,
    validateDashboardLayoutWidgetSize,
} from "./DefaultDashboardLayoutRenderer";
import { DashboardLayoutPropsProvider, useDashboardLayoutProps } from "./DashboardLayoutPropsContext";

/**
 * Get dashboard layout for exports.
 *  - Create new extra rows if current row has width of widgets greater than 12
 *
 * @internal
 * @param layout - dashboard layout to modify
 * @returns transformed layout
 */
function getDashboardLayoutForExport(layout: IDashboardLayout): IDashboardLayout {
    const dashLayout = DashboardLayoutBuilder.for(layout);
    const layoutFacade = dashLayout.facade();
    const sections = layoutFacade.sections();
    const screenSplitSections = sections.map((section) => ({
        items: section.items().asGridRows("xl"),
        header: section.header(),
    }));

    dashLayout.removeSections();
    screenSplitSections.forEach((wrappedSection) => {
        wrappedSection.items.forEach((rowSection, index) => {
            dashLayout.addSection((section) => {
                rowSection.forEach((item) => {
                    if (index === 0) {
                        section.header(wrappedSection.header);
                    }
                    section.addItem(item.size().xl, (i) => i.widget(item.widget()));
                });
                return section;
            });
        });
    });

    return dashLayout.build();
}

const selectAllItemsWithInsights: DashboardLayoutItemsSelector = (items) =>
    items.filter((item) => item.isInsightWidgetItem());

/**
 * @internal
 */
export const DefaultDashboardLayoutInner = (): JSX.Element => {
    const {
        onFiltersChange,
        drillableItems,
        onDrill,
        onError,
        ErrorComponent: CustomError,
    } = useDashboardLayoutProps();

    const layout = useDashboardSelector(selectBasicLayout);
    const settings = useDashboardSelector(selectSettings);
    const insights = useDashboardSelector(selectInsights);
    const { ErrorComponent } = useDashboardComponentsContext({ ErrorComponent: CustomError });
    const isExport = useDashboardSelector(selectIsExport);

    const getInsightByRef = (insightRef: ObjRef): IInsight | undefined => {
        return insights.find((i) => areObjRefsEqual(i.insight.ref, insightRef));
    };

    const transformedLayout = useMemo(() => {
        const layoutWithRefs = DashboardLayoutBuilder.for(layout)
            .modifySections((section) =>
                section
                    .modifyItems(polluteWidgetRefsWithBothIdAndUri(getInsightByRef))
                    .modifyItems(
                        validateItemsSize(getInsightByRef, settings.enableKDWidgetCustomHeight!),
                        selectAllItemsWithInsights,
                    ),
            )
            .build();
        return isExport ? getDashboardLayoutForExport(layout) : layoutWithRefs;
    }, [layout, isExport]);

    return isDashboardLayoutEmpty(layout) ? (
        <EmptyDashboardError ErrorComponent={ErrorComponent} />
    ) : (
        <DashboardLayout
            className={isExport ? "export-mode" : ""}
            layout={transformedLayout}
            itemKeyGetter={(keyGetterProps) => {
                const widget = keyGetterProps.item.widget();
                if (isWidget(widget)) {
                    return objRefToString(widget.ref);
                }
                return keyGetterProps.item.index().toString();
            }}
            widgetRenderer={(renderProps) => {
                return (
                    <DashboardLayoutWidget
                        drillableItems={drillableItems}
                        onError={onError}
                        onDrill={onDrill}
                        onFiltersChange={onFiltersChange}
                        {...renderProps}
                    />
                );
            }}
            // When section headers are enabled, use default DashboardLayout sectionHeaderRenderer.
            // When turned off, render nothing.
            sectionHeaderRenderer={settings.enableSectionHeaders ? undefined : () => <React.Fragment />}
            enableCustomHeight={settings.enableKDWidgetCustomHeight}
        />
    );
};

/**
 * @alpha
 */
export const DefaultDashboardLayout = (props: DashboardLayoutProps): JSX.Element => {
    return (
        <DashboardLayoutPropsProvider {...props}>
            <DefaultDashboardLayoutInner />
        </DashboardLayoutPropsProvider>
    );
};

/**
 * Ensure that areObjRefsEqual() and other predicates will be working with uncontrolled user ref inputs in custom layout transformation and/or custom widget/item renderers
 */
const polluteWidgetRefsWithBothIdAndUri =
    (getInsightByRef: (insightRef: ObjRef) => IInsight | undefined): DashboardLayoutItemModifications =>
    (item) =>
        item.widget((c) => {
            let updatedContent = c;
            if (isWidget(updatedContent)) {
                updatedContent = {
                    ...updatedContent,
                    ref: {
                        ...updatedContent.ref,
                        uri: widgetUri(updatedContent),
                        identifier: widgetId(updatedContent),
                    },
                };
            }
            if (isInsightWidget(updatedContent)) {
                const insight = getInsightByRef(updatedContent.insight);
                updatedContent = {
                    ...updatedContent,
                    insight: {
                        ...updatedContent.insight,
                        uri: insightUri(insight!),
                        identifier: insightId(insight!),
                    },
                };
            }

            return updatedContent;
        });

const validateItemsSize =
    (
        getInsightByRef: (insightRef: ObjRef) => IInsight | undefined,
        enableKDWidgetCustomHeight: boolean,
    ): DashboardLayoutItemModifications =>
    (item) => {
        const widget = item.facade().widget();
        if (isInsightWidget(widget)) {
            const insight = getInsightByRef(widget.insight);
            const currentWidth = item.facade().size().xl.gridWidth;
            const currentHeight = item.facade().size().xl.gridHeight;
            const { validWidth, validHeight } = validateDashboardLayoutWidgetSize(
                currentWidth,
                currentHeight,
                "insight",
                insight!,
                { enableKDWidgetCustomHeight },
            );
            let validatedItem = item;
            if (currentWidth !== validWidth) {
                validatedItem = validatedItem.size({
                    xl: {
                        ...validatedItem.facade().size().xl,
                        gridWidth: validWidth,
                    },
                });
            }
            if (currentHeight !== validHeight) {
                validatedItem = validatedItem.size({
                    xl: {
                        ...validatedItem.facade().size().xl,
                        gridHeight: validHeight,
                    },
                });
            }

            return validatedItem;
        }
        return item;
    };
