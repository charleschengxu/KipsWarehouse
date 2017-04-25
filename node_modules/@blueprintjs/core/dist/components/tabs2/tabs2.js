/*
 * Copyright 2015 Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain a copy
 * of the license at https://github.com/palantir/blueprint/blob/master/LICENSE
 * and https://github.com/palantir/blueprint/blob/master/PATENTS
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var classNames = require("classnames");
var PureRender = require("pure-render-decorator");
var React = require("react");
var abstractComponent_1 = require("../../common/abstractComponent");
var Classes = require("../../common/classes");
var Keys = require("../../common/keys");
var utils_1 = require("../../common/utils");
var tab2_1 = require("./tab2");
var tabTitle_1 = require("./tabTitle");
exports.Expander = function () { return React.createElement("div", { className: "pt-flex-expander" }); };
var TAB_SELECTOR = "." + Classes.TAB;
var Tabs2 = (function (_super) {
    tslib_1.__extends(Tabs2, _super);
    function Tabs2(props) {
        var _this = _super.call(this, props) || this;
        _this.displayName = "Blueprint.Tabs2";
        _this.refHandlers = {
            tablist: function (tabElement) { return _this.tablistElement = tabElement; },
        };
        _this.handleKeyDown = function (e) {
            var focusedElement = document.activeElement.closest(TAB_SELECTOR);
            // rest of this is potentially expensive and futile, so bail if no tab is focused
            if (focusedElement == null) {
                return;
            }
            // must rely on DOM state because we have no way of mapping `focusedElement` to a JSX.Element
            var enabledTabElements = _this.getTabElements()
                .filter(function (el) { return el.getAttribute("aria-disabled") === "false"; });
            var focusedIndex = enabledTabElements.indexOf(focusedElement);
            var direction = _this.getKeyCodeDirection(e);
            if (focusedIndex >= 0 && direction !== undefined) {
                e.preventDefault();
                var length_1 = enabledTabElements.length;
                // auto-wrapping at 0 and `length`
                var nextFocusedIndex = (focusedIndex + direction + length_1) % length_1;
                enabledTabElements[nextFocusedIndex].focus();
            }
        };
        _this.handleKeyPress = function (e) {
            var targetTabElement = e.target.closest(TAB_SELECTOR);
            if (targetTabElement != null && isEventKeyCode(e, Keys.SPACE, Keys.ENTER)) {
                e.preventDefault();
                targetTabElement.click();
            }
        };
        _this.handleTabClick = function (newTabId) {
            var selectedTabId = _this.state.selectedTabId;
            if (newTabId !== selectedTabId) {
                utils_1.safeInvoke(_this.props.onChange, newTabId, selectedTabId);
                if (_this.props.selectedTabId === undefined) {
                    _this.setState({ selectedTabId: newTabId });
                }
            }
        };
        _this.renderTabPanel = function (tab) {
            var _a = tab.props, className = _a.className, panel = _a.panel, id = _a.id;
            if (panel === undefined) {
                return undefined;
            }
            return (React.createElement("div", { "aria-labelledby": tabTitle_1.generateTabTitleId(_this.props.id, id), "aria-hidden": id !== _this.state.selectedTabId, className: classNames(Classes.TAB_PANEL, className), id: tabTitle_1.generateTabPanelId(_this.props.id, id), key: id, role: "tabpanel" }, panel));
        };
        _this.renderTabTitle = function (tab) {
            var id = tab.props.id;
            return (React.createElement(tabTitle_1.TabTitle, tslib_1.__assign({}, tab.props, { parentId: _this.props.id, onClick: _this.handleTabClick, selected: id === _this.state.selectedTabId })));
        };
        var selectedTabId = _this.getInitialSelectedTabId();
        _this.state = { selectedTabId: selectedTabId };
        return _this;
    }
    Tabs2.prototype.render = function () {
        var _this = this;
        var _a = this.state, indicatorWrapperStyle = _a.indicatorWrapperStyle, selectedTabId = _a.selectedTabId;
        var tabTitles = React.Children.map(this.props.children, function (child) { return (isTab(child) ? _this.renderTabTitle(child) : child); });
        var tabPanels = this.getTabChildren()
            .filter(this.props.renderActiveTabPanelOnly ? function (tab) { return tab.props.id === selectedTabId; } : function () { return true; })
            .map(this.renderTabPanel);
        var tabIndicator = (React.createElement("div", { className: "pt-tab-indicator-wrapper", style: indicatorWrapperStyle },
            React.createElement("div", { className: "pt-tab-indicator" })));
        var classes = classNames(Classes.TABS, (_b = {}, _b[Classes.VERTICAL] = this.props.vertical, _b), this.props.className);
        return (React.createElement("div", { className: classes },
            React.createElement("div", { className: Classes.TAB_LIST, onKeyDown: this.handleKeyDown, onKeyPress: this.handleKeyPress, ref: this.refHandlers.tablist, role: "tablist" },
                this.props.animate ? tabIndicator : undefined,
                tabTitles),
            tabPanels));
        var _b;
    };
    Tabs2.prototype.componentDidMount = function () {
        this.moveSelectionIndicator();
    };
    Tabs2.prototype.componentWillReceiveProps = function (_a) {
        var selectedTabId = _a.selectedTabId;
        if (selectedTabId !== undefined) {
            // keep state in sync with controlled prop, so state is canonical source of truth
            this.setState({ selectedTabId: selectedTabId });
        }
    };
    Tabs2.prototype.componentDidUpdate = function (_prevProps, prevState) {
        if (this.state.selectedTabId !== prevState.selectedTabId) {
            this.moveSelectionIndicator();
        }
    };
    Tabs2.prototype.getInitialSelectedTabId = function () {
        // NOTE: providing an unknown ID will hide the selection
        var _a = this.props, defaultSelectedTabId = _a.defaultSelectedTabId, selectedTabId = _a.selectedTabId;
        if (selectedTabId !== undefined) {
            return selectedTabId;
        }
        else if (defaultSelectedTabId !== undefined) {
            return defaultSelectedTabId;
        }
        else {
            // select first tab in absence of user input
            var tabs = this.getTabChildren();
            return tabs.length === 0 ? undefined : tabs[0].props.id;
        }
    };
    Tabs2.prototype.getKeyCodeDirection = function (e) {
        if (isEventKeyCode(e, Keys.ARROW_LEFT, Keys.ARROW_UP)) {
            return -1;
        }
        else if (isEventKeyCode(e, Keys.ARROW_RIGHT, Keys.ARROW_DOWN)) {
            return 1;
        }
        return undefined;
    };
    /** Filters this.props.children to only `<Tab>`s */
    Tabs2.prototype.getTabChildren = function () {
        return React.Children.toArray(this.props.children).filter(isTab);
    };
    /** Queries root HTML element for all `.pt-tab`s with optional filter selector */
    Tabs2.prototype.getTabElements = function (subselector) {
        if (subselector === void 0) { subselector = ""; }
        if (this.tablistElement == null) {
            return [];
        }
        return this.tablistElement.queryAll(TAB_SELECTOR + subselector);
    };
    /**
     * Calculate the new height, width, and position of the tab indicator.
     * Store the CSS values so the transition animation can start.
     */
    Tabs2.prototype.moveSelectionIndicator = function () {
        if (this.tablistElement === undefined) {
            return;
        }
        var tabIdSelector = TAB_SELECTOR + "[data-tab-id=\"" + this.state.selectedTabId + "\"]";
        var selectedTabElement = this.tablistElement.query(tabIdSelector);
        var indicatorWrapperStyle = { display: "none" };
        if (selectedTabElement != null) {
            var clientHeight = selectedTabElement.clientHeight, clientWidth = selectedTabElement.clientWidth, offsetLeft = selectedTabElement.offsetLeft, offsetTop = selectedTabElement.offsetTop;
            indicatorWrapperStyle = {
                height: clientHeight,
                transform: "translateX(" + Math.floor(offsetLeft) + "px) translateY(" + Math.floor(offsetTop) + "px)",
                width: clientWidth,
            };
        }
        this.setState({ indicatorWrapperStyle: indicatorWrapperStyle });
    };
    return Tabs2;
}(abstractComponent_1.AbstractComponent));
/** Insert a `Tabs2.Expander` between any two children to right-align all subsequent children. */
Tabs2.Expander = exports.Expander;
Tabs2.Tab = tab2_1.Tab2;
Tabs2.defaultProps = {
    animate: true,
    renderActiveTabPanelOnly: false,
    vertical: false,
};
Tabs2 = tslib_1.__decorate([
    PureRender
], Tabs2);
exports.Tabs2 = Tabs2;
exports.Tabs2Factory = React.createFactory(Tabs2);
function isEventKeyCode(e) {
    var codes = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        codes[_i - 1] = arguments[_i];
    }
    return codes.indexOf(e.which) >= 0;
}
function isTab(child) {
    return child != null && child.type === tab2_1.Tab2;
}

//# sourceMappingURL=tabs2.js.map
