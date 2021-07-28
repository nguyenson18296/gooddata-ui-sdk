// (C) 2007-2021 GoodData Corporation
import React, { useMemo } from "react";
import { FormattedMessage } from "react-intl";
import cx from "classnames";
import partition from "lodash/partition";
import { FilterLabel } from "@gooddata/sdk-ui-kit";

import { IBrokenAlertFilter } from "../../types";
import { getFilterLabelFilter } from "./utils/filterUtils";

const ITEMS_SCROLL_LIMIT = 5;

interface IKpiAlertDialogBrokenFiltersSectionProps {
    filters: IBrokenAlertFilter[];
    type: "deleted" | "ignored";
}

const KpiAlertDialogBrokenFiltersSection: React.FC<IKpiAlertDialogBrokenFiltersSectionProps> = ({
    filters,
    type,
}) => {
    if (!filters.length) {
        return null;
    }

    const contentClassNames = cx("filter-section-content", {
        "more-items": filters.length > ITEMS_SCROLL_LIMIT,
    });

    return (
        <div className="filter-section">
            <div className="filter-section-headline">
                <FormattedMessage
                    id={
                        type === "deleted" ? "kpiAlertDialog.removedFilters" : "kpiAlertDialog.ignoredFilters"
                    }
                />
            </div>
            <div className={contentClassNames}>
                {filters.map((filter) => {
                    const filterProps = getFilterLabelFilter(filter);
                    return (
                        <div className="attribute-filter-label" key={filter.title}>
                            <FilterLabel {...filterProps} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface IKpiAlertDialogBrokenFiltersProps {
    brokenFilters?: IBrokenAlertFilter[];
}

export const KpiAlertDialogBrokenFilters: React.FC<IKpiAlertDialogBrokenFiltersProps> = ({
    brokenFilters,
}) => {
    const [deletedFilters, ignoredFilters] = useMemo(
        () => partition(brokenFilters, (filter) => filter.brokenType === "deleted"),
        [brokenFilters],
    );
    return (
        <>
            <KpiAlertDialogBrokenFiltersSection filters={deletedFilters} type="deleted" />
            <KpiAlertDialogBrokenFiltersSection filters={ignoredFilters} type="ignored" />
        </>
    );
};
