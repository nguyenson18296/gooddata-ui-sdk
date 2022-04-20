// (C) 2021-2022 GoodData Corporation

import { DashboardTester, preloadedTesterFactory } from "../../../tests/DashboardTester";
import { SimpleDashboardIdentifier } from "../../../tests/fixtures/SimpleDashboard.fixtures";
import { selectRenderMode } from "../../../store/ui/uiSelectors";
import { changeRenderMode, initializeDashboard } from "../../../commands";
import { TestCorrelation } from "../../../tests/fixtures/Dashboard.fixtures";

describe("changeRenderModeHandler", () => {
    let Tester: DashboardTester;

    describe("without initial config", () => {
        beforeEach(
            preloadedTesterFactory(async (tester) => {
                Tester = tester;
            }, SimpleDashboardIdentifier),
        );

        it("should be view if initialRenderMode is not specified on config", async () => {
            const renderMode = await Tester.select(selectRenderMode);
            expect(renderMode).toBe("view");
        });

        it("should process render mode change", async () => {
            await Tester.dispatchAndWaitFor(
                changeRenderMode("edit", TestCorrelation),
                "GDC.DASH/EVT.RENDER_MODE.CHANGED",
            );
            expect(Tester.emittedEventsDigest()).toMatchSnapshot();

            const renderMode = await Tester.select(selectRenderMode);
            expect(renderMode).toBe("edit");
        });
    });

    describe("with initial config for new dashboard", () => {
        beforeEach(
            preloadedTesterFactory(
                async (tester) => {
                    Tester = tester;
                },
                undefined,
                {
                    initCommand: initializeDashboard({
                        initialRenderMode: "edit",
                    }),
                },
            ),
        );

        it("should respect initialRenderMode config", async () => {
            const renderMode = await Tester.select(selectRenderMode);
            expect(renderMode).toBe("edit");
        });
    });

    describe("with initial config for existing dashboard", () => {
        beforeEach(
            preloadedTesterFactory(
                async (tester) => {
                    Tester = tester;
                },
                SimpleDashboardIdentifier,
                {
                    initCommand: initializeDashboard({
                        initialRenderMode: "edit",
                    }),
                },
            ),
        );

        it("should respect initialRenderMode config", async () => {
            const renderMode = await Tester.select(selectRenderMode);
            expect(renderMode).toBe("edit");
        });
    });
});