// (C) 2019-2020 GoodData Corporation
import React from "react";
import { mount, ReactWrapper } from "enzyme";
import noop from "lodash/noop";

import { RepeatTypeSelect, IRepeatTypeSelectProps } from "../RepeatTypeSelect";
import { getDayName, getWeek } from "../../../utils/datetime";
import { REPEAT_TYPES } from "../../../constants";
import { IntlWrapper } from "../../../../../localization/IntlWrapper";

import {
    getDropdownTitle,
    openDropdown,
    selectDropdownItem,
    REPEAT_TYPE_INDEX,
    TEXT_INDEX,
} from "./testUtils";

describe("RepeatTypeSelect", () => {
    const now = new Date();
    const titleTypeDaily = "Daily";
    const titleTypeWeekly = `Weekly on ${getDayName(now)}`;
    const titleTypeMonthly = `Monthly on the ${TEXT_INDEX[getWeek(now)]} ${getDayName(now)}`;
    const titleTypeCustom = "Custom";

    function renderComponent(customProps: Partial<IRepeatTypeSelectProps> = {}): ReactWrapper {
        const defaultProps = {
            repeatType: REPEAT_TYPES.DAILY,
            startDate: now,
            onChange: noop,
            ...customProps,
        };

        return mount(
            <IntlWrapper>
                <RepeatTypeSelect {...defaultProps} />
            </IntlWrapper>,
        );
    }

    it("should render component", () => {
        const component = renderComponent();
        expect(component).toExist();
    });

    it.each([
        [REPEAT_TYPES.DAILY, titleTypeDaily],
        [REPEAT_TYPES.WEEKLY, titleTypeWeekly],
        [REPEAT_TYPES.MONTHLY, titleTypeMonthly],
        [REPEAT_TYPES.CUSTOM, titleTypeCustom],
    ])("should render correct title for %s", (repeatType: string, expectedTitle: string) => {
        const component = renderComponent({
            repeatType,
        });
        expect(getDropdownTitle(component)).toBe(expectedTitle);
    });

    it("should trigger onChange", () => {
        const onChange = jest.fn();
        const component = renderComponent({ onChange });

        openDropdown(component);
        selectDropdownItem(component, REPEAT_TYPE_INDEX[REPEAT_TYPES.WEEKLY]);

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(REPEAT_TYPES.WEEKLY);
    });
});
