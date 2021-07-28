// (C) 2021 GoodData Corporation

import { IDashboardQueryService } from "./queryService";
import { Saga, SagaIterator } from "redux-saga";
import { actionChannel, call, getContext, spawn, take } from "redux-saga/effects";
import { IDashboardQuery } from "../../queries";
import { DashboardContext } from "../../types/commonTypes";
import keyBy from "lodash/keyBy";
import { Action, CombinedState, combineReducers, Reducer } from "@reduxjs/toolkit";
import fromPairs from "lodash/fromPairs";
import noop from "lodash/noop";
import compact from "lodash/compact";
import { dispatchDashboardEvent } from "../../eventEmitter/eventDispatcher";
import {
    internalQueryErrorOccurred,
    isDashboardQueryFailed,
    queryCompleted,
    queryRejected,
    queryStarted,
} from "../../events/general";

/**
 * Query processing component has multiple pieces that need to be integrated into the redux store.
 */
export type QueryProcessingModule = {
    /**
     * Query services may store the results in state for caching purposes. All services that use caching implement
     * the cache as a separate slice of the internal `_queryCache` part of the state. This reducer is a combined
     * reducer including all the appropriate slice reducers.
     */
    queryCacheReducer: Reducer<CombinedState<any>>;

    /**
     * A single saga is in place to handle query processing requests. Query requests will be processed concurrently.
     */
    rootQueryProcessor: Saga;
};

/**
 * @internal
 */
export const QueryEnvelopeActionTypeName = "@@QUERY.ENVELOPE";

/**
 * @internal
 */
export type QueryEnvelope = {
    readonly type: typeof QueryEnvelopeActionTypeName;
    readonly query: IDashboardQuery;
    readonly onStart: (query: any) => void;
    readonly onSuccess: (result: any) => void;
    readonly onError: (err: Error) => void;
};

function* processQuery(
    service: IDashboardQueryService<any, any>,
    ctx: DashboardContext,
    envelope: QueryEnvelope,
) {
    const {
        query,
        query: { type, correlationId },
    } = envelope;
    const correlationIdForLog = correlationId ?? "(no correlationId provided)";

    try {
        try {
            envelope.onStart(query);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn(
                `An error has occurred while calling onStart function provided for ${type}@${correlationIdForLog} processing:`,
                e,
            );
        }

        yield dispatchDashboardEvent(queryStarted(ctx, correlationId));

        const result: SagaIterator<typeof service.generator> = yield call(
            service.generator,
            ctx,
            envelope.query,
        );

        try {
            envelope.onSuccess(result);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn(
                `An error has occurred while calling onSuccess function provided for ${type}@${correlationIdForLog} processing`,
                e,
            );
        }
        yield dispatchDashboardEvent(queryCompleted(ctx, query, result, correlationId));
    } catch (e) {
        try {
            envelope.onError(e);
        } catch (ne) {
            // eslint-disable-next-line no-console
            console.warn(
                `An error has occurred while calling onError function provided for ${type}@${correlationIdForLog} processing:`,
                ne,
            );
        }

        if (isDashboardQueryFailed(e)) {
            yield dispatchDashboardEvent(e);
        } else {
            yield dispatchDashboardEvent(
                internalQueryErrorOccurred(
                    ctx,
                    `An internal error has occurred while processing ${type}`,
                    e,
                    correlationId,
                ),
            );
        }
    }
}

function ensureQueryWrappedInEnvelope(action: Action): QueryEnvelope {
    if (action.type === QueryEnvelopeActionTypeName) {
        return action as QueryEnvelope;
    }

    return {
        type: QueryEnvelopeActionTypeName,
        query: action,
        onStart: noop,
        onSuccess: noop,
        onError: noop,
    };
}

/**
 * Creates components that should be integrated into the dashboard store in order to facilitate query processing.
 *
 * @param queryServices - query services use to initialize the components
 */
export function createQueryProcessingModule(
    queryServices: IDashboardQueryService<any, any>[],
): QueryProcessingModule {
    const servicesByType = keyBy(queryServices, (service) => service.name);
    const queryToReducers = fromPairs(
        compact(
            queryServices.map((service) => {
                if (!service.cache) {
                    return null;
                }

                return [service.cache.cacheName, service.cache.reducer];
            }),
        ),
    );

    return {
        queryCacheReducer: combineReducers(queryToReducers),
        /*
         * The root saga for all query processing. This will channel in all query envelopes and all non-enveloped
         * queries and will dispatch the query
         */
        rootQueryProcessor: function* (): SagaIterator<void> {
            const queryChannel = yield actionChannel(
                (action: any) =>
                    action.type === QueryEnvelopeActionTypeName || action.type.startsWith("GDC.DASH/QUERY."),
            );

            while (true) {
                const query = yield take(queryChannel);
                const envelope = ensureQueryWrappedInEnvelope(query);
                const dashboardContext: DashboardContext = yield getContext("dashboardContext");
                const service = servicesByType[envelope.query.type];

                if (!service) {
                    yield dispatchDashboardEvent(
                        queryRejected(dashboardContext, envelope.query.correlationId),
                    );
                } else {
                    yield spawn(processQuery, service, dashboardContext, envelope);
                }
            }
        },
    };
}
