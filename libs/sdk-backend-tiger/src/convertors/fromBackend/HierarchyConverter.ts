// (C) 2023 GoodData Corporation

import { ICatalogAttributeHierarchy, ObjectType, idRef } from "@gooddata/sdk-model";
import { JsonApiAttributeHierarchyOutWithLinks } from "@gooddata/api-client-tiger";
import compact from "lodash/compact.js";

export function convertAttributeHierarchy(
    hierarchyOut: JsonApiAttributeHierarchyOutWithLinks,
): ICatalogAttributeHierarchy {
    const { id, type, attributes, links } = hierarchyOut;
    const orderedAttributes = (attributes?.content as any)?.attributes ?? [];
    const convertedAttributes = orderedAttributes.map(
        (attribute: { identifier: { id: string; type: ObjectType } }) => {
            // content is free-form, so we need to make sure that all wanted properties are present
            if (!attribute.identifier?.id || !attribute.identifier?.type) {
                return undefined;
            }

            return idRef(attribute.identifier.id, attribute.identifier.type);
        },
    );

    return {
        type: "attributeHierarchy",
        attributeHierarchy: {
            type: "attributeHierarchy",
            id,
            uri: links?.self ?? "",
            ref: idRef(id, type),
            title: attributes?.title ?? "",
            description: attributes?.description ?? "",
            attributes: compact(convertedAttributes),
            production: true,
            deprecated: false,
            unlisted: false,
        },
    };
}
