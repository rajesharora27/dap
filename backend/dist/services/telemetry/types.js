"use strict";
/**
 * Telemetry System Types
 *
 * This module defines all TypeScript interfaces and types used throughout
 * the telemetry system for type safety and documentation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimestampMode = exports.StringMatchMode = exports.NumberOperator = exports.SuccessCriteriaType = exports.TelemetryDataType = void 0;
/**
 * Telemetry data types supported by the system
 */
var TelemetryDataType;
(function (TelemetryDataType) {
    TelemetryDataType["BOOLEAN"] = "boolean";
    TelemetryDataType["NUMBER"] = "number";
    TelemetryDataType["STRING"] = "string";
    TelemetryDataType["TIMESTAMP"] = "timestamp";
})(TelemetryDataType || (exports.TelemetryDataType = TelemetryDataType = {}));
/**
 * Success criteria types for telemetry evaluation
 */
var SuccessCriteriaType;
(function (SuccessCriteriaType) {
    SuccessCriteriaType["BOOLEAN_FLAG"] = "boolean_flag";
    SuccessCriteriaType["NUMBER_THRESHOLD"] = "number_threshold";
    SuccessCriteriaType["STRING_MATCH"] = "string_match";
    SuccessCriteriaType["TIMESTAMP_COMPARISON"] = "timestamp_comparison";
    SuccessCriteriaType["COMPOSITE_AND"] = "composite_and";
    SuccessCriteriaType["COMPOSITE_OR"] = "composite_or";
})(SuccessCriteriaType || (exports.SuccessCriteriaType = SuccessCriteriaType = {}));
/**
 * Number comparison operators
 */
var NumberOperator;
(function (NumberOperator) {
    NumberOperator["GREATER_THAN"] = "greater_than";
    NumberOperator["LESS_THAN"] = "less_than";
    NumberOperator["EQUALS"] = "equals";
    NumberOperator["GREATER_THAN_OR_EQUAL"] = "greater_than_or_equal";
    NumberOperator["LESS_THAN_OR_EQUAL"] = "less_than_or_equal";
})(NumberOperator || (exports.NumberOperator = NumberOperator = {}));
/**
 * String matching modes
 */
var StringMatchMode;
(function (StringMatchMode) {
    StringMatchMode["EXACT"] = "exact";
    StringMatchMode["CONTAINS"] = "contains";
    StringMatchMode["REGEX"] = "regex";
})(StringMatchMode || (exports.StringMatchMode = StringMatchMode = {}));
/**
 * Timestamp comparison modes
 */
var TimestampMode;
(function (TimestampMode) {
    TimestampMode["BEFORE"] = "before";
    TimestampMode["AFTER"] = "after";
    TimestampMode["WITHIN_DAYS"] = "within_days";
})(TimestampMode || (exports.TimestampMode = TimestampMode = {}));
