// (C) 2021 GoodData Corporation
import { createSelector } from "@reduxjs/toolkit";
import { ObjRef, serializeObjRef } from "@gooddata/sdk-model";
import invariant from "ts-invariant";
import { DashboardState } from "../types";
import { LayoutState } from "./layoutState";
import { IDashboardLayout, IDashboardLayoutItem, IWidget } from "@gooddata/sdk-backend-spi";
import { isInsightPlaceholderWidget, isKpiPlaceholderWidget } from "../../types/layoutTypes";
import { createUndoableCommandsMapping } from "../_infra/undoEnhancer";
import memoize from "lodash/memoize";
import { newMapForObjectWithIdentity } from "../../../_staging/metadata/objRefMap";

const selectSelf = createSelector(
    (state: DashboardState) => state,
    (state) => state.layout,
);

/**
 * This selector returns current layout's stash. This stash can contain items that were removed from the layout with the
 * intent of further using the item elsewhere on the layout. The stash is a mapping of stashIdentifier to an array
 * of stashed items. The stash identifiers and stash usage is fully under control of the user.
 *
 * @internal
 */
export const selectStash = createSelector(selectSelf, (layoutState: LayoutState) => {
    return layoutState.stash;
});

/**
 * This selector returns commands that impacted the layout and can now be undone.
 *
 * @internal
 */
export const selectUndoableLayoutCommands = createSelector(selectSelf, (layoutState: LayoutState) => {
    return createUndoableCommandsMapping(layoutState);
});

/**
 * This selector returns dashboard's layout. It is expected that the selector is called only after the layout state
 * is correctly initialized. Invocations before initialization lead to invariant errors.
 *
 * @alpha
 */
export const selectLayout = createSelector(selectSelf, (layoutState: LayoutState) => {
    invariant(layoutState.layout, "attempting to access uninitialized layout state");

    return layoutState.layout;
});

function isItemWithBaseWidget(obj: IDashboardLayoutItem<unknown>): obj is IDashboardLayoutItem {
    const widget = obj.widget;
    return !isKpiPlaceholderWidget(widget) && !isInsightPlaceholderWidget(widget);
}

/**
 * This selector returns the basic dashboard layout that does not contain any client-side extensions.
 *
 * TODO: we need to get to a point where this selector is not needed. the layout component needs to recognize that the
 *  layout may contain client-side customizations. Furthermore, the dashboard saving should be enhanced so that the
 *  client-side customization can also be persisted.
 *
 * @internal
 */
export const selectBasicLayout = createSelector(selectLayout, (layout) => {
    const dashboardLayout: IDashboardLayout = {
        ...layout,
        sections: layout.sections.map((section) => {
            return {
                ...section,
                items: section.items.filter(isItemWithBaseWidget),
            };
        }),
    };

    return dashboardLayout;
});

/**
 * Selects dashboard widgets in an obj ref to widget map. This map will include all insight and all KPI widgets - those
 * that are persisted as part of the dashboard.
 *
 * The 'ephemeral' widgets such as placeholders that are not persisted and cannot be referenced using a `ref` will naturally
 * not be included in this map.
 *
 * @internal
 */
export const selectWidgetsMap = createSelector(selectLayout, (layout) => {
    const items: IWidget[] = [];

    for (const section of layout.sections) {
        for (const item of section.items) {
            if (!item.widget) {
                continue;
            }

            if (item.widget.type === "insight" || item.widget.type === "kpi") {
                items.push(item.widget as IWidget);
            }
        }
    }

    return newMapForObjectWithIdentity(items);
});

/**
 * Selects widget by its ref.
 *
 * @alpha
 */
export const selectWidgetByRef = memoize(
    (ref: ObjRef | undefined) => {
        return createSelector(selectWidgetsMap, (widgetMap) => {
            if (!ref) {
                return;
            }

            return widgetMap.get(ref);
        });
    },
    (ref) => ref && serializeObjRef(ref),
);
