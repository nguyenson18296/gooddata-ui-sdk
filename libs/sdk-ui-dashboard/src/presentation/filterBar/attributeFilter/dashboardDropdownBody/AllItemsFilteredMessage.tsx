// (C) 2021 GoodData Corporation
import React, { ReactNode } from "react";
import { ArrowOffsets, Bubble, BubbleHoverTrigger, IAlignPoint } from "@gooddata/sdk-ui-kit";
import { FormattedMessage } from "react-intl";

export interface IItemsFilteredMessageProps {
    parentFilterTitles: ReadonlyArray<string>;
}

const bubbleAlignPoints: IAlignPoint[] = [{ align: "bc tc" }];
const bubbleArrowOffsets: ArrowOffsets = { "bc tc": [0, 15] };

export const AllItemsFilteredMessage: React.FC<IItemsFilteredMessageProps> = ({ parentFilterTitles }) => {
    return (
        <div className="gd-attribute-filter-dropdown-all-items-filtered s-attribute-filter-dropdown-all-items-filtered">
            <BubbleHoverTrigger showDelay={0} hideDelay={0}>
                <div className="gd-filtered-message">
                    <FormattedMessage id="attributesDropdown.allItemsFiltered" />
                    <span className="gd-icon-circle-question" />
                </div>
                <Bubble
                    className="bubble-primary gd-attribute-filter-dropdown-bubble s-attribute-filter-dropdown-bubble"
                    alignPoints={bubbleAlignPoints}
                    arrowOffsets={bubbleArrowOffsets}
                >
                    <FormattedMessage
                        id="attributesDropdown.itemsFiltered.tooltip"
                        values={{
                            filters: parentFilterTitles.join(", "),
                            strong: (chunks: ReactNode) => <strong>{chunks}</strong>,
                        }}
                    />
                </Bubble>
            </BubbleHoverTrigger>
        </div>
    );
};
