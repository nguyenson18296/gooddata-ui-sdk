// (C) 2021 GoodData Corporation
import { ComponentType } from "react";
import {
    IAnalyticalBackend,
    IDashboardAttributeFilter,
    ITheme,
    IWorkspacePermissions,
} from "@gooddata/sdk-backend-spi";
import { ObjRef } from "@gooddata/sdk-model";
import { IDrillableItem, IErrorProps, IHeaderPredicate, ILoadingProps } from "@gooddata/sdk-ui";

import {
    CustomDashboardAttributeFilterComponent,
    CustomDashboardDateFilterComponent,
    CustomFilterBarComponent,
} from "../filterBar";
import { DashboardLayoutProps } from "../layout";
import { DashboardConfig, DashboardEventHandler } from "../model";
import { CustomScheduledEmailDialogComponent } from "../scheduledEmail";
import {
    CustomButtonBarComponent,
    CustomMenuButtonComponent,
    CustomTitleComponent,
    CustomTopBarComponent,
    IMenuButtonConfiguration,
} from "../topBar";
import {
    CustomDashboardInsightComponent,
    CustomDashboardKpiComponent,
    CustomDashboardWidgetComponent,
} from "../widget";

/**
 * @internal
 */
export interface IDashboardProps {
    /**
     * Analytical backend from which the dashboard obtains data to render.
     *
     * If you do not specify instance of analytical backend using this prop, then you MUST have
     * BackendProvider up in the component tree.
     */
    backend?: IAnalyticalBackend;

    /**
     * Identifier of analytical workspace, from which the dashboard obtains data to render.
     *
     * If you do not specify workspace identifier, then you MUST have WorkspaceProvider up in the
     * component tree.
     */
    workspace?: string;

    /**
     * Reference of the persisted dashboard to render.
     */
    dashboardRef: ObjRef;

    /**
     * Configuration that can be used to modify dashboard features, capabilities and behavior.
     *
     * If not specified, then the dashboard will retrieve and use the essential configuration from the backend.
     */
    config?: DashboardConfig;

    /**
     * Optionally specify permissions to use when determining availability of the different features of
     * the dashboard component.
     *
     * If you do not specify permissions, the dashboard component will load permissions for the currently
     * logged-in user.
     */
    permissions?: IWorkspacePermissions;

    /**
     * Configure drillability; e.g. which parts of the visualization can be interacted with.
     * These are applied to all the widgets in the dashboard. If specified, these override any drills specified in the dashboards.
     *
     * TODO: do we need more sophisticated logic to specify drillability?
     */
    drillableItems?: Array<IDrillableItem | IHeaderPredicate>;

    /**
     * Optionally specify event handlers to register at the dashboard creation time.
     *
     * Note: all events that will be emitted during the initial load processing will have the `initialLoad`
     * correlationId.
     *
     * TODO: this needs more attention.
     */
    eventHandlers?: DashboardEventHandler[];

    /**
     * Component to render if embedding fails.
     * This component is also used in all the individual widgets when they have some error occur.
     *
     * TODO do we need separate component for the dashboard as a whole and individual widgets?
     */
    ErrorComponent?: ComponentType<IErrorProps>;

    /**
     * Component to render while the dashboard or a widget is loading.
     * This component is also used in all the individual widgets while they are loading.
     *
     * TODO do we need separate component for the dashboard as a whole and individual widgets?
     */
    LoadingComponent?: ComponentType<ILoadingProps>;

    /**
     * Optionally configure how the dashboard layout looks and behaves.
     */
    dashboardLayoutConfig?: {
        /**
         * Specify component to use for rendering the layout.
         */
        Component?: ComponentType<DashboardLayoutProps>;

        /**
         * Optionally specify props to customize the default implementation of Dashboard View.
         *
         * This has no effect if custom component is used.
         */
        defaultComponentProps?: DashboardLayoutProps;
    };

    /**
     * Optionally specify component to use for rendering widgets.
     *
     * @remarks
     * To access the necessary props in your component, use the {@link useDashboardWidgetProps} hook.
     * To fall back to the default implementation, use the {@link DefaultDashboardWidget} component.
     *
     * @example
     *
     * ```tsx
     * // Simple component that alters the title of every widget
     * const CustomWidget = () => {
     *     const props = useDashboardWidgetProps();
     *
     *     const widget: IInsightWidget = {
     *         ...props.widget,
     *         title: `Prepend to ${props.widget.title}`,
     *     };
     *
     *     return <DefaultDashboardWidget {...props} widget={widget} />;
     * };
     * ```
     */
    WidgetComponent?: CustomDashboardWidgetComponent;

    /**
     * Optionally specify component to use for rendering insights.
     *
     * @remarks
     * To access the necessary props in your component, use the {@link useDashboardInsightProps} hook.
     * To fall back to the default implementation, use the {@link DefaultDashboardInsightWithDrillDialog} component.
     */
    InsightComponent?: CustomDashboardInsightComponent;

    /**
     * Optionally specify component to use for rendering KPI's.
     *
     * @remarks
     * To access the necessary props in your component, use the {@link useDashboardKpiProps} hook.
     * To fall back to the default implementation, use the {@link DefaultDashboardKpi} component.
     */
    KpiComponent?: CustomDashboardKpiComponent;

    /**
     * Optionally specify component to use for rendering the scheduled email dialog.
     *
     * @remarks
     * To access the necessary props in your component, use the {@link useScheduledEmailDialogProps} hook.
     * To fall back to the default implementation, use the {@link DefaultScheduledEmailDialog} component.
     */
    ScheduledEmailDialogComponent?: CustomScheduledEmailDialogComponent;

    /**
     * Optionally specify component to use for rendering the button bar.
     *
     * @remarks
     * To access the necessary props in your component, use the {@link useButtonBarProps} hook.
     * To fall back to the default implementation, use the {@link DefaultButtonBar} component.
     */
    ButtonBarComponent?: CustomButtonBarComponent;

    /**
     * Optionally specify component to use for rendering the menu button.
     *
     * @remarks
     * To access the necessary props in your component, use the {@link useMenuButtonProps} hook.
     * To fall back to the default implementation, use the {@link DefaultMenuButton} component.
     */
    MenuButtonComponent?: CustomMenuButtonComponent;

    /**
     * Optionally provide custom configuration for the Menu button.
     */
    menuButtonConfig?: IMenuButtonConfiguration;

    /**
     * Optionally specify component to use for rendering the top bar.
     *
     * @remarks
     * To access the necessary props in your component, use the {@link useTopBarProps} hook.
     * To fall back to the default implementation, use the {@link DefaultTopBar} component.
     *
     * Note that if you override this component, the ButtonBarComponent, MenuButtonComponent and TitleComponent
     * props might get ignored depending on your implementation.
     */
    TopBarComponent?: CustomTopBarComponent;

    /**
     * Optionally specify component to use for rendering the title.
     *
     * @remarks
     * To access the necessary props in your component, use the {@link useTitleProps} hook.
     * To fall back to the default implementation, use the {@link DefaultTitle} component.
     */
    TitleComponent?: CustomTitleComponent;

    /**
     * Optionally specify custom component to use for rendering all attribute filters or a factory function to customize the component
     * per different attribute filter.
     *
     * -  If not provided, the default implementation {@link DefaultDashboardAttributeFilter} will be used.
     * -  If factory function is provided and it returns undefined, then the default implementation {@link DefaultDashboardAttributeFilter}.
     *    This is useful if you want to customize just one particular filter and keep all other filters the same.
     *
     * @example
     * Here is how to override the component for all filters:
     * ```
     * ComponentFactory: () => MyCustomComponent
     * ```
     *
     * @remarks
     * If you want to hide some or all filters, you can use the {@link HiddenDashboardAttributeFilter} implementation.
     *
     * To access the necessary props in your custom component, use the {@link useDashboardAttributeFilterProps} hook.
     * To fall back to the default implementation, use the {@link DefaultDashboardAttributeFilter} component.
     */
    DashboardAttributeFilterComponentFactory?: (
        filter: IDashboardAttributeFilter,
    ) => CustomDashboardAttributeFilterComponent | undefined;

    /**
     * Optionally specify component to use for rendering the date filters.
     *
     * @remarks
     * To access the necessary props in your component, use the {@link useDashboardDateFilterProps} hook.
     * To fall back to the default implementation, use the {@link DefaultDashboardDateFilter} component.
     */
    DashboardDateFilterComponent?: CustomDashboardDateFilterComponent;

    /**
     * Optionally specify component to use for rendering the filter bar.
     *
     * @remarks
     * To access the necessary props in your component, use the {@link useFilterBarProps} hook.
     * To fall back to the default implementation, use the {@link DefaultFilterBar} component.
     *
     * Note that if you override this component, the DashboardAttributeFilterComponentFactory and DashboardDateFilterComponent
     * props might get ignored depending on your implementation.
     */
    FilterBarComponent?: CustomFilterBarComponent;

    /**
     *
     */
    children?: JSX.Element | ((dashboard: any) => JSX.Element);

    /**
     * Theme to use.
     *
     * Note: the theme can come either from this property or from ThemeContext or from the dashboard.
     * If you do not specify theme here, it will be taken from an existing ThemeContext or if there is no ThemeContext,
     * it will be loaded for the dashboard.
     */
    theme?: ITheme;

    /**
     * If provided it is called with loaded theme to allow its modification according to the app needs.
     * This is only applied to themes loaded from the backend, it is NOT applied to themes provided using
     * the "theme" prop.
     */
    themeModifier?: (theme: ITheme) => ITheme;
}
