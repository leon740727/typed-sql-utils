"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertPartialRequired = exports.assert = void 0;
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
exports.assert = assert;
function assertPartialRequired(obj, fields) {
    const errors = fields.filter(f => obj[f] === undefined);
    if (errors.length > 0) {
        throw new Error(`${errors[0]} is undefined`);
    }
    else {
        return obj;
    }
}
exports.assertPartialRequired = assertPartialRequired;
