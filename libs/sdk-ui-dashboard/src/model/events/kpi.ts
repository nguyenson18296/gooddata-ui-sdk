// (C) 2021 GoodData Corporation

import { IDashboardEvent } from "./base";
import { ObjRef } from "@gooddata/sdk-model";
import { WidgetFilterSettings, WidgetHeader } from "../types/widgetTypes";
import { DashboardContext } from "../types/commonTypes";
import { IKpiWidget, IKpiWidgetDefinition, ILegacyKpi } from "@gooddata/sdk-backend-spi";

/**
 * This event is emitted when the dashboard's KPI Widget header is modified.
 *
 * @alpha
 */
export interface DashboardKpiWidgetHeaderChanged extends IDashboardEvent {
    readonly type: "GDC.DASH/EVT.KPI_WIDGET.HEADER_CHANGED";
    readonly payload: {
        /**
         * Reference to changed KPI Widget.
         */
        readonly ref: ObjRef;

        /**
         * New value of the widget header.
         */
        readonly header: WidgetHeader;
    };
}

export function kpiWidgetHeaderChanged(
    ctx: DashboardContext,
    ref: ObjRef,
    header: WidgetHeader,
    correlationId?: string,
): DashboardKpiWidgetHeaderChanged {
    return {
        type: "GDC.DASH/EVT.KPI_WIDGET.HEADER_CHANGED",
        ctx,
        correlationId,
        payload: {
            ref,
            header,
        },
    };
}

//
//
//

/**
 * This event is emitted when the dashboard's KPI Widget measure is modified - the KPI now shows value for
 * different measure. The change of measure to use may be accompanied with a change of the KPI header (change of
 * title). In that case new value of header is also included in the event.
 *
 * @alpha
 */
export interface DashboardKpiWidgetMeasureChanged extends IDashboardEvent {
    readonly type: "GDC.DASH/EVT.KPI_WIDGET.MEASURE_CHANGED";
    readonly payload: {
        /**
         * Reference to changed KPI Widget.
         */
        readonly ref: ObjRef;

        /**
         * New setup of KPI. Includes the measure used to calculate KPI and the comparison settings that
         * are in effect.
         *
         * Note: the comparison may be 'none' - meaning
         *
         * XXX: consider including measure metadata as well
         */
        readonly kpi: ILegacyKpi;

        /**
         * If a new header was also set while changing the measure, then the new header value is included here.
         */
        readonly header?: WidgetHeader;
    };
}

export function kpiWidgetMeasureChanged(
    ctx: DashboardContext,
    ref: ObjRef,
    kpi: ILegacyKpi,
    header?: WidgetHeader,
    correlationId?: string,
): DashboardKpiWidgetMeasureChanged {
    return {
        type: "GDC.DASH/EVT.KPI_WIDGET.MEASURE_CHANGED",
        ctx,
        correlationId,
        payload: {
            ref,
            kpi,
            header,
        },
    };
}

//
//
//

/**
 * This event is emitted when dashboard's KPI Widget filter settings are modified.
 *
 * @alpha
 */
export interface DashboardKpiWidgetFilterSettingsChanged extends IDashboardEvent {
    readonly type: "GDC.DASH/EVT.KPI_WIDGET.FILTER_SETTINGS_CHANGED";
    readonly payload: {
        /**
         * Reference to changed KPI Widget.
         */
        readonly ref: ObjRef;

        /**
         * New filter settings that are now in effect for the widget.
         */
        readonly filterSettings: WidgetFilterSettings;
    };
}

export function kpiWidgetFilterSettingsChanged(
    ctx: DashboardContext,
    ref: ObjRef,
    filterSettings: WidgetFilterSettings,
    correlationId?: string,
): DashboardKpiWidgetFilterSettingsChanged {
    return {
        type: "GDC.DASH/EVT.KPI_WIDGET.FILTER_SETTINGS_CHANGED",
        ctx,
        correlationId,
        payload: {
            ref,
            filterSettings,
        },
    };
}

//
//
//

/**
 * This event is emitted when dashboard's KPI Widget has its comparison type changed. The event includes
 * the new definition of the KPI that has uses same measure as before however has new setup of the over-time
 * comparison.
 *
 * @alpha
 */
export interface DashboardKpiWidgetComparisonChanged extends IDashboardEvent {
    readonly type: "GDC.DASH/EVT.KPI_WIDGET.COMPARISON_CHANGED";
    readonly payload: {
        /**
         * Reference to changed KPI Widget.
         */
        readonly ref: ObjRef;

        /**
         * New setup of KPI. Includes the measure used to calculate KPI and the comparison settings that
         * are in effect.
         *
         * Note: the comparison may be 'none' - meaning
         */
        readonly kpi: ILegacyKpi;
    };
}

export function kpiWidgetComparisonChanged(
    ctx: DashboardContext,
    ref: ObjRef,
    kpi: ILegacyKpi,
    correlationId?: string,
): DashboardKpiWidgetComparisonChanged {
    return {
        type: "GDC.DASH/EVT.KPI_WIDGET.COMPARISON_CHANGED",
        ctx,
        correlationId,
        payload: {
            ref,
            kpi,
        },
    };
}

//
//
//

/**
 * This event is emitted after any change to KPI Widget configuration. It contains the entire new state of the
 * KPI Widget.
 *
 * @alpha
 */
export interface DashboardKpiWidgetChanged extends IDashboardEvent {
    readonly type: "GDC.DASH/EVT.KPI_WIDGET.WIDGET_CHANGED";
    readonly payload: {
        /**
         *
         */
        kpiWidget: IKpiWidget | IKpiWidgetDefinition;
    };
}

export function kpiWidgetChanged(
    ctx: DashboardContext,
    kpiWidget: IKpiWidget,
    correlationId?: string,
): DashboardKpiWidgetChanged {
    return {
        type: "GDC.DASH/EVT.KPI_WIDGET.WIDGET_CHANGED",
        ctx,
        correlationId,
        payload: {
            kpiWidget,
        },
    };
}
