// (C) 2019-2020 GoodData Corporation
import { GdcMetadata, GdcMetadataObject } from "@gooddata/api-model-bear";
import {
    IMeasureExpressionToken,
    IMeasureMetadataObject,
    IMeasureMetadataObjectDefinition,
    IWorkspaceMeasuresService,
} from "@gooddata/sdk-backend-spi";
import { ObjRef } from "@gooddata/sdk-model";
import flow from "lodash/flow";
import map from "lodash/fp/map";
import replace from "lodash/fp/replace";
import uniq from "lodash/fp/uniq";
import {
    convertMetadataObject,
    SupportedMetadataObject,
    SupportedWrappedMetadataObject,
} from "../../../convertors/fromBackend/MetaConverter";
import { convertMetricFromBackend } from "../../../convertors/fromBackend/MetricConverter";
import { convertMetricToBackend } from "../../../convertors/toBackend/MetricConverter";
import { BearAuthenticatedCallGuard } from "../../../types/auth";
import { objRefToUri } from "../../../utils/api";
import { getTokenValuesOfType, tokenizeExpression } from "./measureExpressionTokens";

export class BearWorkspaceMeasures implements IWorkspaceMeasuresService {
    constructor(private readonly authCall: BearAuthenticatedCallGuard, public readonly workspace: string) {}

    public async getMeasureExpressionTokens(ref: ObjRef): Promise<IMeasureExpressionToken[]> {
        const uri = await objRefToUri(ref, this.workspace, this.authCall);
        const metricMetadata = await this.authCall((sdk) =>
            sdk.xhr.getParsed<GdcMetadataObject.WrappedObject>(uri),
        );

        if (!GdcMetadata.isWrappedMetric(metricMetadata)) {
            throw new Error(
                "To get measure expression tokens, provide the correct measure identifier. Did you provide a measure identifier?",
            );
        }

        const expressionTokens = tokenizeExpression(metricMetadata.metric.content.expression);
        const expressionIdentifiers = getTokenValuesOfType("identifier", expressionTokens);
        const expressionUris = getTokenValuesOfType("uri", expressionTokens);
        const expressionElementUris = getTokenValuesOfType("element_uri", expressionTokens);
        const expressionIdentifierUrisPairs = await this.authCall((sdk) =>
            sdk.md.getUrisFromIdentifiers(this.workspace, expressionIdentifiers),
        );
        const expressionIdentifierUris = expressionIdentifierUrisPairs.map((pair) => pair.uri);
        const allExpressionElementAttributeUris = flow(
            map(replace(/\/elements\?id=.*/, "")),
            uniq,
        )(expressionElementUris);
        const allExpressionUris = uniq([
            ...expressionUris,
            ...expressionIdentifierUris,
            ...allExpressionElementAttributeUris,
        ]);
        const allExpressionWrappedObjects = await this.authCall((sdk) =>
            sdk.md.getObjects<SupportedWrappedMetadataObject>(this.workspace, allExpressionUris),
        );
        const allExpressionObjects = allExpressionWrappedObjects.map(
            GdcMetadataObject.unwrapMetadataObject,
        ) as SupportedMetadataObject[];

        const allExpressionAttributeElements = await Promise.all(
            expressionElementUris.map((elementUri) =>
                this.authCall((sdk) => sdk.md.getAttributeElementDefaultDisplayFormValue(elementUri)),
            ),
        );

        const objectsByUri = allExpressionObjects.reduce(
            (acc: { [key: string]: GdcMetadataObject.IObject }, el) => {
                return {
                    ...acc,
                    [el.meta.uri!]: el,
                };
            },
            {},
        );

        const objectsByIdentifier = allExpressionObjects.reduce(
            (acc: { [key: string]: GdcMetadataObject.IObject }, el) => {
                return {
                    ...acc,
                    [el.meta.identifier!]: el,
                };
            },
            {},
        );

        const attributeElementsByUri = allExpressionAttributeElements.reduce(
            (acc: { [key: string]: GdcMetadata.IAttributeElement }, el) => {
                if (!el) {
                    return acc;
                }
                return {
                    ...acc,
                    [el.uri]: el,
                };
            },
            {},
        );

        return expressionTokens.map((token): IMeasureExpressionToken => {
            if (token.type === "element_uri") {
                const element = attributeElementsByUri[token.value];
                return {
                    type: "attributeElement",
                    ...(element
                        ? {
                              value: element.title,
                          }
                        : {
                              value: "",
                              deleted: true,
                          }),
                };
            } else if (token.type === "uri" || token.type === "identifier") {
                const meta =
                    token.type === "uri"
                        ? convertMetadataObject(objectsByUri[token.value])
                        : convertMetadataObject(objectsByIdentifier[token.value]);
                return {
                    type: meta.type,
                    value: meta.title,
                    ref: meta.ref,
                };
            }

            return {
                type: "text",
                value: token.value,
            };
        });
    }

    async createMeasure(measure: IMeasureMetadataObjectDefinition): Promise<IMeasureMetadataObject> {
        const mdObject = await this.authCall((sdk) =>
            sdk.md.createObject(this.workspace, { metric: convertMetricToBackend(measure) }),
        );

        return convertMetricFromBackend(mdObject.metric);
    }

    async deleteMeasure(ref: ObjRef): Promise<void> {
        const uri = await objRefToUri(ref, this.workspace, this.authCall);
        await this.authCall((sdk) => sdk.md.deleteObject(uri));
    }

    async updateMeasure(measure: IMeasureMetadataObject): Promise<IMeasureMetadataObject> {
        const objectId = measure.uri.split("/").slice(-1)[0];
        await this.authCall((sdk) => {
            return sdk.md.updateObject(this.workspace, objectId, { metric: convertMetricToBackend(measure) });
        });

        return measure;
    }
}
