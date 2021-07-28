// (C) 2007-2019 GoodData Corporation
import React from "react";
import {
    IAttributeOrMeasure,
    applyRatioRule,
    IAttribute,
    IFilter,
    newBucket,
    ISortItem,
} from "@gooddata/sdk-model";
import { truncate } from "../_commons/truncate";
import {
    BucketNames,
    useResolveValuesWithPlaceholders,
    AttributeOrPlaceholder,
    AttributesOrPlaceholders,
    AttributesMeasuresOrPlaceholders,
    FiltersOrPlaceholders,
    SortsOrPlaceholders,
} from "@gooddata/sdk-ui";
import { stackedChartDimensions } from "../_commons/dimensions";
import { IBucketChartProps, ViewByAttributesLimit } from "../../interfaces";
import { CoreColumnChart } from "./CoreColumnChart";
import { IChartDefinition } from "../_commons/chartDefinition";
import { withChart } from "../_base/withChart";
import { sanitizeConfig } from "../_commons/sanitizeStacking";

//
// Internals
//

const columnChartDefinition: IChartDefinition<IColumnChartBucketProps, IColumnChartProps> = {
    chartName: "ColumnChart",
    bucketPropsKeys: ["measures", "viewBy", "stackBy", "filters", "sortBy"],
    bucketsFactory: (props) => {
        const measures = applyRatioRule(props.measures as IAttributeOrMeasure[]);
        const viewBy = truncate(props.viewBy, ViewByAttributesLimit); // could be one or two attributes

        return [
            newBucket(BucketNames.MEASURES, ...measures),
            newBucket(BucketNames.VIEW, ...(viewBy as IAttribute[])),
            newBucket(BucketNames.STACK, props.stackBy as IAttribute),
        ];
    },
    executionFactory: (props, buckets) => {
        const { backend, workspace, execConfig } = props;

        return backend
            .withTelemetry("ColumnChart", props)
            .workspace(workspace)
            .execution()
            .forBuckets(buckets, props.filters as IFilter[])
            .withSorting(...(props.sortBy as ISortItem[]))
            .withDimensions(stackedChartDimensions)
            .withExecConfig(execConfig);
    },
    propOverridesFactory: (props, buckets) => {
        return {
            config: sanitizeConfig(buckets, props.config),
        };
    },
};

//
// Public interface
//

/**
 * @public
 */
export interface IColumnChartBucketProps {
    /**
     * Specify one or more measures to display on the column chart.
     *
     * Note: it is possible to also include an attribute object among measures. In that case cardinality of the
     * attribute elements will be charted.
     */
    measures: AttributesMeasuresOrPlaceholders;

    /**
     * Optionally specify one or two attributes to slice the measures along the X axis.
     *
     * If you specify two attributes, the values of these attributes will appear on the X axis as grouped. For each
     * value of the first attribute there will be all applicable values of the second attribute. For each value of the
     * second attribute there will be a column indicating the respective slice's value.
     */
    viewBy?: AttributeOrPlaceholder | AttributesOrPlaceholders;

    /**
     * Optionally specify attribute to stack the bars by.
     */
    stackBy?: AttributeOrPlaceholder;

    /**
     * Optionally specify filters to apply on the data to chart.
     */
    filters?: FiltersOrPlaceholders;

    /**
     * Optionally specify how to sort the data to chart.
     */
    sortBy?: SortsOrPlaceholders;

    /**
     * Optional resolution context for composed placeholders.
     */
    placeholdersResolutionContext?: any;
}

/**
 * @public
 */
export interface IColumnChartProps extends IBucketChartProps, IColumnChartBucketProps {}

const WrappedColumnChart = withChart(columnChartDefinition)(CoreColumnChart);

/**
 * [ColumnChart](http://sdk.gooddata.com/gooddata-ui/docs/column_chart_component.html)
 *
 * Column chart shows data in vertical columns. Column charts can display one or multiple measures side by side,
 * divided by either attribute values or by a single measure stacked by attribute values.
 *
 * @public
 */
export const ColumnChart = (props: IColumnChartProps) => {
    const [measures, viewBy, stackBy, filters, sortBy] = useResolveValuesWithPlaceholders(
        [props.measures, props.viewBy, props.stackBy, props.filters, props.sortBy],
        props.placeholdersResolutionContext,
    );

    return (
        <WrappedColumnChart
            {...props}
            {...{
                measures,
                viewBy,
                stackBy,
                filters,
                sortBy,
            }}
        />
    );
};
