// (C) 2021 GoodData Corporation
import { DashboardTester, preloadedTesterFactory } from "../../../tests/DashboardTester";
import {
    EmptyDashboardIdentifier,
    SimpleDashboardIdentifier,
    TestCorrelation,
    TestStash,
} from "../../../tests/Dashboard.fixtures";
import {
    DashboardCommandFailed,
    DashboardLayoutChanged,
    DashboardLayoutSectionRemoved,
} from "../../../events";
import { removeLayoutSection, undoLayoutChanges } from "../../../commands";
import { selectLayout, selectStash } from "../../../state/layout/layoutSelectors";

describe("remove layout section handler", () => {
    describe("for an empty dashboard", () => {
        let Tester: DashboardTester;
        beforeEach(preloadedTesterFactory((tester) => (Tester = tester), EmptyDashboardIdentifier));

        it("should fail the command", async () => {
            const event: DashboardCommandFailed = await Tester.dispatchAndWaitFor(
                removeLayoutSection(0, undefined, TestCorrelation),
                "GDC.DASH/EVT.COMMAND.FAILED",
            );

            expect(event.payload.reason).toEqual("USER_ERROR");
            expect(event.correlationId).toEqual(TestCorrelation);
        });
    });

    describe("for any dashboard", () => {
        let Tester: DashboardTester;
        beforeEach(preloadedTesterFactory((tester) => (Tester = tester), SimpleDashboardIdentifier));

        it("should remove the section", async () => {
            const originalLayout = selectLayout(Tester.state());

            const event: DashboardLayoutSectionRemoved = await Tester.dispatchAndWaitFor(
                removeLayoutSection(0, undefined),
                "GDC.DASH/EVT.FLUID_LAYOUT.SECTION_REMOVED",
            );

            expect(event.payload.index).toEqual(0);
            expect(event.payload.section).toEqual(originalLayout.sections[0]);

            const layout = selectLayout(Tester.state());

            expect(layout.sections).toEqual([originalLayout.sections[1]]);
        });

        it("should remove the section and stash the items", async () => {
            const originalLayout = selectLayout(Tester.state());
            await Tester.dispatchAndWaitFor(
                removeLayoutSection(0, TestStash),
                "GDC.DASH/EVT.FLUID_LAYOUT.SECTION_REMOVED",
            );

            const stash = selectStash(Tester.state());

            expect(stash[TestStash]).toEqual(originalLayout.sections[0].items);
        });

        it("should be undoable and including stashed items in undo", async () => {
            const originalLayout = selectLayout(Tester.state());

            await Tester.dispatchAndWaitFor(
                removeLayoutSection(0, TestStash),
                "GDC.DASH/EVT.FLUID_LAYOUT.SECTION_REMOVED",
            );

            const event: DashboardLayoutChanged = await Tester.dispatchAndWaitFor(
                undoLayoutChanges(),
                "GDC.DASH/EVT.FLUID_LAYOUT.LAYOUT_CHANGED",
            );

            const restoredLayout = selectLayout(Tester.state());
            const restoredStash = selectStash(Tester.state());

            expect(event.payload.layout).toEqual(originalLayout);
            expect(restoredLayout).toEqual(originalLayout);
            expect(restoredStash[TestStash]).toBeUndefined();
        });

        it("should emit the correct events", async () => {
            await Tester.dispatchAndWaitFor(
                removeLayoutSection(0, undefined, TestCorrelation),
                "GDC.DASH/EVT.FLUID_LAYOUT.SECTION_REMOVED",
            );

            expect(Tester.emittedEventsDigest()).toMatchSnapshot();
        });

        it("should fail command if the section does not exist", async () => {
            const event: DashboardCommandFailed = await Tester.dispatchAndWaitFor(
                removeLayoutSection(2, undefined, TestCorrelation),
                "GDC.DASH/EVT.COMMAND.FAILED",
            );

            expect(event.payload.reason).toEqual("USER_ERROR");
            expect(event.correlationId).toEqual(TestCorrelation);
        });
    });
});
