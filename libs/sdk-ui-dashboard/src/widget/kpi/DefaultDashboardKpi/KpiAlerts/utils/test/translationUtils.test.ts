// (C) 2019-2021 GoodData Corporation
import { createIntlMock, DefaultLocale } from "@gooddata/sdk-ui";
import { IDateFilter, newAllTimeFilter, newRelativeDateFilter } from "@gooddata/sdk-model";
import { ReferenceLdm } from "@gooddata/reference-workspace";
import { DateFilterGranularity, IDashboardDateFilter } from "@gooddata/sdk-backend-spi";

import { translations } from "../../../../../../localization";
import { getKpiAlertTranslationData, KpiAlertTranslationData } from "../translationUtils";

// we need to have both sdk-ui and sdk-ui-ext messages available
const intl = createIntlMock(translations[DefaultLocale], DefaultLocale);

type TranslationTestPair = [IDateFilter | IDashboardDateFilter, KpiAlertTranslationData];

describe("getKpiAlertTranslationData", () => {
    const DEFAULT_DATE_FORMAT = "MM/dd/yyyy";

    it("should return null for unsupported filter", () => {
        const res = getKpiAlertTranslationData(
            newAllTimeFilter(ReferenceLdm.DateDatasets.Activity),
            intl,
            DEFAULT_DATE_FORMAT,
        );
        expect(res).toEqual(null);
    });

    describe("date filters", () => {
        const testedData: TranslationTestPair[] = [
            [
                newRelativeDateFilter(ReferenceLdm.DateDatasets.Activity, "GDC.time.week_us", 0, 0),
                {
                    intlIdRoot: "filters.alertMessage.relativePreset",
                    rangeText: "this week",
                },
            ],
            [
                newRelativeDateFilter(ReferenceLdm.DateDatasets.Activity, "GDC.time.week_us", -1, -1),
                {
                    intlIdRoot: "filters.alertMessage.relativePreset",
                    rangeText: "last week",
                },
            ],
            [
                newRelativeDateFilter(ReferenceLdm.DateDatasets.Activity, "GDC.time.date", -6, 0),
                {
                    intlIdRoot: "filters.alertMessage.relativePreset",
                    rangeText: "last 7 days",
                },
            ],
            [
                newRelativeDateFilter(ReferenceLdm.DateDatasets.Activity, "GDC.time.date", -6, -1),
                {
                    intlIdRoot: "filters.alertMessage.relativePreset.inPeriod",
                    rangeText: "from 6 to 1 day ago",
                },
            ],
            [
                newRelativeDateFilter(ReferenceLdm.DateDatasets.Activity, "GDC.time.month", -11, 0),
                {
                    intlIdRoot: "filters.alertMessage.relativePreset",
                    rangeText: "last 12 months",
                },
            ],
            [
                newRelativeDateFilter(ReferenceLdm.DateDatasets.Activity, "GDC.time.month", -3, 3),
                {
                    intlIdRoot: "filters.alertMessage.relativePreset.inPeriod",
                    rangeText: "from 3 months ago to 3 months ahead",
                },
            ],
        ];
        it.each(testedData)("should take relative filter %o and return intl data %o", (input, output) => {
            expect(getKpiAlertTranslationData(input, intl, DEFAULT_DATE_FORMAT)).toEqual(output);
        });
    });

    describe("dashboard date filters", () => {
        function newRelativeDashboardFilter(
            granularity: DateFilterGranularity,
            from: number,
            to: number,
        ): IDashboardDateFilter {
            return {
                dateFilter: {
                    granularity,
                    type: "relative",
                    from,
                    to,
                },
            };
        }

        const testedData: TranslationTestPair[] = [
            [
                newRelativeDashboardFilter("GDC.time.week_us", 0, 0),
                {
                    intlIdRoot: "filters.alertMessage.relativePreset",
                    rangeText: "this week",
                },
            ],
            [
                newRelativeDashboardFilter("GDC.time.week_us", -1, -1),
                {
                    intlIdRoot: "filters.alertMessage.relativePreset",
                    rangeText: "last week",
                },
            ],
            [
                newRelativeDashboardFilter("GDC.time.date", -6, 0),
                {
                    intlIdRoot: "filters.alertMessage.relativePreset",
                    rangeText: "last 7 days",
                },
            ],
            [
                newRelativeDashboardFilter("GDC.time.date", -6, -1),
                {
                    intlIdRoot: "filters.alertMessage.relativePreset.inPeriod",
                    rangeText: "from 6 to 1 day ago",
                },
            ],
            [
                newRelativeDashboardFilter("GDC.time.month", -11, 0),
                {
                    intlIdRoot: "filters.alertMessage.relativePreset",
                    rangeText: "last 12 months",
                },
            ],
            [
                newRelativeDashboardFilter("GDC.time.month", -3, 3),
                {
                    intlIdRoot: "filters.alertMessage.relativePreset.inPeriod",
                    rangeText: "from 3 months ago to 3 months ahead",
                },
            ],
        ];
        it.each(testedData)(
            "should take relative dashboard filter %o and return intl data %o",
            (input, output) => {
                expect(getKpiAlertTranslationData(input, intl, DEFAULT_DATE_FORMAT)).toEqual(output);
            },
        );
    });
});
