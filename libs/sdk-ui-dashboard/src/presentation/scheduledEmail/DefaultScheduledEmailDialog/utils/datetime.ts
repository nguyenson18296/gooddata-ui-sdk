// (C) 2019-2021 GoodData Corporation
import isDate from "lodash/isDate";
import format from "date-fns/format";

import { PLATFORM_DATE_FORMAT } from "../constants";

export function convertDateToPlatformDateString(date: Date): string;
export function convertDateToPlatformDateString(date: Date | undefined | null): string | undefined | null {
    return isDate(date) ? format(date, PLATFORM_DATE_FORMAT) : date;
}

export function convertDateToDisplayDateString(date: Date, dateFormat: string): string;
export function convertDateToDisplayDateString(
    date: Date | undefined | null,
    dateFormat: string,
): string | undefined | null {
    // In schedule email dialog, use date string as sub-fix of attached file name
    // to avoid "/" character in file name
    const DISPLAY_DATE_FORMAT_MAPPER = {
        "MM/dd/yyyy": "MM-dd-yyyy",
        "dd/MM/yyyy": "dd-MM-yyyy",
        "M/d/yy": "M-d-yy",
    };
    const displayDateFormat = DISPLAY_DATE_FORMAT_MAPPER[dateFormat] || dateFormat;
    return isDate(date) ? format(date, displayDateFormat) : date;
}

export function getDate(date: Date): number {
    return date.getDate();
}

export function getDayName(date: Date): string {
    return format(date, "eeee");
}

export function convertSun2MonWeekday(dayIndex: number): number {
    return dayIndex === 0 ? 7 : dayIndex;
}

export function getDay(date: Date): number {
    return convertSun2MonWeekday(date.getDay());
}

export function getWeek(date: Date): number {
    return Math.ceil(date.getDate() / 7);
}

export function getMonth(date: Date): number {
    return date.getMonth() + 1;
}

export function getYear(date: Date): number {
    return date.getFullYear();
}
