// (C) 2021 GoodData Corporation
import { SagaIterator } from "redux-saga";
import { call, put, select } from "redux-saga/effects";
import { ChangeDateFilterSelection } from "../../../commands/filters";
import { dateFilterChanged } from "../../../events/filters";
import { filterContextActions } from "../../../state/filterContext";
import { selectFilterContextDateFilter } from "../../../state/filterContext/filterContextSelectors";
import { DashboardContext } from "../../../types/commonTypes";
import { dispatchFilterContextChanged } from "../common";
import { dispatchDashboardEvent } from "../../../eventEmitter/eventDispatcher";

export function* changeDateFilterSelectionHandler(
    ctx: DashboardContext,
    cmd: ChangeDateFilterSelection,
): SagaIterator<void> {
    const isAllTime =
        cmd.payload.type === "relative" &&
        cmd.payload.granularity === "GDC.time.date" &&
        cmd.payload.from === undefined &&
        cmd.payload.to === undefined;

    yield put(
        filterContextActions.upsertDateFilter(
            isAllTime
                ? { type: "allTime" }
                : {
                      type: cmd.payload.type,
                      granularity: cmd.payload.granularity,
                      from: cmd.payload.from,
                      to: cmd.payload.to,
                  },
        ),
    );

    const affectedFilter: ReturnType<typeof selectFilterContextDateFilter> = yield select(
        selectFilterContextDateFilter,
    );

    yield dispatchDashboardEvent(
        dateFilterChanged(
            ctx,
            // TODO we need to decide how to externally represent All Time date filter and unify this
            affectedFilter ?? { dateFilter: { granularity: "GDC.time.date", type: "relative" } },
            cmd.correlationId,
        ),
    );

    yield call(dispatchFilterContextChanged, ctx, cmd);
}
