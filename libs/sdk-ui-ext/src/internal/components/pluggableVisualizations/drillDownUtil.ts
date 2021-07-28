// (C) 2020-2021 GoodData Corporation
import {
    areObjRefsEqual,
    attributeLocalId,
    bucketItemLocalId,
    IAttribute,
    IAttributeOrMeasure,
    IFilter,
    IInsight,
    insightItems,
    insightModifyItems,
    insightProperties,
    insightReduceItems,
    insightSetFilters,
    insightSetProperties,
    isAttribute,
    modifyAttribute,
    newPositiveAttributeFilter,
    VisualizationProperties,
} from "@gooddata/sdk-model";
import {
    getIntersectionPartAfter,
    IDrillEventIntersectionElement,
    isDrillIntersectionAttributeItem,
} from "@gooddata/sdk-ui";
import { drillDownDisplayForm, drillDownFromAttributeLocalId } from "../../utils/ImplicitDrillDownHelper";
import { ColumnWidthItem, isAttributeColumnWidthItem } from "@gooddata/sdk-ui-pivot";
import { IDrillDownDefinition } from "../../interfaces/Visualization";

function matchesDrillDownTargetAttribute(
    drillDefinition: IDrillDownDefinition,
    attribute: IAttribute,
): boolean {
    return attributeLocalId(attribute) === drillDownFromAttributeLocalId(drillDefinition);
}

enum ENUM_PROPERTIES_TYPE {
    CONTROLS = "controls",
}

export function modifyBucketsAttributesForDrillDown(
    insight: IInsight,
    drillDefinition: IDrillDownDefinition,
): IInsight {
    const removedLeftAttributes = insightReduceItems(
        insight,
        (acc: IAttributeOrMeasure[], cur: IAttributeOrMeasure): IAttributeOrMeasure[] => {
            if (isAttribute(cur) && matchesDrillDownTargetAttribute(drillDefinition, cur)) {
                return [cur];
            }

            return [...acc, cur];
        },
    );

    const replacedDrill = insightModifyItems(
        removedLeftAttributes,
        (bucketItem: IAttributeOrMeasure): IAttributeOrMeasure => {
            if (isAttribute(bucketItem) && matchesDrillDownTargetAttribute(drillDefinition, bucketItem)) {
                const displayForm = drillDownDisplayForm(drillDefinition);
                return modifyAttribute(bucketItem, (a) => a.displayForm(displayForm).noAlias());
            }
            return bucketItem;
        },
    );

    const removedDuplicitAttributes = insightReduceItems(
        replacedDrill,
        (acc: IAttributeOrMeasure[], cur: IAttributeOrMeasure): IAttributeOrMeasure[] => {
            if (isAttribute(cur)) {
                const alreadyContainsTarget = acc
                    .filter(isAttribute)
                    .find((attr) => areObjRefsEqual(cur.attribute.displayForm, attr.attribute.displayForm));
                return alreadyContainsTarget ? acc : [...acc, cur];
            }

            return [...acc, cur];
        },
    );

    return removedDuplicitAttributes;
}

function removePropertiesForRemovedAttributes(insight: IInsight): IInsight {
    const properties: VisualizationProperties = insightProperties(insight);

    if (!properties) {
        return insight;
    }

    const identifiers = insightItems(insight).map((bucketItem: IAttributeOrMeasure) =>
        bucketItemLocalId(bucketItem),
    );

    const result = Object.entries(properties).reduce((acc, [key, value]) => {
        if (key === ENUM_PROPERTIES_TYPE.CONTROLS && value.columnWidths) {
            const columns = value.columnWidths.filter((columnWidth: ColumnWidthItem) => {
                if (isAttributeColumnWidthItem(columnWidth)) {
                    return identifiers.includes(columnWidth.attributeColumnWidthItem.attributeIdentifier);
                }
                return true;
            });

            return {
                ...acc,
                [key]: {
                    columnWidths: columns,
                },
            };
        }

        return { ...acc };
    }, properties);

    return insightSetProperties(insight, result);
}

export function sanitizeTableProperties(insight: IInsight): IInsight {
    return removePropertiesForRemovedAttributes(insight);
}

export function convertIntersectionToFilters(intersections: IDrillEventIntersectionElement[]): IFilter[] {
    return intersections
        .map((intersection) => intersection.header)
        .filter(isDrillIntersectionAttributeItem)
        .map((header) =>
            newPositiveAttributeFilter(header.attributeHeader.ref, {
                uris: [header.attributeHeaderItem.uri],
            }),
        );
}

export function reverseAndTrimIntersection(
    drillConfig: IDrillDownDefinition,
    intersection?: IDrillEventIntersectionElement[],
): IDrillEventIntersectionElement[] {
    if (!intersection || intersection.length === 0) {
        return intersection;
    }

    const clicked = drillDownFromAttributeLocalId(drillConfig);
    const reorderedIntersection = intersection.slice().reverse();
    return getIntersectionPartAfter(reorderedIntersection, clicked);
}

export function addIntersectionFiltersToInsight(
    source: IInsight,
    intersection: IDrillEventIntersectionElement[],
): IInsight {
    const filters = convertIntersectionToFilters(intersection);
    const resultFilters = [...source.insight.filters, ...filters];

    return insightSetFilters(source, resultFilters);
}
