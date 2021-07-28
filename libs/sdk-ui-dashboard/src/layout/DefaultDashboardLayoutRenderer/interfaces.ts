// (C) 2019-2021 GoodData Corporation
import { DashboardWidget, IDashboardLayout, ScreenSize } from "@gooddata/sdk-backend-spi";
import { IDashboardLayoutItemFacade, IDashboardLayoutSectionFacade } from "./facade/interfaces";

/**
 * Default props provided to {@link IDashboardLayoutSectionKeyGetter}.
 *
 * @alpha
 */
export type IDashboardLayoutSectionKeyGetterProps<TWidget = DashboardWidget> = {
    /**
     * Dashboard layout section.
     */
    section: IDashboardLayoutSectionFacade<TWidget>;

    /**
     * Current screen type with respect to the set breakpoints.
     */
    screen: ScreenSize;
};

/**
 * Dashboard layout section key getter.
 * This callback is used to determine a unique key of the section.
 * By this callback, you can avoid unnecessary re-renders of the section components,
 * the returned unique key is passed to the React "key" property, when rendering rows.
 * By default, dashboard layout will use sectionIndex as a unique key.
 *
 * @alpha
 */
export type IDashboardLayoutSectionKeyGetter<TWidget = DashboardWidget> = (
    props: IDashboardLayoutSectionKeyGetterProps<TWidget>,
) => string;

/**
 * Default props provided to {@link IDashboardLayoutSectionRenderer}.
 *
 * @alpha
 */
export type IDashboardLayoutSectionRenderProps<TWidget = DashboardWidget> = {
    /**
     * Dashboard layout section.
     */
    section: IDashboardLayoutSectionFacade<TWidget>;

    /**
     * Current screen type with respect to the set breakpoints.
     */
    screen: ScreenSize;

    /**
     * Default renderer of the section - can be used as a fallback for custom sectionRenderer.
     */
    DefaultSectionRenderer: IDashboardLayoutSectionRenderer<TWidget>;

    /**
     * Columns rendered by columnRenderer.
     */
    children: React.ReactNode;

    /**
     * Additional section css class name.
     */
    className?: string;

    /**
     * Enable debug mode? (In debug mode, sections & items are highlighted for better overview of the layout structure).
     */
    debug?: boolean;

    /**
     * Is hidden section? Use this to hide the section without remounting it.
     */
    isHidden?: boolean;
};

/**
 * Dashboard layout section renderer.
 * Represents a component for rendering the section.
 *
 * @alpha
 */
export type IDashboardLayoutSectionRenderer<TWidget = DashboardWidget, TCustomProps = object> = (
    renderProps: IDashboardLayoutSectionRenderProps<TWidget> & TCustomProps,
) => JSX.Element;

/**
 * Default props provided to {@link IDashboardLayoutSectionHeaderRenderer}.
 *
 * @alpha
 */
export type IDashboardLayoutSectionHeaderRenderProps<TWidget = DashboardWidget> = {
    /**
     * Dashboard layout section.
     */
    section: IDashboardLayoutSectionFacade<TWidget>;

    /**
     * Current screen type with respect to the set breakpoints.
     */
    screen: ScreenSize;

    /**
     * Default renderer of the section header - can be used as a fallback for custom sectionHeaderRenderer.
     */
    DefaultSectionHeaderRenderer: IDashboardLayoutSectionHeaderRenderer<TWidget>;
};

/**
 * Dashboard layout section heder renderer.
 * Represents a component for rendering the section header.
 *
 * @alpha
 */
export type IDashboardLayoutSectionHeaderRenderer<TWidget = DashboardWidget, TCustomProps = object> = (
    renderProps: IDashboardLayoutSectionHeaderRenderProps<TWidget> & TCustomProps,
) => JSX.Element | null;

/**
 * Default props provided to {@link IDashboardLayoutItemKeyGetter}
 *
 * @alpha
 */
export type IDashboardLayoutItemKeyGetterProps<TWidget = DashboardWidget> = {
    /**
     * Dashboard layout item.
     */
    item: IDashboardLayoutItemFacade<TWidget>;

    /**
     * Current screen type with respect to the set breakpoints.
     */
    screen: ScreenSize;
};

/**
 * Dashboard layout item key getter.
 * This callback is used to determine a unique key of the item.
 * By this callback, you can avoid unnecessary re-renders of the item components,
 * the returned unique key is passed to the React "key" property, when rendering columns.
 * By default, dashboard layout will use columnIndex as a unique key.
 *
 * @alpha
 */
export type IDashboardLayoutItemKeyGetter<TWidget = DashboardWidget> = (
    props: IDashboardLayoutItemKeyGetterProps<TWidget>,
) => string;

/**
 * Default props provided to {@link IDashboardLayoutItemRenderer}
 *
 * @alpha
 */
export type IDashboardLayoutItemRenderProps<TWidget = DashboardWidget> = {
    /**
     * Dashboard layout item.
     */
    item: IDashboardLayoutItemFacade<TWidget>;

    /**
     * Current screen type with respect to the set breakpoints.
     */
    screen: ScreenSize;

    /**
     * Default renderer of the item - can be used as a fallback for custom columnRenderer.
     */
    DefaultItemRenderer: IDashboardLayoutItemRenderer<TWidget>;

    /**
     * Additional item css class name.
     */
    className?: string;

    /**
     * Minimum height of the item.
     */
    minHeight?: number;

    /**
     * Is hidden item? Use this to hide the item without remounting it.
     */
    isHidden?: boolean;

    /**
     * Widget rendered by widgetRenderer.
     */
    children: React.ReactNode;
};

/**
 * Dashboard layout item renderer.
 * Represents a component for rendering the item.
 *
 * @alpha
 */
export type IDashboardLayoutItemRenderer<TWidget = DashboardWidget, TCustomProps = object> = (
    renderProps: IDashboardLayoutItemRenderProps<TWidget> & TCustomProps,
) => JSX.Element;

/**
 * Default props provided to {@link IDashboardLayoutItemRenderer}
 *
 * @alpha
 */
export type IDashboardLayoutWidgetRenderProps<TWidget = DashboardWidget> = {
    /**
     * Dashboard layout item.
     */
    item: IDashboardLayoutItemFacade<TWidget>;

    /**
     * Current screen type with respect to the set breakpoints.
     */
    screen: ScreenSize;

    /**
     * React ref to content element.
     */
    contentRef?: React.RefObject<HTMLDivElement>;

    /**
     * Additional css class name of the content.
     */
    className?: string;

    /**
     * Content to render - widget, insight, or custom content.
     */
    children?: React.ReactNode;

    /**
     * Height of the content.
     */
    height?: React.CSSProperties["height"];

    /**
     * Minimum height of the content.
     */
    minHeight?: React.CSSProperties["minHeight"];

    /**
     * Allow vertical overflow?
     * (This basically sets overflowX to hidden and overflowY to auto)
     */
    allowOverflow?: boolean;

    /**
     * Was item size updated by layout sizing strategy?
     */
    isResizedByLayoutSizingStrategy?: boolean;

    /**
     * Enable debug mode? (In debug mode, sections & items are highlighted for better overview of the layout structure).
     */
    debug?: boolean;

    /**
     * Default widget renderer - can be used as a fallback for custom widgetRenderer.
     */
    DefaultWidgetRenderer: IDashboardLayoutWidgetRenderer<TWidget>;
};

/**
 * Dashboard layout content renderer.
 * Represents a component for rendering the item content.
 *
 * @alpha
 */
export type IDashboardLayoutWidgetRenderer<TWidget = DashboardWidget, TCustomProps = object> = (
    renderProps: IDashboardLayoutWidgetRenderProps<TWidget> & TCustomProps,
) => JSX.Element;

/**
 * Default props provided to {@link IDashboardLayoutGridRowRenderer}
 *
 * @alpha
 */
export type IDashboardLayoutGridRowRenderProps<TWidget = DashboardWidget> = {
    /**
     * Items rendered in one row.
     */
    children: JSX.Element[];

    /**
     * Dashboard layout section.
     */
    section: IDashboardLayoutSectionFacade<TWidget>;

    /**
     * Layout items - keep in mind that these items are only items in the current grid row, not the entire section.
     */
    items: IDashboardLayoutItemFacade<TWidget>[];

    /**
     * Current screen type with respect to the set breakpoints.
     */
    screen: ScreenSize;
};

/**
 * Dashboard layout grid row renderer.
 * Represents a component for rendering the real rendered row
 * with respect to the item sizing and the current screen size.
 *
 * @alpha
 */
export type IDashboardLayoutGridRowRenderer<TWidget = DashboardWidget, TCustomProps = object> = (
    renderProps: IDashboardLayoutGridRowRenderProps<TWidget> & TCustomProps,
) => JSX.Element;

/**
 * Dashboard layout render props.
 * Represents a customizable interface for rendering the layout.
 *
 * @alpha
 */
export type IDashboardLayoutRenderProps<TWidget = DashboardWidget> = {
    /**
     * Dashboard layout definition to render.
     */
    layout: IDashboardLayout<TWidget>;

    /**
     * Callback to determine a unique key of the section.
     * Check {@link IDashboardLayoutSectionKeyGetter} for more details.
     */
    sectionKeyGetter?: IDashboardLayoutSectionKeyGetter<TWidget>;

    /**
     * Render props callback to customize section rendering.
     */
    sectionRenderer?: IDashboardLayoutSectionRenderer<TWidget>;

    /**
     * Render props callback to customize section header rendering.
     */
    sectionHeaderRenderer?: IDashboardLayoutSectionHeaderRenderer<TWidget>;

    /**
     * Render props callback to customize rendering of the real rendered rows
     * with respect to the items sizing and the current screen size.
     */
    gridRowRenderer?: IDashboardLayoutGridRowRenderer<TWidget>;

    /**
     * Callback to determine a unique key of the item.
     * Check {@link IDashboardLayoutItemKeyGetter} for more details.
     */
    itemKeyGetter?: IDashboardLayoutItemKeyGetter<TWidget>;

    /**
     * Render props callback to customize item rendering.
     */
    itemRenderer?: IDashboardLayoutItemRenderer<TWidget>;

    /**
     * Render props callback to specify how to render the layout widget.
     */
    widgetRenderer: IDashboardLayoutWidgetRenderer<TWidget>;

    /**
     * Additional css class name for the dashboard layout root element.
     */
    className?: string;

    /**
     * Callback called on mouse leave event.
     */
    onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;

    /**
     * Enable debug mode? (In debug mode, sections & items are highlighted for better overview of the layout structure).
     */
    debug?: boolean;

    /**
     * Checks if feature flag enableKDWidgetCustomHeight is enabled
     */
    enableCustomHeight?: boolean;
};

/**
 * Dashboard layout renderer.
 * Represents a component for rendering the layout.
 *
 * @alpha
 */
export type IDashboardLayoutRenderer<TWidget = DashboardWidget, TCustomProps = object> = (
    renderProps: IDashboardLayoutRenderProps<TWidget> & TCustomProps,
) => JSX.Element;
