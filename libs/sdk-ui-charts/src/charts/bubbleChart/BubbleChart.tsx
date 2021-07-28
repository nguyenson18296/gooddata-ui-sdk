// (C) 2007-2018 GoodData Corporation
import React from "react";
import { IAttribute, IMeasure, INullableFilter, ISortItem, newBucket } from "@gooddata/sdk-model";
import { IBucketChartProps } from "../../interfaces";
import {
    BucketNames,
    useResolveValuesWithPlaceholders,
    MeasureOrPlaceholder,
    AttributeOrPlaceholder,
    NullableFiltersOrPlaceholders,
    SortsOrPlaceholders,
} from "@gooddata/sdk-ui";
import { pointyChartDimensions } from "../_commons/dimensions";
import { CoreBubbleChart } from "./CoreBubbleChart";
import { IChartDefinition } from "../_commons/chartDefinition";
import { withChart } from "../_base/withChart";

//
// Internals
//

const bubbleChartDefinition: IChartDefinition<IBubbleChartBucketProps, IBubbleChartProps> = {
    chartName: "BubbleChart",
    bucketPropsKeys: ["xAxisMeasure", "yAxisMeasure", "size", "viewBy", "filters", "sortBy"],
    bucketsFactory: (props) => {
        return [
            newBucket(BucketNames.MEASURES, props.xAxisMeasure as IMeasure),
            newBucket(BucketNames.SECONDARY_MEASURES, props.yAxisMeasure as IMeasure),
            newBucket(BucketNames.TERTIARY_MEASURES, props.size as IMeasure),
            newBucket(BucketNames.VIEW, props.viewBy as IAttribute),
        ];
    },
    executionFactory: (props, buckets) => {
        const { backend, workspace, execConfig } = props;

        return backend
            .withTelemetry("BubbleChart", props)
            .workspace(workspace)
            .execution()
            .forBuckets(buckets, props.filters as INullableFilter[])
            .withSorting(...(props.sortBy as ISortItem[]))
            .withDimensions(pointyChartDimensions)
            .withExecConfig(execConfig);
    },
};

//
// Public interface
//

/**
 * @public
 */
export interface IBubbleChartBucketProps {
    /**
     * Optionally specify measure which will be used to position bubbles on the X axis.
     */
    xAxisMeasure?: MeasureOrPlaceholder;

    /**
     * Optionally specify measure which will be used to position bubbles on the Y axis
     */
    yAxisMeasure?: MeasureOrPlaceholder;

    /**
     * Optionally specify measure which will be used to determine the size of each bubble.
     */
    size?: MeasureOrPlaceholder;

    /**
     * Optionally specify attribute whose values will be used to create the bubbles.
     */
    viewBy?: AttributeOrPlaceholder;

    /**
     * Optionally specify filters to apply on the data to chart.
     */
    filters?: NullableFiltersOrPlaceholders;

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
export interface IBubbleChartProps extends IBucketChartProps, IBubbleChartBucketProps {}

const WrappedBubbleChart = withChart(bubbleChartDefinition)(CoreBubbleChart);

/**
 * [BubbleChart](https://sdk.gooddata.com/gooddata-ui/docs/bubble_chart_component.html)
 *
 * Bubble chart shows data as bubbles using Cartesian coordinates. Bubble charts typically have three measures, one
 * for the X-axis, one for the Y-axis, and one that determines the size of each bubble. The data is sliced by an
 * attribute, with each bubble (an attribute item) noted with a different color.
 *
 * @public
 */
export const BubbleChart = (props: IBubbleChartProps) => {
    const [xAxisMeasure, yAxisMeasure, size, viewBy, filters, sortBy] = useResolveValuesWithPlaceholders(
        [props.xAxisMeasure, props.yAxisMeasure, props.size, props.viewBy, props.filters, props.sortBy],
        props.placeholdersResolutionContext,
    );

    return (
        <WrappedBubbleChart
            {...props}
            {...{
                xAxisMeasure,
                yAxisMeasure,
                size,
                viewBy,
                filters,
                sortBy,
            }}
        />
    );
};
