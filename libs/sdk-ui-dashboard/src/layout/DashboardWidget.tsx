// (C) 2020 GoodData Corporation
import React from "react";
import { useDashboardComponentsContext } from "../dashboardAux";
import { DashboardWidgetProps } from "./types";

/**
 * @internal
 */
export const DashboardWidget = (props: DashboardWidgetProps): JSX.Element => {
    const { WidgetComponent } = useDashboardComponentsContext();

    return <WidgetComponent {...props} />;
};
