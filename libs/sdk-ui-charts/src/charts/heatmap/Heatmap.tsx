// (C) 2007-2018 GoodData Corporation
import React from "react";
import {
    bucketAttribute,
    bucketsFind,
    IAttribute,
    IAttributeOrMeasure,
    IBucket,
    INullableFilter,
    ISortItem,
    newAttributeSort,
    newBucket,
} from "@gooddata/sdk-model";
import {
    BucketNames,
    useResolveValuesWithPlaceholders,
    AttributeMeasureOrPlaceholder,
    AttributeOrPlaceholder,
    NullableFiltersOrPlaceholders,
    SortsOrPlaceholders,
} from "@gooddata/sdk-ui";
import { heatmapDimensions } from "../_commons/dimensions";
import { IBucketChartProps } from "../../interfaces";
import { CoreHeatmap } from "./CoreHeatmap";
import { IChartDefinition } from "../_commons/chartDefinition";
import { withChart } from "../_base/withChart";

//
// Internals
//

const heatmapDefinition: IChartDefinition<IHeatmapBucketProps, IHeatmapProps> = {
    chartName: "Heatmap",
    bucketPropsKeys: ["measure", "rows", "columns", "filters", "sortBy"],
    bucketsFactory: (props) => {
        return [
            newBucket(BucketNames.MEASURES, props.measure as IAttributeOrMeasure),
            newBucket(BucketNames.VIEW, props.rows as IAttribute),
            newBucket(BucketNames.STACK, props.columns as IAttribute),
        ];
    },
    executionFactory: (props, buckets) => {
        const { backend, workspace, execConfig } = props;
        const sortBy = getDefaultHeatmapSort(buckets);

        return backend
            .withTelemetry("Heatmap", props)
            .workspace(workspace)
            .execution()
            .forBuckets(buckets, props.filters as INullableFilter[])
            .withSorting(...sortBy)
            .withDimensions(heatmapDimensions)
            .withExecConfig(execConfig);
    },
};

//
// Public interface
//

/**
 * @public
 */
export interface IHeatmapBucketProps {
    /**
     * Specify measure whose values will be charted on the heatmap.
     */
    measure: AttributeMeasureOrPlaceholder;

    /**
     * Optionally specify attribute, whose values will be used to create rows in the heatmap.
     */
    rows?: AttributeOrPlaceholder;

    /**
     * Optionally specify attribute, whose values will be used to create columns in the heatmap.
     */
    columns?: AttributeOrPlaceholder;

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
export interface IHeatmapProps extends IBucketChartProps, IHeatmapBucketProps {}

const WrappedHeatmap = withChart(heatmapDefinition)(CoreHeatmap);

/**
 * [Heatmap](https://sdk.gooddata.com/gooddata-ui/docs/heatmap_component.html)
 *
 * Heatmap represents data as a matrix where individual values are represented as colors.
 * Heatmaps can help you discover trends and understand complex datasets.
 *
 * @public
 */
export const Heatmap = (props: IHeatmapProps) => {
    const [measure, rows, columns, filters, sortBy] = useResolveValuesWithPlaceholders(
        [props.measure, props.rows, props.columns, props.filters, props.sortBy],
        props.placeholdersResolutionContext,
    );

    return (
        <WrappedHeatmap
            {...props}
            {...{
                measure,
                rows,
                columns,
                filters,
                sortBy,
            }}
        />
    );
};

function getDefaultHeatmapSort(buckets: IBucket[]): ISortItem[] {
    const viewBucket = bucketsFind(buckets, BucketNames.VIEW);
    const viewAttribute = viewBucket ? bucketAttribute(viewBucket) : undefined;
    if (viewAttribute) {
        return [newAttributeSort(viewAttribute, "desc")];
    }

    return [];
}
