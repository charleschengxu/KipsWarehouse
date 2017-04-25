/*
 * Copyright 2016 Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain a copy
 * of the license at https://github.com/palantir/blueprint/blob/master/LICENSE
 * and https://github.com/palantir/blueprint/blob/master/PATENTS
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dateUtils_1 = require("./dateUtils");
var MonthAndYear = (function () {
    function MonthAndYear(month, year) {
        if (month !== null && year !== null) {
            this.date = new Date(year, month);
        }
        else {
            this.date = new Date();
        }
    }
    MonthAndYear.prototype.clone = function () {
        return new MonthAndYear(this.getMonth(), this.getYear());
    };
    MonthAndYear.prototype.getFullDate = function () {
        return this.date;
    };
    MonthAndYear.prototype.getMonth = function () {
        return this.date.getMonth();
    };
    MonthAndYear.prototype.getYear = function () {
        return this.date.getFullYear();
    };
    MonthAndYear.prototype.getPreviousMonth = function () {
        var previousMonthDate = dateUtils_1.getDatePreviousMonth(this.date);
        return new MonthAndYear(previousMonthDate.getMonth(), previousMonthDate.getFullYear());
    };
    MonthAndYear.prototype.getNextMonth = function () {
        var nextMonthDate = dateUtils_1.getDateNextMonth(this.date);
        return new MonthAndYear(nextMonthDate.getMonth(), nextMonthDate.getFullYear());
    };
    MonthAndYear.prototype.isBefore = function (monthAndYear) {
        return compareMonthAndYear(this, monthAndYear) < 0;
    };
    MonthAndYear.prototype.isAfter = function (monthAndYear) {
        return compareMonthAndYear(this, monthAndYear) > 0;
    };
    MonthAndYear.prototype.isSame = function (monthAndYear) {
        return compareMonthAndYear(this, monthAndYear) === 0;
    };
    return MonthAndYear;
}());
exports.MonthAndYear = MonthAndYear;
// returns negative if left < right
// returns positive if left > right
// returns 0 if left === right
function compareMonthAndYear(firstMonthAndYear, secondMonthAndYear) {
    var firstMonth = firstMonthAndYear.getMonth();
    var firstYear = firstMonthAndYear.getYear();
    var secondMonth = secondMonthAndYear.getMonth();
    var secondYear = secondMonthAndYear.getYear();
    if (firstYear === secondYear) {
        return firstMonth - secondMonth;
    }
    else {
        return firstYear - secondYear;
    }
}

//# sourceMappingURL=monthAndYear.js.map
