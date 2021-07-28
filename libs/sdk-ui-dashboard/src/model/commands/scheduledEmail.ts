// (C) 2021 GoodData Corporation

import { IScheduledMailDefinition, IFilterContextDefinition } from "@gooddata/sdk-backend-spi";
import { IDashboardCommand } from "./base";

/**
 * Creates scheduled email.
 *
 * @alpha
 */
export interface CreateScheduledEmail extends IDashboardCommand {
    readonly type: "GDC.DASH/CMD.SCHEDULED_EMAIL.CREATE";
    readonly payload: {
        readonly scheduledEmail: IScheduledMailDefinition;
        readonly filterContext?: IFilterContextDefinition;
    };
}

/**
 * Creates the CreateScheduledEmail command. Dispatching this command will result in the creating scheduled email on the backend.
 *
 * @param scheduledEmail - specify scheduled email to create.
 * @param filterContext - specify filter context to use for the scheduled email. If no filter context is provided, stored dashboard filter context will be used.
 * @param correlationId - optionally specify correlation id to use for this command. this will be included in all
 *  events that will be emitted during the command processing

 * @alpha
 */
export function createScheduledEmail(
    scheduledEmail: IScheduledMailDefinition,
    filterContext?: IFilterContextDefinition,
    correlationId?: string,
): CreateScheduledEmail {
    return {
        type: "GDC.DASH/CMD.SCHEDULED_EMAIL.CREATE",
        correlationId,
        payload: {
            scheduledEmail,
            filterContext,
        },
    };
}

//
//
//
