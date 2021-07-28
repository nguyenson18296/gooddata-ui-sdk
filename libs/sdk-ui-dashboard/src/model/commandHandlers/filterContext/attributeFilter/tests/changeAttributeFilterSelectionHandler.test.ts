// (C) 2021 GoodData Corporation
import { changeAttributeFilterSelection } from "../../../../commands";
import { DashboardTester, preloadedTesterFactory } from "../../../../tests/DashboardTester";
import { selectFilterContextAttributeFilters } from "../../../../state/filterContext/filterContextSelectors";
import { SimpleDashboardIdentifier } from "../../../../tests/Dashboard.fixtures";

describe("changeAttributeFilterSelectionHandler.test", () => {
    let Tester: DashboardTester;
    beforeEach(preloadedTesterFactory((tester) => (Tester = tester), SimpleDashboardIdentifier));

    it("should emit the appropriate events for changed attribute filter selection", async () => {
        const firstFilterLocalId = selectFilterContextAttributeFilters(Tester.state())[0].attributeFilter
            .localIdentifier!;

        Tester.dispatch(
            changeAttributeFilterSelection(
                firstFilterLocalId,
                { uris: ["testing/uri"] },
                "NOT_IN",
                "testCorrelation",
            ),
        );

        await Tester.waitFor("GDC.DASH/EVT.FILTER_CONTEXT.CHANGED");

        expect(Tester.emittedEventsDigest()).toMatchSnapshot();
    });

    it("should set the attribute selection in state on changed attribute filter selection", async () => {
        const firstFilterLocalId = selectFilterContextAttributeFilters(Tester.state())[0].attributeFilter
            .localIdentifier!;

        Tester.dispatch(
            changeAttributeFilterSelection(
                firstFilterLocalId,
                { uris: ["testing/uri"] },
                "NOT_IN",
                "testCorrelation",
            ),
        );

        await Tester.waitFor("GDC.DASH/EVT.FILTER_CONTEXT.CHANGED");

        expect(selectFilterContextAttributeFilters(Tester.state())[0]).toMatchSnapshot({
            attributeFilter: {
                localIdentifier: expect.any(String),
            },
        });
    });

    it("should emit the appropriate events when trying to change a non-existent attribute filter", async () => {
        Tester.dispatch(
            changeAttributeFilterSelection(
                "NON EXISTENT LOCAL ID",
                { uris: ["testing/uri"] },
                "NOT_IN",
                "testCorrelation",
            ),
        );

        await Tester.waitFor("GDC.DASH/EVT.COMMAND.FAILED");

        expect(Tester.emittedEventsDigest()).toMatchSnapshot();
    });

    it("should NOT alter the attribute filter state when trying to change a non-existent attribute filter", async () => {
        const originalFilters = selectFilterContextAttributeFilters(Tester.state());

        Tester.dispatch(
            changeAttributeFilterSelection(
                "NON EXISTENT LOCAL ID",
                { uris: ["testing/uri"] },
                "NOT_IN",
                "testCorrelation",
            ),
        );

        await Tester.waitFor("GDC.DASH/EVT.COMMAND.FAILED");

        expect(selectFilterContextAttributeFilters(Tester.state())).toEqual(originalFilters);
    });
});
