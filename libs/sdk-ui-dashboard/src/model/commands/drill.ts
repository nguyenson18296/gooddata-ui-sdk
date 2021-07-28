// (C) 2021 GoodData Corporation
import { IDashboardCommand } from "./base";
import {
    IDrillToAttributeUrl,
    IDrillToCustomUrl,
    IDrillToDashboard,
    IDrillToInsight,
    IDrillToLegacyDashboard,
} from "@gooddata/sdk-backend-spi";
import { IInsight } from "@gooddata/sdk-model";
import { DashboardDrillContext, IDashboardDrillEvent, IDrillDownDefinition } from "../../types";

/**
 * @alpha
 */
export interface Drill extends IDashboardCommand {
    readonly type: "GDC.DASH/CMD.DRILL";
    readonly payload: {
        /**
         * Original drill event, that triggered this particular drill interaction.
         */
        readonly drillEvent: IDashboardDrillEvent;
        /**
         * Context in which the drill interaction was triggered (widget and insight details - if available).
         */
        readonly drillContext: DashboardDrillContext;
    };
}

/**
 * Creates the {@link Drill} command.
 * Dispatching this command will result into dispatching {@link DashboardDrillTriggered} event.
 *
 * This is general dashboard drill command with details about all possible more granular drill interactions that can follow.
 * Reason for this general drill command is that it may happen that multiple drill interactions are possible for one drill event.
 *
 * Example: some attribute on the insight has drill down set and also widget has drill to insight set. Then this command must be dispatched with both
 * {@link @gooddata/sdk-ui-ext#IDrillDownDefinition} and {@link @gooddata/sdk-backend-spi#IDrillToInsight} definitions.
 *
 * - This must be always the first command that occurs after the drill interaction and must be dispatched before more granular drill commands.
 * - Specific drill commands that can follow this general drill command are: {@link DrillDown}, {@link DrillToInsight}, {@link DrillToDashboard},
 *   {@link DrillToCustomUrl}, {@link DrillToAttributeUrl}, {@link DrillToLegacyDashboard}
 *
 *
 * @alpha
 * @param drillEvent - original drill event, that triggered this particular drill interaction.
 * @param drillContext - context in which the drill interaction was triggered (widget and insight details - if available).
 * @param correlationId - optionally specify correlation id. It will be included in all events that will be emitted during the command processing.
 * @returns drill command
 */
export function drill(
    drillEvent: IDashboardDrillEvent,
    drillContext: DashboardDrillContext,
    correlationId?: string,
): Drill {
    return {
        type: "GDC.DASH/CMD.DRILL",
        correlationId,
        payload: {
            drillEvent,
            drillContext,
        },
    };
}

//
//
//

/**
 * @alpha
 */
export interface DrillDown extends IDashboardCommand {
    readonly type: "GDC.DASH/CMD.DRILL.DRILL_DOWN";
    readonly payload: {
        /**
         * Insight to which the drill down should be applied.
         */
        readonly insight: IInsight;
        /**
         * Drill down definition to apply.
         */
        readonly drillDefinition: IDrillDownDefinition;
        /**
         * Original drill event, that triggered this particular drill interaction.
         */
        readonly drillEvent: IDashboardDrillEvent;
    };
}

/**
 * Creates the {@link DrillDown} command.
 * Dispatching this command will result into applying drill down definition to the provided insight (result of the drill down application
 * depends on the particular visualization type) and dispatching {@link DashboardDrillDownTriggered} event that will contain it.
 *
 * In the default dashboard implementation dispatching this command will also result into opening drill dialog with the insight
 * that has this particular drill down definition applied.
 *
 * @alpha
 * @param insight - insight to which the drill down should be applied.
 * @param drillDefinition - drill definition to apply.
 * @param drillEvent - original drill event, that triggered this particular drill interaction.
 * @param correlationId - optionally specify correlation id. It will be included in all events that will be emitted during the command processing.
 * @returns drill down command
 */
export function drillDown(
    insight: IInsight,
    drillDefinition: IDrillDownDefinition,
    drillEvent: IDashboardDrillEvent,
    correlationId?: string,
): DrillDown {
    return {
        type: "GDC.DASH/CMD.DRILL.DRILL_DOWN",
        correlationId,
        payload: {
            insight,
            drillDefinition,
            drillEvent,
        },
    };
}

//
//
//

/**
 * @alpha
 */
export interface DrillToInsight extends IDashboardCommand {
    readonly type: "GDC.DASH/CMD.DRILL.DRILL_TO_INSIGHT";
    readonly payload: {
        /**
         * Drill definition with the target insight.
         */
        readonly drillDefinition: IDrillToInsight;
        /**
         * Original drill event, that triggered this particular drill interaction.
         */
        readonly drillEvent: IDashboardDrillEvent;
    };
}

/**
 * Creates the {@link DrillToInsight} command.
 * Dispatching this command will result into applying the drill intersection filters to the target insight
 * and dispatching {@link DashboardDrillToInsightTriggered} event that will contain it.
 *
 * In the default dashboard implementation this command will also result into opening the drill dialog with the target insight
 * that has the drill intersection filters applied.
 *
 * @alpha
 * @param drillDefinition - drill definition with the target insight.
 * @param drillEvent - original drill event, that triggered this particular drill interaction.
 * @param correlationId - optionally specify correlation id. It will be included in all events that will be emitted during the command processing.
 * @returns drill to insight command
 */
export function drillToInsight(
    drillDefinition: IDrillToInsight,
    drillEvent: IDashboardDrillEvent,
    correlationId?: string,
): DrillToInsight {
    return {
        type: "GDC.DASH/CMD.DRILL.DRILL_TO_INSIGHT",
        correlationId,
        payload: {
            drillDefinition,
            drillEvent,
        },
    };
}

//
//
//

/**
 * @alpha
 */
export interface DrillToDashboard extends IDashboardCommand {
    readonly type: "GDC.DASH/CMD.DRILL.DRILL_TO_DASHBOARD";
    readonly payload: {
        /**
         * Drill definition with the target dashboard.
         */
        readonly drillDefinition: IDrillToDashboard;
        /**
         * Original drill event, that triggered this particular drill interaction.
         */
        readonly drillEvent: IDashboardDrillEvent;
    };
}

/**
 * Creates the {@link DrillToDashboard} command.
 * Dispatching this command will result into getting the drill intersection filters that can be applied to the target dashboard
 * and dispatching {@link DashboardDrillToDashboardTriggered} event that will contain them.
 *
 * @alpha
 * @param drillDefinition - drill definition with the target dashboard.
 * @param drillEvent - original drill event, that triggered this particular drill interaction.
 * @param correlationId - optionally specify correlation id. It will be included in all events that will be emitted during the command processing.
 * @returns drill to dashboard command
 */
export function drillToDashboard(
    drillDefinition: IDrillToDashboard,
    drillEvent: IDashboardDrillEvent,
    correlationId?: string,
): DrillToDashboard {
    return {
        type: "GDC.DASH/CMD.DRILL.DRILL_TO_DASHBOARD",
        correlationId,
        payload: {
            drillDefinition,
            drillEvent,
        },
    };
}

//
//
//

/**
 * @alpha
 */
export interface DrillToCustomUrl extends IDashboardCommand {
    readonly type: "GDC.DASH/CMD.DRILL.DRILL_TO_CUSTOM_URL";
    readonly payload: {
        /**
         * Drill definition with the custom url to resolve.
         */
        readonly drillDefinition: IDrillToCustomUrl;
        /**
         * Original drill event, that triggered this particular drill interaction.
         */
        readonly drillEvent: IDashboardDrillEvent;
    };
}

/**
 * Creates the {@link DrillToCustomUrl} command.
 * Dispatching this command will result into resolving the target url
 * and dispatching {@link DashboardDrillToCustomUrlTriggered} event that will contain it.
 *
 * Custom url can contain various identifier or attribute title placeholders, see:
 * {@link https://help.gooddata.com/pages/viewpage.action?pageId=86794855}
 *
 * @alpha
 * @param drillDefinition - drill definition with the target url to resolve.
 * @param drillEvent - original drill event, that triggered this particular drill interaction.
 * @param correlationId - optionally specify correlation id. It will be included in all events that will be emitted during the command processing.
 * @returns drill to custom url command
 * @alpha
 */
export function drillToCustomUrl(
    drillDefinition: IDrillToCustomUrl,
    drillEvent: IDashboardDrillEvent,
    correlationId?: string,
): DrillToCustomUrl {
    return {
        type: "GDC.DASH/CMD.DRILL.DRILL_TO_CUSTOM_URL",
        correlationId,
        payload: {
            drillDefinition,
            drillEvent,
        },
    };
}

//
//
//

/**
 * @alpha
 */
export interface DrillToAttributeUrl extends IDashboardCommand {
    readonly type: "GDC.DASH/CMD.DRILL.DRILL_TO_ATTRIBUTE_URL";
    readonly payload: {
        /**
         * Drill definition with the attribute url to resolve.
         */
        readonly drillDefinition: IDrillToAttributeUrl;
        /**
         * Original drill event, that triggered this particular drill interaction.
         */
        readonly drillEvent: IDashboardDrillEvent;
    };
}

/**
 * Creates the {@link DrillToAttributeUrl} command.
 * Dispatching this command will result into resolving the target attribute url
 * and dispatching {@link DashboardDrillToAttributeUrlTriggered} event that will contain it.
 *
 * For more details, see: {@link https://help.gooddata.com/pages/viewpage.action?pageId=86794855}
 *
 * @alpha
 * @param drillDefinition - drill definition with the target attribute url to resolve.
 * @param drillEvent - original drill event, that triggered this particular drill interaction.
 * @param correlationId - optionally specify correlation id. It will be included in all events that will be emitted during the command processing.
 * @returns drill to attribute url command
 * @alpha
 */
export function drillToAttributeUrl(
    drillDefinition: IDrillToAttributeUrl,
    drillEvent: IDashboardDrillEvent,
    correlationId?: string,
): DrillToAttributeUrl {
    return {
        type: "GDC.DASH/CMD.DRILL.DRILL_TO_ATTRIBUTE_URL",
        correlationId,
        payload: {
            drillDefinition,
            drillEvent,
        },
    };
}

//
//
//

/**
 * @alpha
 */
export interface DrillToLegacyDashboard extends IDashboardCommand {
    readonly type: "GDC.DASH/CMD.DRILL.DRILL_TO_LEGACY_DASHBOARD";
    readonly payload: {
        /**
         * Drill definition with the target dashboard.
         */
        readonly drillDefinition: IDrillToLegacyDashboard;
        /**
         * Original drill event, that triggered this particular drill interaction.
         */
        readonly drillEvent: IDashboardDrillEvent;
    };
}

/**
 * Creates the {@link DrillToLegacyDashboard} command.
 * Dispatching this command will result into dispatching {@link DashboardDrillToLegacyDashboardTriggered} event.
 *
 * Drill to legacy dashboard can be configured for Kpi widgets only.
 *
 * @alpha
 * @param drillDefinition - drill definition with the target dashboard.
 * @param drillEvent - original drill event, that triggered this particular drill interaction.
 * @param correlationId - optionally specify correlation id. It will be included in all events that will be emitted during the command processing.
 * @returns drill to legacy dashboard command
 * @alpha
 */
export function drillToLegacyDashboard(
    drillDefinition: IDrillToLegacyDashboard,
    drillEvent: IDashboardDrillEvent,
    correlationId?: string,
): DrillToLegacyDashboard {
    return {
        type: "GDC.DASH/CMD.DRILL.DRILL_TO_LEGACY_DASHBOARD",
        correlationId,
        payload: {
            drillDefinition,
            drillEvent,
        },
    };
}
