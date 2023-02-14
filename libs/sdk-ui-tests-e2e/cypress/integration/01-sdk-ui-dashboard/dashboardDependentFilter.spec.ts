// (C) 2022 GoodData Corporation

import * as Navigation from "../../tools/navigation";
import { EditMode } from "../../tools/editMode";
import { AttributeFilter, FilterBar } from "../../tools/filterBar";
import { DashboardMenu } from "../../tools/dashboardMenu";
import { Widget } from "../../tools/widget";
import { getProjectId } from "../../support/constants";

Cypress.Cookies.defaults({
    preserve: ["GDCAuthTT", "GDCAuthSTT", "_csrfToken"],
});

Cypress.on("uncaught:exception", (error) => {
    console.error("Uncaught exception cause", error);
    return false;
});

Cypress.Cookies.debug(true);

const editMode = new EditMode();
const filterBar = new FilterBar();
const widget = new Widget(0);
const stageName = new AttributeFilter("Stage Name");
const product = new AttributeFilter("Product");
const account = new AttributeFilter("Account");
const isWon = new AttributeFilter("Is Won?");

describe("Dashboard dependent filter", { tags: ["pre-merge_isolated_bear"] }, () => {
    beforeEach(() => {
        cy.login();
    });

    it("Apply dependence filter on Edit Mode", () => {
        Navigation.visit("dashboard/stage-name");
        editMode.edit();

        widget.waitTableLoaded();
        filterBar.addAttribute("Product");
        cy.wait(1000);

        product.configureDependency("Stage Name").close();

        stageName.open().selectAllValues().apply();
        product
            .open()
            .waitFilteringFinished()
            .isAttributeItemFiltered(false)
            .getValueList()
            .should("deep.equal", [
                "CompuSci",
                "Educationly",
                "Explorer",
                "Grammar Plus",
                "PhoenixSoft",
                "TouchAll",
                "WonderKid",
            ]);

        stageName.open().selectAttributeWithoutSearch("Conviction");
        product
            .open()
            .waitFilteringFinished()
            .isAttributeItemFiltered(true)
            .getValueList()
            .should("deep.equal", [
                "CompuSci",
                "Educationly",
                "Explorer",
                "Grammar Plus",
                "PhoenixSoft",
                "WonderKid",
            ]);
    });

    it("Apply dependence filter on View Mode", () => {
        Navigation.visit("dashboard/dependent-filter");
        widget.waitTableLoaded();

        account.open().selectAttributeWithoutSearch(".decimal");
        stageName
            .open()
            .waitFilteringFinished()
            .isAttributeItemFiltered(true)
            .getValueList()
            .should("deep.equal", ["Closed Won", "Closed Lost"]);

        isWon.open().isAttributeItemFiltered(true).selectAttributeWithoutSearch("false");

        stageName
            .open()
            .waitFilteringFinished()
            .isAttributeItemFiltered(true)
            .getValueList()
            .should("deep.equal", ["Closed Lost"]);
    });

    it("Remove parent filter", () => {
        Navigation.visit("dashboard/dependent-filter");
        editMode.edit();
        widget.waitTableLoaded();

        account.open().selectAttributeWithoutSearch(".decimal");
        stageName
            .open()
            .waitFilteringFinished()
            .isAttributeItemFiltered(true)
            .getValueList()
            .should("have.length", 2);

        account.removeFilter();
        stageName.open().isAttributeItemFiltered(false).getValueList().should("have.length", 8);
    });

    it("(SEPARATE) Export on View Mode", () => {
        cy.intercept("POST", "**/exportDashboard").as("exportDashboard");
        Navigation.visit("dashboard/dependent-filter");
        widget.waitTableLoaded();

        account.open().selectAttributeWithoutSearch(".decimal");
        isWon.open().selectAttributeWithoutSearch("false");
        stageName.waitFilteringFinished();

        new DashboardMenu().toggle().clickOption("Export to PDF");

        cy.wait("@exportDashboard")
            .its("request.body.dashboardExport.filters")
            .should("deep.equal", [
                {
                    dateFilter: {
                        type: "absolute",
                        granularity: "GDC.time.year",
                    },
                },
                {
                    attributeFilter: {
                        displayForm: `/gdc/md/${getProjectId()}/obj/1055`,
                        negativeSelection: false,
                        attributeElements: [`/gdc/md/${getProjectId()}/obj/1054/elements?id=2870`],
                    },
                },
                {
                    attributeFilter: {
                        displayForm: `/gdc/md/${getProjectId()}/obj/1089`,
                        negativeSelection: true,
                        attributeElements: [],
                    },
                },
                {
                    attributeFilter: {
                        displayForm: `/gdc/md/${getProjectId()}/obj/1094`,
                        negativeSelection: false,
                        attributeElements: [`/gdc/md/${getProjectId()}/obj/1093/elements?id=460493`],
                    },
                },
            ]);
    });
});