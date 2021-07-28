// (C) 2021 GoodData Corporation
import { call, put, select } from "redux-saga/effects";
import { SagaIterator } from "redux-saga";
import { batchActions } from "redux-batched-actions";
import difference from "lodash/difference";
import partition from "lodash/partition";

import { RemoveAttributeFilters } from "../../../commands/filters";
import { invalidArgumentsProvided } from "../../../events/general";
import { attributeFilterRemoved } from "../../../events/filters";
import { filterContextActions } from "../../../state/filterContext";
import { selectFilterContextAttributeFilters } from "../../../state/filterContext/filterContextSelectors";
import { DashboardContext } from "../../../types/commonTypes";
import { dispatchFilterContextChanged } from "../common";
import { dispatchDashboardEvent } from "../../../eventEmitter/eventDispatcher";

export function* removeAttributeFiltersHandler(
    ctx: DashboardContext,
    cmd: RemoveAttributeFilters,
): SagaIterator<void> {
    const { filterLocalIds } = cmd.payload;

    const allFilters: ReturnType<typeof selectFilterContextAttributeFilters> = yield select(
        selectFilterContextAttributeFilters,
    );

    const [removedFilters, survivingFilters] = partition(allFilters, (item) =>
        filterLocalIds.includes(item.attributeFilter.localIdentifier!),
    );

    const invalidLocalIds = difference(
        filterLocalIds,
        allFilters.map((filter) => filter.attributeFilter.localIdentifier),
    );

    if (invalidLocalIds.length) {
        throw invalidArgumentsProvided(
            ctx,
            `Invalid filterLocalIds provided. These ids were not found: ${invalidLocalIds.join(", ")}.`,
            cmd.correlationId,
        );
    }

    for (const removedFilter of removedFilters) {
        const affectedChildren = survivingFilters.filter((item) =>
            item.attributeFilter.filterElementsBy?.some((parent) =>
                filterLocalIds.includes(parent.filterLocalIdentifier),
            ),
        );

        const batch = batchActions([
            // remove filter from parents and keep track of the affected filters
            ...affectedChildren.map(({ attributeFilter }) =>
                filterContextActions.setAttributeFilterParents({
                    filterLocalId: attributeFilter.localIdentifier!,
                    parentFilters: attributeFilter.filterElementsBy!.filter(
                        (parent) =>
                            parent.filterLocalIdentifier !== removedFilter?.attributeFilter.localIdentifier,
                    ),
                }),
            ),
            // remove filter itself
            filterContextActions.removeAttributeFilter({
                filterLocalId: removedFilter.attributeFilter.localIdentifier!,
            }),
        ]);

        yield put(batch);
        yield dispatchDashboardEvent(
            attributeFilterRemoved(ctx, removedFilter!, affectedChildren, cmd.correlationId),
        );
    }

    yield call(dispatchFilterContextChanged, ctx, cmd);
}
