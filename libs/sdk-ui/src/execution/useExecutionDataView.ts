// (C) 2019-2021 GoodData Corporation
import { IAnalyticalBackend, IPreparedExecution } from "@gooddata/sdk-backend-spi";
import { DataViewWindow } from "./withExecutionLoading";
import {
    DataViewFacade,
    GoodDataSdkError,
    useBackendStrict,
    useWorkspaceStrict,
    UseCancelablePromiseState,
    useResolveValuesWithPlaceholders,
    AttributesMeasuresOrPlaceholders,
    AttributesOrPlaceholders,
    NullableFiltersOrPlaceholders,
    SortsOrPlaceholders,
    TotalsOrPlaceholders,
} from "../base";
import { useDataView } from "./useDataView";
import isEmpty from "lodash/isEmpty";
import { createExecution } from "./createExecution";

/**
 * @beta
 */
export interface IExecutionConfiguration {
    /**
     * Data series will be built using the provided measures that are optionally further scoped for
     * elements of the specified attributes.
     */
    seriesBy: AttributesMeasuresOrPlaceholders;

    /**
     * Optionally slice all data series by elements of these attributes.
     */
    slicesBy?: AttributesOrPlaceholders;

    /**
     * Optionally include these totals among the data slices.
     */
    totals?: TotalsOrPlaceholders;

    /**
     * Optional filters to apply on server side.
     */
    filters?: NullableFiltersOrPlaceholders;

    /**
     * Optional sorting to apply on server side.
     */
    sortBy?: SortsOrPlaceholders;

    /**
     * Optional resolution context for composed placeholders.
     */
    placeholdersResolutionContext?: any;

    /**
     * Optional informative name of the component. This value is sent as telemetry information together
     * with the actual execution request. We recommend to set this because it can be useful for diagnostic
     * purposes.
     *
     * Defaults 'Execute'.
     */
    componentName?: string;
}

/**
 * @internal
 */
function isExecutionConfiguration(obj: unknown): obj is IExecutionConfiguration {
    return !isEmpty(obj) && !!(obj as IExecutionConfiguration)?.seriesBy;
}

/**
 * @beta
 */
export interface IUseExecutionDataViewConfig {
    /**
     * Prepared execution, or execution configuration for which you want to get the data view.
     */
    execution?: IPreparedExecution | IExecutionConfiguration;

    /**
     * Optionally, you can define only a specific "window" of data to load.
     * This is useful if you want to page data.
     */
    window?: DataViewWindow;

    /**
     * Backend to work with.
     *
     * Note: the backend must come either from this property or from BackendContext. If you do not specify
     * backend here, then the executor MUST be rendered within an existing BackendContext.
     */
    backend?: IAnalyticalBackend;

    /**
     * Workspace where execution should be executed.
     *
     * Note: the workspace must come either from this property or from WorkspaceContext. If you do not specify
     * workspace here, then the executor MUST be rendered within an existing WorkspaceContext.
     */
    workspace?: string;
}

/**
 * React hook to get data for a specific execution.
 *
 * @beta
 */
export function useExecutionDataView(
    config: IUseExecutionDataViewConfig,
    deps?: React.DependencyList,
): UseCancelablePromiseState<DataViewFacade, GoodDataSdkError> {
    const { execution, window } = config;
    const backend = useBackendStrict(config.backend, "useExecutionDataView");
    const workspace = useWorkspaceStrict(config.workspace, "useExecutionDataView");
    const effectiveDeps = deps ?? [];

    const propsToResolve = getExecutionConfigurationProps(config.execution);
    const [seriesBy, slicesBy, totals, filters, sortBy] = useResolveValuesWithPlaceholders(
        [
            propsToResolve.seriesBy,
            propsToResolve.slicesBy,
            propsToResolve.totals,
            propsToResolve.filters,
            propsToResolve.sortBy,
        ],
        propsToResolve.placeholdersResolutionContext,
    );

    const preparedExecution = isExecutionConfiguration(execution)
        ? createExecution({
              ...execution,
              seriesBy: seriesBy!,
              slicesBy,
              totals,
              filters,
              sortBy,
              backend,
              workspace,
          })
        : execution;

    return useDataView({ execution: preparedExecution, window }, [
        backend,
        workspace,
        preparedExecution?.fingerprint() ?? "__executionFingerprint__",
        ...effectiveDeps,
    ]);
}

/**
 * @internal
 */
function getExecutionConfigurationProps(
    execution?: IPreparedExecution | IExecutionConfiguration,
): Partial<IExecutionConfiguration> {
    if (isExecutionConfiguration(execution)) {
        return execution;
    }

    return {};
}
