// (C) 2020 GoodData Corporation
import React from "react";
import Truncate from "react-truncate";

import { DashboardItemHeadlineContainer } from "./DashboardItemHeadlineContainer";

interface IDashboardItemHeadlineProps {
    title: string;
    clientHeight?: number;
}

export const DashboardItemHeadline: React.FC<IDashboardItemHeadlineProps> = ({ title, clientHeight }) => {
    return (
        <DashboardItemHeadlineContainer clientHeight={clientHeight}>
            <Truncate lines={2} ellipsis={"..."} className="item-headline-inner s-headline">
                {title}
            </Truncate>
        </DashboardItemHeadlineContainer>
    );
};
