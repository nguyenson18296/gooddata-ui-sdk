// (C) 2021 GoodData Corporation
import React, { useEffect, useRef, useState } from "react";
import cx from "classnames";
import { injectIntl, WrappedComponentProps } from "react-intl";
import { IAnalyticalBackend, IAttributeElement, IAttributeMetadataObject } from "@gooddata/sdk-backend-spi";
import {
    filterAttributeElements,
    IAttributeFilter,
    isAttributeElementsByRef,
    isNegativeAttributeFilter,
    newNegativeAttributeFilter,
    newPositiveAttributeFilter,
    ObjRef,
} from "@gooddata/sdk-model";
import Dropdown from "@gooddata/goodstrap/lib/Dropdown/Dropdown";
import { AttributeDropdownBody } from "./AttributeDropdown/AttributeDropdownBody";
import debounce from "lodash/debounce";
import isEmpty from "lodash/isEmpty";
import isEqual from "lodash/isEqual";
import { MAX_SELECTION_SIZE } from "./AttributeDropdown/AttributeDropdownList";
import { mergeElementQueryResults } from "./AttributeDropdown/mergeElementQueryResults";
import {
    AttributeFiltersOrPlaceholders,
    IntlWrapper,
    IPlaceholder,
    useCancelablePromise,
    usePlaceholder,
    useResolveValueWithPlaceholders,
    withContexts,
} from "@gooddata/sdk-ui";
import MediaQuery from "react-responsive";
import { MediaQueries } from "../constants";
import {
    attributeElementsToAttributeElementArray,
    getAllTitleIntl,
    getElements,
    getElementTotalCount,
    getFilteringTitleIntl,
    getItemsTitles,
    getLoadingTitleIntl,
    getNoneTitleIntl,
    getObjRef,
    getParentFilterTitles,
    getValidElementsFilters,
    ILoadElementsResult,
    isParentFilteringEnabled,
    isParentFiltersElementsByRef,
    showAllFilteredMessage,
    updateSelectedOptionsWithData,
} from "./utils/AttributeFilterUtils";
import { stringUtils } from "@gooddata/util";
import invariant from "ts-invariant";
import stringify from "json-stable-stringify";
import { IElementQueryResultWithEmptyItems } from "./AttributeDropdown/types";
import { AttributeDropdownAllFilteredOutBody } from "./AttributeDropdown/AttributeDropdownAllFilteredOutBody";

/**
 * @public
 */
export interface IAttributeFilterButtonOwnProps {
    /**
     * Optionally specify an instance of analytical backend instance to work with.
     *
     * Note: if you do not have a BackendProvider above in the component tree, then you MUST specify the backend.
     */
    backend?: IAnalyticalBackend;

    /**
     * Optionally specify workspace to work with.
     *
     * Note: if you do not have a WorkspaceProvider above in the component tree, then you MUST specify the workspace.
     */
    workspace?: string;

    /**
     * Specify an attribute filter that will be customized using this filter. The component will use content of the
     * filter and select the items that are already specified on the filter.
     *
     * Note: It's not possible to combine this property with "connectToPlaceholder" property. Either - provide a value, or a placeholder.
     * The 'onApply' callback must be specified in order to handle filter changes.
     */
    filter?: IAttributeFilter;

    /**
     * Specifies a parent attribute filter that will be used to reduce options for for current attribute filter.
     *
     * Parent filters elements must contain their URIs due to current backend limitations.
     */
    parentFilters?: AttributeFiltersOrPlaceholders;

    /**
     * Specify {@link @gooddata/sdk-ui#IPlaceholder} to use to get and set the value of the attribute filter.
     *
     * Note: It's not possible to combine this property with "filter" property. Either - provide a value, or a placeholder.
     * There is no need to specify 'onApply' callback if 'connectToPlaceholder' property is used as the value of the filter
     * is set via this placeholder.
     */
    connectToPlaceholder?: IPlaceholder<IAttributeFilter>;

    /**
     * Specify and parent filter attribute ref over which should be available options reduced.
     */
    parentFilterOverAttribute?: ObjRef;

    /**
     * Specify identifier of attribute, for which you want to construct the filter.
     *
     * Note: this is optional and deprecated. If you do not specify this, then you MUST specify the 'filter' prop or 'connectToPlaceholder' prop.
     *
     * @deprecated - use the filter prop instead
     */
    identifier?: string;

    /**
     * Optionally specify title for the attribute filter. By default, the attribute name will be used.
     */
    title?: string;

    /**
     * Locale to use for localization of appearing texts.
     */
    locale?: string;
    /**
     * Specify function which will be called when user clicks 'Apply' button. The function will receive the current
     * specification of the filter, as it was updated by the user.
     *
     * @param filter - new value of the filter.
     */
    onApply?: (filter: IAttributeFilter, isInverted: boolean) => void;

    /**
     * Optionally customize attribute filter with a callback function to trigger when an error occurs while
     * loading attribute elements.
     */
    onError?: (error: any) => void;

    /**
     * Optionally customize attribute filter with a component to be rendered if attribute elements loading fails
     */
    FilterError?: React.ComponentType<{ error?: any }>;
}

interface IAttributeFilterButtonState {
    selectedFilterOptions: IAttributeElement[];
    isInverted: boolean;
    prevSelectedFilterOptions: IAttributeElement[];
    prevIsInverted: boolean;
    firstLoad: boolean;
    searchString: string;
    offset: number;
    limit: number;
    isDropdownOpen: boolean;
    prevValidOptions: IElementQueryResultWithEmptyItems;
    isAllFiltered: boolean;
}

/**
 * @public
 */
export type IAttributeFilterButtonProps = IAttributeFilterButtonOwnProps & WrappedComponentProps;

const DefaultFilterError: React.FC = injectIntl(({ intl }) => {
    const text = intl.formatMessage({ id: "gs.filter.error" });
    return <div className="gd-message error s-button-error">{text}</div>;
});

const DropdownButton: React.FC<{
    isMobile?: boolean;
    isOpen?: boolean;
    title: string;
    subtitleText: string;
    subtitleItemCount: number;
}> = ({ isMobile, isOpen, title, subtitleItemCount, subtitleText }) => {
    const subtitleSelectedItemsRef = useRef(null);
    const [displayItemCount, setDisplayItemCount] = useState(false);

    useEffect(() => {
        const element = subtitleSelectedItemsRef.current;

        if (!element) {
            return;
        }

        const roundedWidth = Math.ceil(element.getBoundingClientRect().width);
        const displayItemCount = roundedWidth < element.scrollWidth;

        setDisplayItemCount(displayItemCount);
    }, [subtitleText, subtitleItemCount]);

    return (
        <div
            className={cx("gd-attribute-filter-button", "s-attribute-filter-button", {
                "is-active": isOpen,
                "gd-attribute-filter-button-mobile": isMobile,
            })}
        >
            <div className="button-content">
                <div className="button-title">{title}</div>
                <div className="button-subtitle">
                    <span className="button-selected-items" ref={subtitleSelectedItemsRef}>
                        {subtitleText}
                    </span>
                    {displayItemCount && (
                        <span className="button-selected-items-count">{`(${subtitleItemCount})`}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

const LIMIT = MAX_SELECTION_SIZE + 50;

export const AttributeFilterButtonCore: React.FC<IAttributeFilterButtonProps> = (props) => {
    invariant(
        !(props.filter && props.connectToPlaceholder),
        "It's not possible to combine 'filter' property with 'connectToPlaceholder' property. Either provide a value, or a placeholder.",
    );

    invariant(
        !(props.filter && !props.onApply),
        "It's not possible to use 'filter' property without 'onApply' property. Either provide 'onApply' callback or use placeholders.",
    );

    const [resolvedPlaceholder, setPlaceholderValue] = usePlaceholder(props.connectToPlaceholder);

    const currentFilter = resolvedPlaceholder || props.filter;

    const getInitialSelectedOptions = (): IAttributeElement[] =>
        // the as any cast is ok here, the data will get fixed once the element load completes
        // this serves only to have some initial state here so that when full element data is loaded
        // it automatically sets the props.filter.elements as selected
        currentFilter
            ? (attributeElementsToAttributeElementArray(filterAttributeElements(currentFilter)) as any)
            : [];

    const getInitialIsInverted = (): boolean =>
        currentFilter ? isNegativeAttributeFilter(currentFilter) : true;

    const [state, setState] = useState<IAttributeFilterButtonState>(() => {
        const initialSelection = getInitialSelectedOptions();
        const initialIsInverted = getInitialIsInverted();

        return {
            selectedFilterOptions: initialSelection,
            isInverted: initialIsInverted,
            prevSelectedFilterOptions: initialSelection,
            prevIsInverted: initialIsInverted,
            firstLoad: true,
            searchString: "",
            offset: 0,
            limit: LIMIT,
            isDropdownOpen: false,
            prevValidOptions: null,
            isAllFiltered: false,
        };
    });

    const dropdownRef = useRef<Dropdown>(null);
    const resolvedParentFilters = useResolveValueWithPlaceholders(props.parentFilters);

    const {
        result: elementsResult,
        error: elementsError,
        status: elementsStatus,
    } = useCancelablePromise<ILoadElementsResult>(
        {
            promise: async (): Promise<ILoadElementsResult> => {
                return getElements(state.prevValidOptions, state.offset, state.limit, loadElements, false);
            },
        },
        [state.prevValidOptions],
    );

    const {
        error: totalCountError,
        result: totalCount,
        status: totalCountStatus,
    } = useCancelablePromise<number>(
        {
            promise: async () => {
                return getElementTotalCount(
                    props.workspace,
                    props.backend,
                    getObjRef(currentFilter, props.identifier),
                    state.searchString,
                    getValidElementsFilters(resolvedParentFilters, props.parentFilterOverAttribute),
                );
            },
        },
        [props.backend, props.workspace, props.identifier, stringify(resolvedParentFilters)],
    );

    const {
        error: parentFilterTitlesError,
        result: parentFilterTitles,
        status: parentFilterTitlesStatus,
    } = useCancelablePromise<string[]>(
        {
            promise: async () => getParentFilterTitles(resolvedParentFilters, getBackend(), props.workspace),
        },
        [props.backend, props.workspace, stringify(resolvedParentFilters)],
    );

    useEffect(() => {
        const isAllFiltered = showAllFilteredMessage(
            isElementsLoading(),
            resolvedParentFilters,
            elementsResult?.validOptions.items,
        );
        if (state.isAllFiltered !== isAllFiltered) {
            setState((prevState) => {
                return {
                    ...prevState,
                    isAllFiltered,
                };
            });
        }
    }, [elementsStatus, stringify(resolvedParentFilters), elementsResult]);

    const invalidate = (parentFilterChanged = false) => {
        const nullStateValues = {
            prevValidOptions: null as IElementQueryResultWithEmptyItems,
            offset: 0,
            limit: LIMIT,
        };

        if (parentFilterChanged) {
            const emptyFilter = createFilter(currentFilter, true);
            if (props.connectToPlaceholder) {
                setPlaceholderValue(emptyFilter);
            }
            props.onApply && props.onApply(emptyFilter, isNegativeAttributeFilter(currentFilter));
            setState((state) => {
                return {
                    ...state,
                    ...nullStateValues,
                    selectedFilterOptions: [],
                };
            });
        } else {
            setState((state) => {
                return {
                    ...state,
                    ...nullStateValues,
                };
            });
        }
    };

    useEffect(() => {
        if (!state.firstLoad && elementsStatus !== "pending" && elementsStatus !== "loading") {
            invalidate(true);
            setState((state) => {
                return {
                    ...state,
                    selectedFilterOptions: [],
                    prevSelectedFilterOptions: [],
                    isInverted: true,
                    prevIsInverted: true,
                };
            });
        }
    }, [stringify(resolvedParentFilters)]);

    useEffect(() => {
        invalidate();
    }, [props.workspace, props.backend, state.searchString]);

    const {
        error: attributeError,
        result: attribute,
        status: attributeStatus,
    } = useCancelablePromise<IAttributeMetadataObject>(
        {
            promise: async () => {
                const attributes = getBackend().workspace(props.workspace).attributes();
                const displayForm = await attributes.getAttributeDisplayForm(
                    getObjRef(currentFilter, props.identifier),
                );
                const attribute = await attributes.getAttribute(displayForm.attribute);

                return attribute;
            },
        },
        [currentFilter],
    );

    useEffect(() => {
        if (props.onError && (attributeError || elementsError)) {
            props.onError(attributeError || elementsError);
        }
    }, [attributeError, elementsError]);

    const prepareElementsQuery = (offset: number, limit: number) => {
        const { workspace } = props;
        const preparedElementQuery = getBackend()
            .workspace(workspace)
            .attributes()
            .elements()
            .forDisplayForm(getObjRef(currentFilter, props.identifier))
            .withOptions({
                ...(!isEmpty(state.searchString) ? { filter: state.searchString } : {}),
            })
            .withOffset(offset)
            .withLimit(limit);

        if (isParentFilteringEnabled(getBackend())) {
            if (resolvedParentFilters && !isParentFiltersElementsByRef(resolvedParentFilters)) {
                // eslint-disable-next-line no-console
                console.error(
                    "Parent filters must be defined by uris to enable parent-child filtering feature",
                );
            } else {
                preparedElementQuery.withAttributeFilters(
                    getValidElementsFilters(resolvedParentFilters, props.parentFilterOverAttribute),
                );
            }
        }

        return preparedElementQuery;
    };

    const loadElements = async (offset: number, limit: number): Promise<ILoadElementsResult> => {
        const preparedElementQuery = prepareElementsQuery(offset, limit);

        const newElements = await preparedElementQuery.query();

        const mergedValidElements = mergeElementQueryResults(
            elementsResult?.validOptions || null,
            newElements,
        );
        const { items } = mergedValidElements;

        // make sure that selected items have both title and uri, otherwise selection in InvertableList won't work
        // TODO we could maybe use the InvertableList's getItemKey and just use title or uri for example
        const updatedSelectedItems = updateSelectedOptionsWithData(state.selectedFilterOptions, items);
        const updatedPrevSelectedItems = updateSelectedOptionsWithData(
            state.prevSelectedFilterOptions,
            items,
        );

        const validOptions = state.searchString || resolvedParentFilters ? newElements : mergedValidElements;
        setState({
            ...state,
            selectedFilterOptions: updatedSelectedItems,
            prevSelectedFilterOptions: updatedPrevSelectedItems,
            prevValidOptions: validOptions,
            firstLoad: false,
        });

        return {
            validOptions: validOptions,
            totalCount: state.firstLoad ? items.length : totalCount || LIMIT,
        };
    };

    /**
     * getters
     */
    const getBackend = () => {
        return props.backend.withTelemetry("AttributeFilter", props);
    };

    const isElementsLoading = () => {
        return elementsStatus === "pending" || elementsStatus === "loading";
    };

    const isTotalCountLoading = () => {
        return totalCountStatus === "pending" || totalCountStatus === "loading";
    };

    const isParentFilterTitlesLoading = () => {
        return parentFilterTitlesStatus === "pending" || parentFilterTitlesStatus === "loading";
    };

    const getSubtitle = () => {
        if (isElementsLoading() && !state.firstLoad && props.parentFilters) {
            return getFilteringTitleIntl(props.intl);
        }

        if (isTotalCountLoading() && state.firstLoad) {
            return getLoadingTitleIntl(props.intl);
        }

        if (state.isAllFiltered) {
            return getAllTitleIntl(props.intl, true, true, true);
        }

        const displayForm = getObjRef(currentFilter, props.identifier);
        if (elementsResult && totalCount && displayForm) {
            const empty = isEmpty(state.selectedFilterOptions);
            const equal = isEqual(totalCount, state.selectedFilterOptions?.length);
            const getAllPartIntl = getAllTitleIntl(props.intl, state.isInverted, empty, equal);

            if (!elementsResult.totalCount && state.searchString) {
                return getNoneTitleIntl(props.intl);
            }

            if (empty) {
                return !state.isInverted ? `${getNoneTitleIntl(props.intl)}` : `${getAllPartIntl}`;
            }

            if (equal) {
                return state.isInverted ? "" : `${getAllPartIntl}`;
            }

            const fullTitle = state.isInverted
                ? `${getAllPartIntl} ${getItemsTitles(state.selectedFilterOptions)}`
                : `${getItemsTitles(state.selectedFilterOptions)}`;

            return `${stringUtils.shortenText(fullTitle, { maxLength: 35 })}`;
        }
        return "";
    };

    /**
     * callbacks
     */
    const onSearch = debounce((query: string) => {
        setState({
            ...state,
            searchString: query,
        });
    }, 250);

    const createFilter = (filter: IAttributeFilter, emptyFilter = false) => {
        const useUriElements = filter && isAttributeElementsByRef(filterAttributeElements(filter));

        const filterFactory = state.isInverted ? newNegativeAttributeFilter : newPositiveAttributeFilter;
        const items = emptyFilter ? [] : state.selectedFilterOptions;

        return filterFactory(
            getObjRef(filter, props.identifier),
            useUriElements
                ? { uris: items.map((item) => item.uri) }
                : { values: items.map((item) => item.title) },
        );
    };

    const onApply = () => {
        const filter = createFilter(currentFilter);

        if (props.connectToPlaceholder) {
            setPlaceholderValue(filter);
        }

        closeDropdown();

        return props.onApply?.(filter, state.isInverted);
    };

    const onSelect = (selectedFilterOptions: IAttributeElement[], isInverted: boolean) => {
        setState({
            ...state,
            selectedFilterOptions: selectedFilterOptions,
            isInverted: isInverted,
        });
    };

    const onRangeChange = (_searchString: string, from: number, to: number) => {
        setState({
            ...state,
            offset: from,
            limit: to - from,
        });
    };

    const onCloseButtonClicked = () => {
        closeDropdown();
    };

    const onApplyButtonClicked = () => {
        onApply();
        backupSelection();
    };

    /**
     * utilities
     */
    const closeDropdown = () => {
        if (dropdownRef.current) {
            dropdownRef.current.closeDropdown();
        }
    };

    const backupSelection = () => {
        setState({
            ...state,
            prevSelectedFilterOptions: state.selectedFilterOptions,
            prevIsInverted: state.isInverted,
        });
    };

    const onDropdownClosed = () => {
        setState({
            ...state,
            selectedFilterOptions: state.prevSelectedFilterOptions,
            isInverted: state.prevIsInverted,
            searchString: "",
            isDropdownOpen: false,
        });
    };

    const onDropdownOpen = () => {
        setState({
            ...state,
            isDropdownOpen: true,
        });
    };

    const onDropdownOpenStateChanged = (isOpen: boolean) => {
        isOpen ? onDropdownOpen() : onDropdownClosed();
    };

    const renderAttributeDropdown = () => {
        return (
            <Dropdown
                closeOnParentScroll={true}
                closeOnMouseDrag={true}
                closeOnOutsideClick={true}
                enableEventPropagation={true}
                alignPoints={[
                    { align: "bl tl" },
                    { align: "tr tl" },
                    { align: "br tr", offset: { x: -11 } },
                    { align: "tr tl", offset: { x: 0, y: -100 } },
                    { align: "tr tl", offset: { x: 0, y: -50 } },
                ]}
                button={
                    <MediaQuery query={MediaQueries.IS_MOBILE_DEVICE}>
                        {(isMobile) => (
                            <DropdownButton
                                isOpen={state.isDropdownOpen}
                                isMobile={isMobile}
                                title={
                                    attributeStatus === "pending" || attributeStatus === "loading"
                                        ? getLoadingTitleIntl(props.intl)
                                        : props.title || attribute.title
                                }
                                subtitleText={getSubtitle()}
                                subtitleItemCount={state.selectedFilterOptions.length}
                            />
                        )}
                    </MediaQuery>
                }
                body={
                    state.isAllFiltered ? (
                        <MediaQuery query={MediaQueries.IS_MOBILE_DEVICE}>
                            {(isMobile) => (
                                <AttributeDropdownAllFilteredOutBody
                                    parentFilterTitles={parentFilterTitles}
                                    onApplyButtonClick={onApplyButtonClicked}
                                    onCancelButtonClick={onCloseButtonClicked}
                                    isMobile={isMobile}
                                />
                            )}
                        </MediaQuery>
                    ) : (
                        <AttributeDropdownBody
                            items={elementsResult?.validOptions?.items ?? []}
                            totalCount={totalCount || LIMIT}
                            selectedItems={state.selectedFilterOptions}
                            isInverted={state.isInverted}
                            isLoading={
                                isElementsLoading() || isTotalCountLoading() || isParentFilterTitlesLoading()
                            }
                            searchString={state.searchString}
                            onSearch={onSearch}
                            onSelect={onSelect}
                            onRangeChange={onRangeChange}
                            onApplyButtonClicked={onApplyButtonClicked}
                            onCloseButtonClicked={onCloseButtonClicked}
                            applyDisabled={isEmpty(state.selectedFilterOptions) && !state.isInverted}
                        />
                    )
                }
                ref={dropdownRef}
                onOpenStateChanged={onDropdownOpenStateChanged}
            />
        );
    };

    const { FilterError } = props;

    return elementsError || attributeError || totalCountError || parentFilterTitlesError ? (
        <FilterError
            error={
                elementsError?.message ??
                attributeError?.message ??
                totalCountError?.message ??
                parentFilterTitlesError?.message ??
                "Unknown error"
            }
        />
    ) : (
        renderAttributeDropdown()
    );
};

AttributeFilterButtonCore.defaultProps = {
    FilterError: DefaultFilterError,
};

const IntlAttributeFilterButton = withContexts(injectIntl(AttributeFilterButtonCore));

/**
 * @public
 */
export const AttributeFilterButton: React.FC<IAttributeFilterButtonOwnProps> = (props) => {
    return (
        <IntlWrapper locale={props.locale}>
            <IntlAttributeFilterButton {...props} />
        </IntlWrapper>
    );
};
