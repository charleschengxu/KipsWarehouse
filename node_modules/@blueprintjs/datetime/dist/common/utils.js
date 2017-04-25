/*
 * Copyright 2015 Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain a copy
 * of the license at https://github.com/palantir/blueprint/blob/master/LICENSE
 * and https://github.com/palantir/blueprint/blob/master/PATENTS
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Measure width of a string displayed with styles provided by `className`.
 * Should only be used if measuring can't be done with existing DOM elements.
 */
function measureTextWidth(text, className, containerElement) {
    if (className === void 0) { className = ""; }
    if (containerElement === void 0) { containerElement = document.body; }
    var span = document.createElement("span");
    span.classList.add(className);
    span.textContent = text;
    containerElement.appendChild(span);
    var spanWidth = span.offsetWidth;
    span.remove();
    return spanWidth + "px";
}
exports.measureTextWidth = measureTextWidth;
function padWithZeroes(str, minLength) {
    if (str.length < minLength) {
        return "" + stringRepeat("0", minLength - str.length) + str;
    }
    else {
        return str;
    }
}
exports.padWithZeroes = padWithZeroes;
function stringRepeat(str, numTimes) {
    return new Array(numTimes + 1).join(str);
}

//# sourceMappingURL=utils.js.map
