// (C) 2007-2021 GoodData Corporation
import {
    IUserWorkspaceSettings,
    IWidgetAlertDefinition,
    IKpiWidgetDefinition,
} from "@gooddata/sdk-backend-spi";
import { IFilter } from "@gooddata/sdk-model";
import { GoodDataSdkError, isNoDataSdkError } from "@gooddata/sdk-ui";
import { Bubble, BubbleHoverTrigger } from "@gooddata/sdk-ui-kit";
import cx from "classnames";
import React, { Component, MouseEvent } from "react";
import { FormattedMessage } from "react-intl";

import { DashboardItemKpi } from "../../../layout/DashboardItem";
import { IKpiResult, IKpiAlertResult, KpiAlertOperationStatus } from "../types";
import { isAlertingTemporarilyDisabledForGivenFilter } from "./utils/filterUtils";

// adapted from jQuery:
// https://github.com/jquery/jquery/blob/a503c691dc06c59acdafef6e54eca2613c6e4032/src/offset.js#L83-L97
function getNodeDocumentRelativeOffsetTop(node: HTMLDivElement): number {
    // Return zeros for disconnected and hidden (display: none) elements (gh-2310)
    // Support: IE <=11+
    // Running getBoundingClientRect on a
    // disconnected node in IE throws an error
    if (!node.getClientRects().length) {
        return 0;
    }

    // Get document-relative position by adding viewport scroll to viewport-relative gBCR
    const rect = node.getBoundingClientRect();
    const win = node.ownerDocument.defaultView;
    return rect.top + (win?.pageYOffset ?? 0);
}

export interface IDashboardItemWithKpiAlertProps {
    // KPI
    kpi: IKpiWidgetDefinition;
    isLoading: boolean;
    filters?: IFilter[];
    kpiResult: IKpiResult | undefined;

    // Alert
    alert?: IWidgetAlertDefinition;
    kpiAlertResult?: IKpiAlertResult | undefined;
    alertExecutionError?: GoodDataSdkError;
    isAlertExecutionLoading?: boolean;

    canSetAlert?: boolean;
    userWorkspaceSettings?: IUserWorkspaceSettings;
    isAlertDialogOpen?: boolean;
    isAlertHighlighted?: boolean;
    isAlertLoading?: boolean;
    alertSavingStatus?: KpiAlertOperationStatus;
    alertUpdatingStatus?: KpiAlertOperationStatus;
    alertDeletingStatus?: KpiAlertOperationStatus;
    isAlertBroken?: boolean;

    isReadOnlyMode?: boolean;

    // Callbacks
    onAlertDialogOpenClick: () => void;

    contentClassName?: string;
    kpiClassName?: string;
    /**
     * When true, alert will not be highlighted when triggered.
     */
    suppressAlertTriggered?: boolean;

    children: (params: { clientWidth: number; clientHeight: number }) => React.ReactNode;
    renderHeadline: (clientHeight: number) => React.ReactNode;
    renderAlertDialog: () => React.ReactNode;
}

interface IDashboardItemWithKpiAlertState {
    isKpiAlertAfterSaving: boolean;
    isKpiAlertAfterDeleting: boolean;
    isAlertHighlighted: boolean;
}

export class DashboardItemWithKpiAlert extends Component<
    IDashboardItemWithKpiAlertProps,
    IDashboardItemWithKpiAlertState
> {
    static defaultProps: Pick<
        IDashboardItemWithKpiAlertProps,
        | "isAlertHighlighted"
        | "filters"
        | "alertDeletingStatus"
        | "alertSavingStatus"
        | "alertUpdatingStatus"
        | "suppressAlertTriggered"
        | "isReadOnlyMode"
    > = {
        isAlertHighlighted: false,
        filters: [],
        alertDeletingStatus: "idle",
        alertSavingStatus: "idle",
        alertUpdatingStatus: "idle",
        suppressAlertTriggered: false,
        isReadOnlyMode: false,
    };

    private timeouts = {};
    private isScrolledToHighlightedAlert = false;
    private node = React.createRef<HTMLDivElement>();

    state: IDashboardItemWithKpiAlertState = {
        isKpiAlertAfterSaving: false,
        isKpiAlertAfterDeleting: false,
        isAlertHighlighted: false,
    };

    UNSAFE_componentWillReceiveProps(nextProps: IDashboardItemWithKpiAlertProps): void {
        if (this.isKpiAlertSaved(nextProps)) {
            this.updateStatePropertyForTime("isKpiAlertAfterSaving", 1000);
        }

        if (this.isKpiAlertDeleted(nextProps)) {
            this.updateStatePropertyForTime("isKpiAlertAfterDeleting", 1000);
        }

        if (!this.props.isAlertHighlighted && nextProps.isAlertHighlighted) {
            this.updateStatePropertyForTime("isAlertHighlighted", 5000);
        }
    }

    componentDidUpdate(): void {
        if (this.props.isAlertHighlighted && !this.isScrolledToHighlightedAlert) {
            this.isScrolledToHighlightedAlert = true;
            const node = this.node.current;

            if (node) {
                window.scrollTo(0, getNodeDocumentRelativeOffsetTop(node));
            }
        }
    }

    componentWillUnmount(): void {
        this.clearUpdatingTimeout();
    }

    // toggle property to true for given amount of time
    updateStatePropertyForTime(name: keyof IDashboardItemWithKpiAlertState, timeout: number): void {
        const { isKpiAlertAfterSaving, isKpiAlertAfterDeleting, isAlertHighlighted } = this.state;

        this.clearUpdatingTimeout(name);

        this.setState({
            isKpiAlertAfterSaving,
            isKpiAlertAfterDeleting,
            isAlertHighlighted,
            [name]: true,
        });

        this.timeouts[name] = setTimeout(() => {
            this.setState({
                isKpiAlertAfterSaving,
                isKpiAlertAfterDeleting,
                isAlertHighlighted,
                [name]: false,
            });
        }, timeout);
    }

    clearUpdatingTimeout(name?: string): void {
        if (name && this.timeouts[name]) {
            clearTimeout(this.timeouts[name]);
            delete this.timeouts[name];
        } else {
            Object.keys(this.timeouts).forEach((key) => clearTimeout(this.timeouts[key]));
            this.timeouts = {};
        }
    }

    isKpiAlertSaved(nextProps: IDashboardItemWithKpiAlertProps): boolean {
        return (
            !this.state.isKpiAlertAfterSaving &&
            this.props.alertSavingStatus === "inProgress" &&
            nextProps.alertSavingStatus === "idle"
        );
    }

    isKpiAlertDeleted(nextProps: IDashboardItemWithKpiAlertProps): boolean {
        return (
            !this.state.isKpiAlertAfterDeleting &&
            this.props.alertDeletingStatus === "inProgress" &&
            nextProps.alertDeletingStatus === "idle"
        );
    }

    renderAlertBox = (): React.ReactNode => {
        const isAlertingTemporarilyDisabled = isAlertingTemporarilyDisabledForGivenFilter(
            this.props.kpi,
            this.props.filters!,
            this.props.userWorkspaceSettings,
        );

        const alertIconClasses = cx(
            "dash-item-action",
            "dash-item-action-alert",
            "s-dash-item-action-alert",
            "gd-icon-bell",
            {
                "alert-set": this.state.isKpiAlertAfterSaving,
                "alert-deleted": this.state.isKpiAlertAfterDeleting,
            },
        );

        // TODO: Remove "isAlertingTemporarilyDisabledForGivenFilter" when alerts support absolute filters (RAIL-1456, RAIL-1457).
        //       When alert is set, we allow opening the alert box so user can edit/delete it.
        if (
            this.props.isReadOnlyMode ||
            !this.props.canSetAlert ||
            (isAlertingTemporarilyDisabled && !this.props.alert)
        ) {
            const bubbleMessage = this.props.isReadOnlyMode ? (
                <FormattedMessage id="kpi.alertBox.disabledInReadOnly" />
            ) : (
                <FormattedMessage
                    id={
                        !isAlertingTemporarilyDisabled
                            ? "kpi.alertBox.unverifiedEmail"
                            : "visualization.alert_not_supported"
                    }
                />
            );

            return (
                <BubbleHoverTrigger
                    showDelay={0}
                    hideDelay={0}
                    tagName="div"
                    className={cx(alertIconClasses, "disabled")}
                >
                    {/* no children here since alert icon is only a styled div with classes ^^^ */}
                    <Bubble className="bubble-primary" alignPoints={[{ align: "cr cl" }, { align: "cl cr" }]}>
                        {bubbleMessage}
                    </Bubble>
                </BubbleHoverTrigger>
            );
        }

        return (
            <div onClick={this.onAlertDialogOpenClick}>
                <BubbleHoverTrigger className={alertIconClasses} showDelay={500} hideDelay={0} tagName="div">
                    <Bubble className="bubble-primary" alignPoints={[{ align: "tc bc" }, { align: "tc br" }]}>
                        <FormattedMessage id="kpi.alertBox.title" />
                    </Bubble>
                </BubbleHoverTrigger>
            </div>
        );
    };

    onAlertDialogOpenClick = (e: MouseEvent): void => {
        e.stopPropagation();
        this.props.onAlertDialogOpenClick();
    };

    getClassNames(): { content: string; kpi: string } {
        const { kpiAlertResult } = this.props;
        const isNoData = isNoDataSdkError(this.props.alertExecutionError);
        const hasEvaluationResult = isNoData || kpiAlertResult?.measureResult !== undefined;
        const content = cx(this.props.contentClassName, {
            "is-alert-dialog": this.props.isAlertDialogOpen,
            "has-set-alert": !!this.props.alert,
            "is-alert-triggered":
                hasEvaluationResult && this.props.alert?.isTriggered && !this.props.suppressAlertTriggered,
            "is-alert-broken": hasEvaluationResult && this.props.isAlertBroken,
            "is-alert-highlighted": this.state.isAlertHighlighted,
            "is-alert-evaluating": this.props.isAlertExecutionLoading,
        });

        const kpi = cx(
            this.props.kpiClassName,
            "s-dashboard-kpi-component",
            "widget-loaded",
            "visualization",
            {
                "kpi-with-pop": this.props.kpi.kpi.comparisonType !== "none",
                "content-loading": this.props.isLoading,
                "content-loaded": !this.props.isLoading,
            },
        );
        return {
            content,
            kpi,
        };
    }

    render(): JSX.Element {
        const classnames = this.getClassNames();

        return (
            <DashboardItemKpi
                contentClassName={classnames.content}
                visualizationClassName={classnames.kpi}
                contentRef={this.node}
                renderAfterContent={() => this.props.isAlertDialogOpen && this.props.renderAlertDialog()}
                renderHeadline={(clientHeight) => (
                    <>
                        {/* TODO: the alert box should be rendered using renderBeforeKpi prop, but Graphene selectors */}
                        {/* aren't ready for that, so we abuse the renderHeadline prop a little for now... */}
                        {this.renderAlertBox()}
                        {this.props.renderHeadline(clientHeight)}
                    </>
                )}
            >
                {this.props.children}
            </DashboardItemKpi>
        );
    }
}
