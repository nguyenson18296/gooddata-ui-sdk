// (C) 2019-2020 GoodData Corporation

import { IUser, IWorkspaceUser } from "@gooddata/sdk-backend-spi";
import isEmpty from "lodash/isEmpty";

/**
 * @internal
 */
export interface IScheduleEmailRepeatDate {
    day: number;
    month: number;
    year: number;
}

/**
 * @internal
 */
export interface IScheduleEmailRepeatTime {
    hour: number;
    minute: number;
    second: number;
}

/**
 * @internal
 */
export interface IScheduleEmailRepeatFrequencyDayOfWeek {
    day: number;
    week: number;
}

/**
 * @internal
 */
export interface IScheduleEmailRepeatFrequency {
    day?: boolean;
    week?: {
        days: number[];
    };
    month?: {
        type: string;
        dayOfMonth?: number;
        dayOfWeek?: IScheduleEmailRepeatFrequencyDayOfWeek;
    };
}

/**
 * @internal
 */
export interface IScheduleEmailRepeat {
    date: IScheduleEmailRepeatDate;
    repeatExecuteOn: string;
    repeatFrequency: IScheduleEmailRepeatFrequency;
    repeatPeriod: number;
    repeatType: string;
    time: IScheduleEmailRepeatTime;
}

/**
 * @internal
 */
export interface IScheduleEmailRepeatOptions {
    repeatData: IScheduleEmailRepeat;
    startDate: Date;
}

/**
 * @internal
 */
export interface IScheduleEmailExternalRecipient {
    /**
     * Target email, if recipient is an external user
     */
    email: string;
}

/**
 * @internal
 */
export const isScheduleEmailExternalRecipient = (obj: unknown): obj is IScheduleEmailExternalRecipient =>
    !isEmpty(obj) && typeof (obj as IScheduleEmailExternalRecipient).email === "string";

/**
 * @internal
 */
export interface IScheduleEmailExistingRecipient {
    /**
     * Target user, if the recipient is an existing user
     */
    user: IWorkspaceUser | IUser;
}

/**
 * @internal
 */
export const isScheduleEmailExistingRecipient = (obj: unknown): obj is IScheduleEmailExistingRecipient =>
    !isEmpty(obj) && typeof (obj as IScheduleEmailExistingRecipient).user === "object";

/**
 * @internal
 */
export type IScheduleEmailRecipient = IScheduleEmailExternalRecipient | IScheduleEmailExistingRecipient;

/**
 * @internal
 */
export interface IDropdownItem {
    id: string;
    title: string;
}
