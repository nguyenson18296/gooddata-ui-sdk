// (C) 2021 GoodData Corporation

import { ObjRefMap } from "../../../../_staging/metadata/objRefMap";
import { IInsightWidget, isInsightWidget, IWidget } from "@gooddata/sdk-backend-spi";
import { ObjRef, serializeObjRef } from "@gooddata/sdk-model";
import { IDashboardCommand } from "../../../commands";
import { invalidArgumentsProvided } from "../../../events/general";
import { DashboardContext } from "../../../types/commonTypes";

type CommandWithRef = IDashboardCommand & {
    payload: {
        ref: ObjRef;
    };
};

/**
 * Given list of all dashboard widgets and a command that contains a ref, this function tests that the `ref` is
 * a reference to an existing dashboard widget and that the existing widget is an insight widget.
 *
 * If the validation succeeds, the located insight widget will be returned. Otherwise an error will fly. The error
 * will be an instance of DashboardCommandFailed event - it can be propagated through the command handler all the
 * way to the root command handler saga.
 *
 * @param ctx - dashboard context, this will be included in the DashboardCommandFailed event
 * @param widgets - map of widgets on the dashboard
 * @param cmd - any command that has 'ref' in its payload
 */
export function validateExistingInsightWidget(
    widgets: ObjRefMap<IWidget>,
    cmd: CommandWithRef,
    ctx: DashboardContext,
): IInsightWidget {
    const {
        correlationId,
        payload: { ref },
    } = cmd;
    const widget = widgets.get(ref);

    if (!widget) {
        throw invalidArgumentsProvided(
            ctx,
            `Cannot find insight widget with ref: ${serializeObjRef(ref)}.`,
            correlationId,
        );
    }

    if (!isInsightWidget(widget)) {
        throw invalidArgumentsProvided(
            ctx,
            `Widget with ref: ${serializeObjRef(ref)} exists but is not an insight widget.`,
            correlationId,
        );
    }

    return widget;
}
