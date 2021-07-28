// (C) 2021 GoodData Corporation
import { SagaIterator } from "redux-saga";
import { select, call, put } from "redux-saga/effects";
import { DashboardContext } from "../../types/commonTypes";
import { internalErrorOccurred } from "../../events/general";
import { DrillToDashboard } from "../../commands/drill";
import {
    DashboardDrillToDashboardResolved,
    drillToDashboardResolved,
    drillToDashboardRequested,
} from "../../events/drill";
import { selectFilterContext } from "../../state/filterContext/filterContextSelectors";
import { selectWidgetByRef } from "../../state/layout/layoutSelectors";
import { IInsightWidget } from "@gooddata/sdk-backend-spi";
import { IDashboardFilter } from "../../../types";
import { filterContextToFiltersForWidget } from "../../../converters";
import {
    DrillEventIntersectionElementHeader,
    IDrillEventIntersectionElement,
    IDrillIntersectionAttributeItem,
    isDrillIntersectionAttributeItem,
} from "@gooddata/sdk-ui";
import {
    areObjRefsEqual,
    filterObjRef,
    IAttributeFilter,
    newPositiveAttributeFilter,
    ObjRef,
    objRefToString,
} from "@gooddata/sdk-model";
import { selectCatalogDateAttributes } from "../../state/catalog/catalogSelectors";
import uniqBy from "lodash/uniqBy";
import flow from "lodash/flow";

export function* drillToDashboardHandler(
    ctx: DashboardContext,
    cmd: DrillToDashboard,
): SagaIterator<DashboardDrillToDashboardResolved> {
    // eslint-disable-next-line no-console
    console.debug("handling drill to dashboard", cmd, "in context", ctx);

    try {
        yield put(
            drillToDashboardRequested(
                ctx,
                cmd.payload.drillDefinition,
                cmd.payload.drillEvent,
                cmd.correlationId,
            ),
        );

        const filterContext: ReturnType<typeof selectFilterContext> = yield select(selectFilterContext);
        const widget: IInsightWidget = yield select(selectWidgetByRef(cmd.payload.drillEvent.widgetRef!));
        const widgetFilters = filterContextToFiltersForWidget(filterContext, widget);
        const dateAttributes: ReturnType<typeof selectCatalogDateAttributes> = yield select(
            selectCatalogDateAttributes,
        );

        const drillFilters = convertIntersectionToAttributeFilters(
            cmd.payload.drillEvent.drillContext.intersection!,
            dateAttributes.map((dA) => dA.attribute.ref),
        );

        const uniqueFilters = uniqBy(
            [
                // Drill filters has higher priority than the widget filters
                ...drillFilters,
                ...widgetFilters,
            ],
            flow(filterObjRef, objRefToString),
        );

        const resolvedFilters: IDashboardFilter[] = yield call(
            getResolvedFiltersForWidget,
            ctx,
            widget,
            uniqueFilters,
        );

        return drillToDashboardResolved(
            ctx,
            resolvedFilters,
            cmd.payload.drillDefinition,
            cmd.payload.drillEvent,
            cmd.correlationId,
        );
    } catch (e) {
        throw internalErrorOccurred(
            ctx,
            "An unexpected error has occurred while drilling to dashboard",
            e,
            cmd.correlationId,
        );
    }
}

function getResolvedFiltersForWidget(
    ctx: DashboardContext,
    widget: IInsightWidget,
    filters: IDashboardFilter[],
) {
    return ctx.backend.workspace(ctx.workspace).dashboards().getResolvedFiltersForWidget(widget, filters);
}
/**
 *  For correct drill intersection that should be converted into AttributeFilters must be drill intersection:
 *  1. AttributeItem
 *  2. Not a date attribute
 */
function filterIntersection(
    intersection: DrillEventIntersectionElementHeader,
    dateDataSetsAttributesRefs: ObjRef[],
): boolean {
    const attributeItem = isDrillIntersectionAttributeItem(intersection) ? intersection : undefined;
    const ref = attributeItem?.attributeHeader?.formOf?.ref;

    return ref ? !dateDataSetsAttributesRefs.some((ddsRef) => areObjRefsEqual(ddsRef, ref)) : false;
}

export function convertIntersectionToAttributeFilters(
    intersection: IDrillEventIntersectionElement[],
    dateDataSetsAttributesRefs: ObjRef[],
): IAttributeFilter[] {
    return intersection
        .map((i) => i.header)
        .filter((i: DrillEventIntersectionElementHeader) => filterIntersection(i, dateDataSetsAttributesRefs))
        .filter(isDrillIntersectionAttributeItem)
        .map(
            (h: IDrillIntersectionAttributeItem): IAttributeFilter =>
                newPositiveAttributeFilter(h.attributeHeader.ref, { uris: [h.attributeHeaderItem.uri] }),
        );
}
