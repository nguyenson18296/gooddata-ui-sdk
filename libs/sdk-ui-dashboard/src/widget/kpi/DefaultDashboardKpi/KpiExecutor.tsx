// (C) 2020 GoodData Corporation
import React, { useCallback, useMemo, useState, useEffect } from "react";
import { injectIntl, IntlShape, WrappedComponentProps } from "react-intl";
import compact from "lodash/compact";
import isNil from "lodash/isNil";
import isNumber from "lodash/isNumber";
import round from "lodash/round";
import {
    IAnalyticalBackend,
    IKpiWidget,
    ISeparators,
    IUserWorkspaceSettings,
    IWidgetAlert,
} from "@gooddata/sdk-backend-spi";
import {
    IMeasure,
    IPoPMeasureDefinition,
    IPreviousPeriodMeasureDefinition,
    isMeasureFormatInPercent,
    ObjRef,
} from "@gooddata/sdk-model";
import {
    convertDrillableItemsToPredicates,
    createNumberJsFormatter,
    DataViewFacade,
    IDataSeries,
    IDrillableItem,
    IDrillEventContext,
    IErrorProps,
    IHeaderPredicate,
    ILoadingProps,
    isNoDataSdkError,
    isSomeHeaderPredicateMatched,
    NoDataSdkError,
    OnError,
    useExecutionDataView,
} from "@gooddata/sdk-ui";

import { filterContextItemsToFiltersForWidget, filterContextToFiltersForWidget } from "../../../converters";
import { useDashboardComponentsContext } from "../../../dashboardContexts";
import { selectPermissions, selectSettings, selectUser, useDashboardSelector } from "../../../model";
import { DashboardItemHeadline } from "../../../presentationComponents";
import { IDashboardFilter, OnFiredDashboardViewDrillEvent } from "../../../types";

import { KpiRenderer } from "./KpiRenderer";
import { KpiAlertDialogWrapper } from "./KpiAlertDialogWrapper";
import { useKpiAlertOperations } from "./useKpiAlertOperations";
import { IKpiAlertResult, IKpiResult } from "./types";
import {
    DashboardItemWithKpiAlert,
    evaluateAlertTriggered,
    getBrokenAlertFiltersBasicInfo,
} from "./KpiAlerts";
import { dashboardFilterToFilterContextItem, stripDateDatasets } from "./utils/filterUtils";

interface IKpiExecutorProps {
    dashboardRef: ObjRef;
    kpiWidget: IKpiWidget;
    primaryMeasure: IMeasure;
    secondaryMeasure?: IMeasure<IPoPMeasureDefinition> | IMeasure<IPreviousPeriodMeasureDefinition>;
    alert?: IWidgetAlert;
    /**
     * Filters that should be used for the execution
     */
    effectiveFilters?: IDashboardFilter[];
    /**
     * All filters that are currently set (this is useful for broken alert filters, where we need even
     * the filters ignored for execution)
     */
    allFilters?: IDashboardFilter[];
    onFiltersChange?: (filters: IDashboardFilter[]) => void;
    drillableItems?: Array<IDrillableItem | IHeaderPredicate>;
    onDrill?: OnFiredDashboardViewDrillEvent;
    onError?: OnError;
    backend: IAnalyticalBackend;
    workspace: string;
    separators: ISeparators;
    disableDrillUnderline?: boolean;
    isReadOnly?: boolean;
    ErrorComponent?: React.ComponentType<IErrorProps>;
    LoadingComponent?: React.ComponentType<ILoadingProps>;
}

const KpiExecutorCore: React.FC<IKpiExecutorProps & WrappedComponentProps> = ({
    dashboardRef,
    kpiWidget,
    primaryMeasure,
    secondaryMeasure,
    alert,
    allFilters,
    effectiveFilters,
    onFiltersChange,
    drillableItems,
    onDrill,
    onError,
    backend,
    workspace,
    separators,
    disableDrillUnderline,
    intl,
    isReadOnly,
    ErrorComponent: CustomErrorComponent,
    LoadingComponent: CustomLoadingComponent,
}) => {
    const currentUser = useDashboardSelector(selectUser);
    const permissions = useDashboardSelector(selectPermissions);
    const settings = useDashboardSelector(selectSettings);
    const { ErrorComponent, LoadingComponent } = useDashboardComponentsContext({
        ErrorComponent: CustomErrorComponent,
        LoadingComponent: CustomLoadingComponent,
    });

    const { error, result, status } = useExecutionDataView({
        execution: {
            seriesBy: compact([primaryMeasure, secondaryMeasure]),
            filters: effectiveFilters,
        },
        backend,
        workspace,
    });

    const brokenAlertsBasicInfo = useMemo(
        () => (alert ? getBrokenAlertFiltersBasicInfo(alert, kpiWidget, allFilters ?? []) : undefined),
        [alert, kpiWidget, allFilters],
    );

    const isAlertBroken = !!brokenAlertsBasicInfo?.length;

    const {
        error: alertError,
        result: alertResult,
        status: alertStatus,
    } = useExecutionDataView({
        execution: {
            seriesBy: [primaryMeasure],
            filters: alert
                ? filterContextToFiltersForWidget(alert.filterContext, kpiWidget) ?? []
                : effectiveFilters,
        },
        backend,
        workspace,
    });

    useEffect(() => {
        const err = error ?? alertError;
        if (err) {
            onError?.(err);
        }
    }, [error, alertError]);

    const handleOnDrill = useCallback(
        (drillContext: IDrillEventContext): ReturnType<OnFiredDashboardViewDrillEvent> => {
            if (!onDrill || !result) {
                return false;
            }

            // only return the definitions if there are no custom-specified drillableItems
            // if there are, we assume it was the custom drill
            const drillDefinitions =
                !drillableItems?.length && kpiWidget.drills.length > 0 ? kpiWidget.drills : undefined;

            return onDrill({
                dataView: result.dataView,
                drillContext,
                drillDefinitions,
                widgetRef: kpiWidget.ref,
            });
        },
        [onDrill, result],
    );

    const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
    const closeAlertDialog = () => setIsAlertDialogOpen(false);
    const kpiAlertOperations = useKpiAlertOperations(closeAlertDialog);
    const canSetAlert = permissions?.canCreateScheduledMail;

    if (status === "loading" || status === "pending") {
        return <LoadingComponent />;
    }

    const kpiResult = getKpiResult(result, primaryMeasure, secondaryMeasure, separators);
    const kpiAlertResult = getKpiAlertResult(alertResult, primaryMeasure, separators);
    const { isThresholdRepresentingPercent, thresholdPlaceholder } = getAlertThresholdInfo(kpiResult, intl);

    const predicates = drillableItems ? convertDrillableItemsToPredicates(drillableItems) : [];
    const isDrillable =
        kpiResult &&
        result &&
        status !== "error" &&
        (kpiWidget.drills.length > 0 ||
            isSomeHeaderPredicateMatched(predicates, kpiResult.measureDescriptor, result));

    const enableCompactSize = settings.enableKDWidgetCustomHeight;

    const alertSavingStatus =
        kpiAlertOperations.creatingStatus === "inProgress" ||
        kpiAlertOperations.updatingStatus === "inProgress"
            ? "inProgress"
            : kpiAlertOperations.creatingStatus === "error" || kpiAlertOperations.updatingStatus === "error"
            ? "error"
            : "idle";

    return (
        <DashboardItemWithKpiAlert
            kpi={kpiWidget}
            alert={alert}
            filters={effectiveFilters}
            userWorkspaceSettings={settings as IUserWorkspaceSettings}
            kpiResult={kpiResult}
            renderHeadline={(clientHeight) => (
                <DashboardItemHeadline title={kpiWidget.title} clientHeight={clientHeight} />
            )}
            kpiAlertResult={kpiAlertResult}
            canSetAlert={canSetAlert}
            isReadOnlyMode={isReadOnly}
            alertExecutionError={
                alertError ??
                /*
                 * if alert is broken, behave as if its execution yielded no data (which is true, we do not execute it)
                 * context: the problem is alerts on KPIs without dateDataset, their date filters are invalid
                 * and we have no idea what date dataset to put there hence it is sometimes impossible
                 * to execute them (unlike KPI Dashboards, we do not have the guarantee that there is a date
                 * filter in the filters)
                 */
                (isAlertBroken ? new NoDataSdkError() : undefined)
            }
            isLoading={false /* content is always loaded at this point */}
            isAlertLoading={false /* alerts are always loaded at this point */}
            isAlertExecutionLoading={alertStatus === "loading"}
            isAlertBroken={isAlertBroken}
            isAlertDialogOpen={isAlertDialogOpen}
            onAlertDialogOpenClick={() => setIsAlertDialogOpen(true)}
            renderAlertDialog={() => (
                <KpiAlertDialogWrapper
                    alert={alert}
                    dateFormat={settings.responsiveUiDateFormat!}
                    userEmail={currentUser.email!}
                    onAlertDialogCloseClick={() => setIsAlertDialogOpen(false)}
                    onAlertDialogDeleteClick={() => {
                        kpiAlertOperations.onRemoveAlert(alert!);
                    }}
                    onAlertDialogSaveClick={(threshold, whenTriggered) => {
                        if (alert) {
                            return kpiAlertOperations.onUpdateAlert({
                                ...alert,
                                threshold,
                                whenTriggered,
                                isTriggered: evaluateAlertTriggered(
                                    kpiAlertResult!.measureResult,
                                    threshold,
                                    whenTriggered,
                                ),
                            });
                        }

                        return kpiAlertOperations.onCreateAlert({
                            dashboard: dashboardRef,
                            widget: kpiWidget.ref,
                            threshold,
                            whenTriggered,
                            isTriggered: evaluateAlertTriggered(
                                kpiResult?.measureResult ?? 0,
                                threshold,
                                whenTriggered,
                            ),
                            filterContext: {
                                title: "filterContext",
                                description: "",
                                filters:
                                    effectiveFilters
                                        ?.map(dashboardFilterToFilterContextItem)
                                        .map(stripDateDatasets) ?? [],
                            },
                            description: "",
                            title: "",
                        });
                    }}
                    onAlertDialogUpdateClick={() => {
                        return kpiAlertOperations.onUpdateAlert({
                            ...alert!,
                            // evaluate triggered as if the alert already used the correct filters (i.e. use the KPI execution itself)
                            isTriggered: evaluateAlertTriggered(
                                kpiResult?.measureResult ?? 0,
                                alert!.threshold,
                                alert!.whenTriggered,
                            ),
                            // change the filters to the filters currently used by the KPI
                            filterContext: {
                                ...alert!.filterContext!,
                                filters:
                                    effectiveFilters
                                        ?.map(dashboardFilterToFilterContextItem)
                                        .map(stripDateDatasets) ?? [],
                            },
                        });
                    }}
                    onApplyAlertFiltersClick={
                        onFiltersChange
                            ? () =>
                                  onFiltersChange(
                                      filterContextItemsToFiltersForWidget(
                                          alert?.filterContext?.filters ?? [],
                                          kpiWidget,
                                      ),
                                  )
                            : undefined
                    }
                    isAlertLoading={alertStatus === "loading"}
                    alertDeletingStatus={kpiAlertOperations.removingStatus}
                    alertSavingStatus={alertSavingStatus}
                    alertUpdatingStatus={alertSavingStatus}
                    filters={effectiveFilters}
                    isThresholdRepresentingPercent={isThresholdRepresentingPercent}
                    thresholdPlaceholder={thresholdPlaceholder}
                    brokenAlertFiltersBasicInfo={brokenAlertsBasicInfo!}
                    backend={backend}
                    workspace={workspace}
                />
            )}
            alertDeletingStatus={kpiAlertOperations.removingStatus}
            alertSavingStatus={alertSavingStatus}
        >
            {() => {
                if (status === "error" && !isNoDataSdkError(error)) {
                    return <ErrorComponent message={(error! as Error).message} />;
                }
                return kpiResult ? (
                    <KpiRenderer
                        kpi={kpiWidget}
                        kpiResult={kpiResult}
                        filters={effectiveFilters ?? []}
                        disableDrillUnderline={disableDrillUnderline}
                        isDrillable={isDrillable}
                        onDrill={onDrill && handleOnDrill}
                        separators={separators}
                        enableCompactSize={enableCompactSize}
                    />
                ) : null;
            }}
        </DashboardItemWithKpiAlert>
    );
};

/**
 * Executes the given measures and displays them as KPI
 * @internal
 */
export const KpiExecutor = injectIntl(KpiExecutorCore);

function getSeriesResult(series: IDataSeries | undefined): number | null {
    if (!series) {
        return null;
    }

    const value = series.dataPoints()[0].rawValue;

    if (isNil(value)) {
        return null;
    }

    if (isNumber(value)) {
        return value;
    }

    return Number.parseFloat(value);
}

function getKpiResult(
    result: DataViewFacade | undefined,
    primaryMeasure: IMeasure,
    secondaryMeasure:
        | IMeasure<IPoPMeasureDefinition>
        | IMeasure<IPreviousPeriodMeasureDefinition>
        | undefined,
    separators: ISeparators,
): IKpiResult | undefined {
    const series = result?.data({ valueFormatter: createNumberJsFormatter(separators) }).series();
    const primarySeries = series?.firstForMeasure(primaryMeasure);
    const secondarySeries = secondaryMeasure ? series?.firstForMeasure(secondaryMeasure) : undefined;

    return primarySeries
        ? {
              measureDescriptor: primarySeries.descriptor.measureDescriptor,
              measureFormat: primarySeries.measureFormat(),
              measureResult: getSeriesResult(primarySeries)!,
              measureForComparisonResult: getSeriesResult(secondarySeries)!,
          }
        : undefined;
}

function getKpiAlertResult(
    result: DataViewFacade | undefined,
    primaryMeasure: IMeasure,
    separators: ISeparators,
): IKpiAlertResult | undefined {
    const alertSeries = result?.data({ valueFormatter: createNumberJsFormatter(separators) }).series();
    return alertSeries
        ? {
              measureFormat: alertSeries.firstForMeasure(primaryMeasure).measureFormat(),
              measureResult: getSeriesResult(alertSeries.firstForMeasure(primaryMeasure))!,
          }
        : undefined;
}

function getAlertThresholdInfo(kpiResult: IKpiResult | undefined, intl: IntlShape) {
    const isThresholdRepresentingPercent = kpiResult
        ? isMeasureFormatInPercent(kpiResult.measureFormat)
        : false;

    const value = round(kpiResult?.measureResult || 0, 2); // sure about rounding?
    const thresholdPlaceholder = isThresholdRepresentingPercent
        ? `${intl.formatMessage({ id: "kpi.alertBox.example" })} ${value * 100}`
        : `${intl.formatMessage({ id: "kpi.alertBox.example" })} ${value}`; // TODO fix floating point multiply

    return {
        isThresholdRepresentingPercent,
        thresholdPlaceholder,
    };
}
