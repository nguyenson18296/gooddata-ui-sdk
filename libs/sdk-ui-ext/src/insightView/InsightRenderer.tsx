// (C) 2020 GoodData Corporation
import React from "react";
import { v4 as uuidv4 } from "uuid";
import { render } from "react-dom";
import noop from "lodash/noop";
import isEqual from "lodash/isEqual";
import compose from "lodash/flowRight";
import { injectIntl, WrappedComponentProps } from "react-intl";
import { IExecutionFactory, IExportResult, ITheme, IUserWorkspaceSettings } from "@gooddata/sdk-backend-spi";
import { IInsightDefinition, insightProperties, IColorPalette, insightTitle } from "@gooddata/sdk-model";

import { IVisualization, IVisProps, FullVisualizationCatalog } from "../internal";
import {
    OnError,
    fillMissingTitles,
    ignoreTitlesForSimpleMeasures,
    ILocale,
    withContexts,
    DefaultLocale,
    LoadingComponent,
    ErrorComponent,
    IExportFunction,
    IExtendedExportConfig,
    IntlWrapper,
} from "@gooddata/sdk-ui";
import {
    ExecutionFactoryUpgradingToExecByReference,
    ExecutionFactoryWithFixedFilters,
} from "@gooddata/sdk-backend-base";
import { withTheme } from "@gooddata/sdk-ui-theme-provider";
import { IInsightViewProps } from "./types";

/**
 * @internal
 */
export interface IInsightRendererProps
    extends Omit<
        IInsightViewProps,
        "insight" | "TitleComponent" | "onInsightLoaded" | "showTitle" | "afterRender"
    > {
    insight: IInsightDefinition | undefined;
    locale: ILocale;
    settings: IUserWorkspaceSettings | undefined;
    colorPalette: IColorPalette | undefined;
    onError?: OnError;
    theme?: ITheme;
}

const getElementId = () => `gd-vis-${uuidv4()}`;

const visualizationUriRootStyle: React.CSSProperties = {
    height: "100%",
    display: "flex",
    flex: "1 1 auto",
    flexDirection: "column",
};

// this needs to be a pure component as it can happen that this might be rendered multiple times
// with the same props (referentially) - this might make the rendered visualization behave unpredictably
// and is bad for performance so we need to make sure the re-renders are performed only if necessary
class InsightRendererCore extends React.PureComponent<IInsightRendererProps & WrappedComponentProps> {
    private elementId = getElementId();
    private visualization: IVisualization | undefined;
    private containerRef = React.createRef<HTMLDivElement>();

    public static defaultProps: Pick<
        IInsightRendererProps,
        "ErrorComponent" | "filters" | "drillableItems" | "LoadingComponent" | "pushData" | "locale"
    > = {
        ErrorComponent,
        filters: [],
        drillableItems: [],
        LoadingComponent,
        pushData: noop,
        locale: DefaultLocale,
    };

    private unmountVisualization = () => {
        if (this.visualization) {
            this.visualization.unmount();
        }
        this.visualization = undefined;
    };

    private updateVisualization = () => {
        // if the container no longer exists, update was called after unmount -> do nothing
        if (!this.visualization || !this.containerRef.current) {
            return;
        }

        // if there is no insight, bail early
        if (!this.props.insight) {
            return;
        }

        const { config = {} } = this.props;
        const { responsiveUiDateFormat } = this.props.settings ?? {};

        const visProps: IVisProps = {
            locale: this.props.locale,
            dateFormat: responsiveUiDateFormat,
            custom: {
                drillableItems: this.props.drillableItems,
            },
            config: {
                separators: config.separators,
                colorPalette: this.props.colorPalette,
                mapboxToken: config.mapboxToken,
                forceDisableDrillOnAxes: config.forceDisableDrillOnAxes,
                isInEditMode: false,
            },
            executionConfig: this.props.execConfig,
            customVisualizationConfig: config,
            theme: this.props.theme,
        };

        this.visualization.update(
            visProps,
            ignoreTitlesForSimpleMeasures(fillMissingTitles(this.props.insight, this.props.locale)),
            {},
            this.getExecutionFactory(),
        );
    };

    private setupVisualization = async () => {
        // if there is no insight, bail early
        if (!this.props.insight) {
            return;
        }

        this.props.onLoadingChanged?.({ isLoading: true });

        // the visualization we may have from earlier is no longer valid -> get rid of it
        this.unmountVisualization();

        const visualizationFactory = FullVisualizationCatalog.forInsight(this.props.insight).getFactory();

        this.visualization = visualizationFactory({
            backend: this.props.backend,
            callbacks: {
                onError: (error) => {
                    this.props.onError?.(error);
                    this.props.onLoadingChanged?.({ isLoading: false });
                },
                onLoadingChanged: ({ isLoading }) => {
                    this.props.onLoadingChanged?.({ isLoading });
                },
                pushData: this.props.pushData,
                onDrill: this.props.onDrill,
                onExportReady: this.onExportReadyDecorator,
            },
            configPanelElement: ".gd-configuration-panel-content", // this is apparently a well-know constant (see BaseVisualization)
            element: `#${this.elementId}`,
            environment: "dashboards", // TODO get rid of this
            locale: this.props.locale,
            projectId: this.props.workspace,
            visualizationProperties: insightProperties(this.props.insight),
            featureFlags: this.props.settings,
            renderFun: render,
        });
    };

    private onExportReadyDecorator = (exportFunction: IExportFunction): void => {
        if (!this.props.onExportReady) {
            return;
        }

        const decorator = (exportConfig: IExtendedExportConfig): Promise<IExportResult> => {
            if (exportConfig.title || !this.props.insight) {
                return exportFunction(exportConfig);
            }

            return exportFunction({
                ...exportConfig,
                title: insightTitle(this.props.insight),
            });
        };

        this.props.onExportReady(decorator);
    };

    private getExecutionFactory = (): IExecutionFactory => {
        const factory = this.props.backend.workspace(this.props.workspace).execution();

        if (this.props.executeByReference) {
            /*
             * When executing by reference, decorate the original execution factory so that it
             * transparently routes `forInsight` to `forInsightByRef` AND adds the filters
             * from InsightView props.
             *
             * Code will pass this factory over to the pluggable visualizations - they will do execution
             * `forInsight` and under the covers things will be routed and done differently without the
             * plug viz knowing.
             */
            return new ExecutionFactoryUpgradingToExecByReference(
                new ExecutionFactoryWithFixedFilters(factory, this.props.filters),
            );
        }

        return factory;
    };

    private componentDidMountInner = async () => {
        await this.setupVisualization();
        return this.updateVisualization();
    };

    public componentDidMount(): void {
        this.componentDidMountInner();
    }

    private componentDidUpdateInner = async (prevProps: IInsightRendererProps) => {
        const needsNewSetup =
            !isEqual(this.props.insight, prevProps.insight) ||
            !isEqual(this.props.filters, prevProps.filters) ||
            this.props.workspace !== prevProps.workspace;

        if (needsNewSetup) {
            await this.setupVisualization();
        }

        return this.updateVisualization();
    };

    public componentDidUpdate(prevProps: IInsightRendererProps & WrappedComponentProps): void {
        this.componentDidUpdateInner(prevProps);
    }

    public componentWillUnmount() {
        this.unmountVisualization();
    }

    public render(): React.ReactNode {
        return (
            // never ever dynamically change the props of this div, otherwise bad things will happen
            // e.g. visualization being rendered multiple times, etc.
            <div
                className="visualization-uri-root"
                id={this.elementId}
                ref={this.containerRef}
                style={visualizationUriRootStyle}
            />
        );
    }
}

export const IntlInsightRenderer = compose(injectIntl, withTheme, withContexts)(InsightRendererCore);

/**
 * Renders insight passed as a parameter.
 *
 * @internal
 */
export class InsightRenderer extends React.Component<IInsightRendererProps> {
    public render(): React.ReactNode {
        return (
            <IntlWrapper locale={this.props.locale}>
                <IntlInsightRenderer {...this.props} />
            </IntlWrapper>
        );
    }
}
