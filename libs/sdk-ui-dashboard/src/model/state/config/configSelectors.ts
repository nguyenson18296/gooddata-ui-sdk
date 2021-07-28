// (C) 2021 GoodData Corporation
import { createSelector } from "@reduxjs/toolkit";
import { DashboardState } from "../types";
import invariant from "ts-invariant";

const selectSelf = createSelector(
    (state: DashboardState) => state,
    (state) => state.config,
);

/**
 * Returns dashboard's filter context. It is expected that the selector is called only after the filter
 * context state is correctly initialized. Invocations before initialization lead to invariant errors.
 *
 * @alpha
 */
export const selectConfig = createSelector(selectSelf, (configState) => {
    invariant(configState.config, "attempting to access uninitialized filter context state");

    return configState.config!;
});

/**
 * Returns workspace-level configuration for the of the date filter options and presets.
 *
 * Note: this configuration SHOULD be further augmented by the dashboard-level overrides to obtain
 * the effective date filter configuration.
 *
 * @alpha
 */
export const selectDateFilterConfig = createSelector(selectConfig, (state) => {
    return state.dateFilterConfig;
});

/**
 * Returns settings that are in effect for the current dashboard.
 *
 * @alpha
 */
export const selectSettings = createSelector(selectConfig, (state) => {
    return state.settings;
});

/**
 * Returns locale to use for internationalization of the dashboard.
 *
 * @alpha
 */
export const selectLocale = createSelector(selectConfig, (state) => {
    return state.locale;
});

/**
 * Returns number separators to use when rendering numeric values on charts or KPIs.
 *
 * @alpha
 */
export const selectSeparators = createSelector(selectConfig, (state) => {
    return state.separators;
});

/**
 * Returns the color palette for dashboard charts.
 *
 * @alpha
 */
export const selectColorPalette = createSelector(selectConfig, (state) => {
    return state.colorPalette;
});

/**
 * Returns the object availability configuration for this dashboard. Only objects that match the availability
 * criteria can appear in selections where user has pick an object to use for some purpose (for instance metric for
 * KPI or date dataset to filter by).
 *
 * @alpha
 */
export const selectObjectAvailabilityConfig = createSelector(selectConfig, (state) => {
    return state.objectAvailability;
});

/**
 * Returns Mapbox token.
 *
 * @alpha
 */
export const selectMapboxToken = createSelector(selectConfig, (state) => {
    return state.mapboxToken;
});

/**
 * Returns whether the Dashboard is executed in read-only mode.
 * Read-only mode disables any interactions that can alter the backend data.
 *
 * @alpha
 */
export const selectIsReadOnly = createSelector(selectConfig, (state) => {
    return state.isReadOnly;
});

/**
 * Returns whether the Dashboard is executed in embedded context.
 * In embedded mode, some interactions may be disabled.
 *
 * @alpha
 */
export const selectIsEmbedded = createSelector(selectConfig, (state) => {
    return state.isEmbedded;
});

/**
 * Returns whether the Dashboard is rendered in the export mode.
 * In export mode, some components can be hidden, or rendered differently.
 *
 * @internal
 */
export const selectIsExport = createSelector(selectConfig, (state) => {
    return state.isExport;
});

//
// FEATURE FLAGS
//

/**
 * Returns date format.
 *
 * @alpha
 */
export const selectDateFormat = createSelector(selectConfig, (state) => {
    return state.settings?.responsiveUiDateFormat;
});

/**
 * Returns whether the current user can schedule emails.
 *
 * @alpha
 */
export const selectEnableKPIDashboardSchedule = createSelector(selectConfig, (state) => {
    return state.settings?.enableKPIDashboardSchedule;
});

/**
 * Returns whether the current user can share scheduled email to other recipients.
 *
 * @alpha
 */
export const selectEnableKPIDashboardScheduleRecipients = createSelector(selectConfig, (state) => {
    return state.settings?.enableKPIDashboardScheduleRecipients;
});

/**
 * Returns current platform edition.
 *
 * @alpha
 */
export const selectPlatformEdition = createSelector(selectConfig, (state) => {
    return state.settings?.platformEdition ?? "enterprise";
});

/**
 * Returns whether comapny logo should be visible in embedded dashboard.
 *
 * @alpha
 */
export const selectEnableCompanyLogoInEmbeddedUI = createSelector(selectConfig, (state) => {
    return state.settings?.enableCompanyLogoInEmbeddedUI ?? false;
});
