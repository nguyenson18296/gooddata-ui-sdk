// (C) 2019-2021 GoodData Corporation
import { DependencyList } from "react";
import { IPreparedExecution } from "@gooddata/sdk-backend-spi";
import { DataViewWindow } from "./withExecutionLoading";
import {
    convertError,
    DataViewFacade,
    GoodDataSdkError,
    useCancelablePromise,
    UseCancelablePromiseCallbacks,
    UseCancelablePromiseState,
} from "../base";

/**
 * Indicates current state of useDataView hook
 * @beta
 */
export type UseDataViewState = UseCancelablePromiseState<DataViewFacade, GoodDataSdkError>;

/**
 * Callbacks for useDataView hook
 * @beta
 */
export type UseDataViewCallbacks = UseCancelablePromiseCallbacks<DataViewFacade, GoodDataSdkError>;

/**
 * This hook provides easy way to get data for the provided {@link @gooddata/sdk-backend-spi#IPreparedExecution}.
 * You can use it to create custom visualizations on top of GoodData platform.
 * Be aware that execution is re-executed only on dependency list change, not on execution/window/callbacks change.
 *
 * @beta
 */
export function useDataView(
    {
        execution,
        window,
        onCancel,
        onError,
        onLoading,
        onPending,
        onSuccess,
    }: {
        execution: IPreparedExecution | undefined | null;
        window?: DataViewWindow;
    } & UseDataViewCallbacks,
    deps?: DependencyList,
): UseDataViewState {
    return useCancelablePromise<DataViewFacade, GoodDataSdkError>(
        {
            promise: execution
                ? () =>
                      execution
                          .execute()
                          .then((executionResult) =>
                              window
                                  ? executionResult.readWindow(window.offset, window.size)
                                  : executionResult.readAll(),
                          )
                          .then((dataView) => {
                              return DataViewFacade.for(dataView);
                          })
                          .catch((error) => {
                              throw convertError(error);
                          })
                : null,
            onCancel,
            onError,
            onLoading,
            onPending,
            onSuccess,
        },
        deps,
    );
}
