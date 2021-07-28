// (C) 2019-2021 GoodData Corporation
import React from "react";
import partition from "lodash/partition";
import { FormattedHTMLMessage } from "react-intl";
import { isDrillDownDefinition } from "@gooddata/sdk-ui-ext";
import { DashboardDrillDefinition } from "../interfaces";
import { DrillSelectListItem } from "./DrillSelectListItem";
import { DrillSelectItem } from "./interfaces";

export interface DrillSelectListProps {
    items: DrillSelectItem[];
    onSelect: (item: DashboardDrillDefinition) => void;
}

export const DrillSelectList: React.FunctionComponent<DrillSelectListProps> = (props) => {
    const { items } = props;

    const [drillDownItems, drillItems] = partition(items, (item: DrillSelectItem) => {
        return isDrillDownDefinition(item.drillDefinition);
    });

    const renderItems = (items: DrillSelectItem[]) => {
        return items.map((item) => (
            <DrillSelectListItem key={item.id} item={item} onClick={props.onSelect} />
        ));
    };

    const renderDrillDownItems = (items: DrillSelectItem[]) => {
        if (items && items.length > 0) {
            return (
                <>
                    <div className="gd-drill-modal-picker-title">
                        <FormattedHTMLMessage id="drill_modal_picker.drill-down" />
                    </div>
                    {renderItems(items)}
                </>
            );
        }
    };

    const renderDrillItems = (items: DrillSelectItem[]) => {
        if (items && items.length > 0) {
            return (
                <>
                    <div className="gd-drill-modal-picker-title">
                        <FormattedHTMLMessage id="drill_modal_picker.drill-into" />
                    </div>
                    {renderItems(items)}
                </>
            );
        }
    };

    return (
        <div className="gd-drill-modal-picker-selector-list">
            {renderDrillDownItems(drillDownItems)}
            {renderDrillItems(drillItems)}
        </div>
    );
};
