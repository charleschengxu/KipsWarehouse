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
var Classes = require("../../common/classes");
var errors_1 = require("../../common/errors");
var position_1 = require("../../common/position");
var utils_1 = require("../../common/utils");
var popover_1 = require("../popover/popover");
var Tooltip = (function (_super) {
    tslib_1.__extends(Tooltip, _super);
    function Tooltip() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.displayName = "Blueprint.Tooltip";
        return _this;
    }
    Tooltip.prototype.render = function () {
        var _a = this.props, content = _a.content, children = _a.children, intent = _a.intent, openOnTargetFocus = _a.openOnTargetFocus, tooltipClassName = _a.tooltipClassName;
        var classes = classNames(Classes.TOOLTIP, Classes.intentClass(intent), tooltipClassName);
        var isEmpty = content == null || (typeof content === "string" && content.trim() === "");
        if (isEmpty && !utils_1.isNodeEnv("production")) {
            console.warn(errors_1.TOOLTIP_EMPTY_WARNING);
        }
        return (React.createElement(popover_1.Popover, tslib_1.__assign({}, this.props, { arrowSize: 22, autoFocus: false, canEscapeKeyClose: false, isDisabled: this.props.isDisabled || isEmpty, enforceFocus: false, interactionKind: popover_1.PopoverInteractionKind.HOVER_TARGET_ONLY, lazy: true, openOnTargetFocus: openOnTargetFocus, popoverClassName: classes }), children));
    };
    return Tooltip;
}(React.Component));
Tooltip.defaultProps = {
    hoverCloseDelay: 0,
    hoverOpenDelay: 100,
    isDisabled: false,
    openOnTargetFocus: true,
    position: position_1.Position.TOP,
    rootElementTag: "span",
    transitionDuration: 100,
    useSmartArrowPositioning: true,
    useSmartPositioning: false,
};
Tooltip = tslib_1.__decorate([
    PureRender
], Tooltip);
exports.Tooltip = Tooltip;
exports.TooltipFactory = React.createFactory(Tooltip);

//# sourceMappingURL=tooltip.js.map
