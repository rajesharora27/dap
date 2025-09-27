"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportCsv = exportCsv;
exports.importCsv = importCsv;
// @ts-ignore - types may not be present
const papaparse_1 = __importDefault(require("papaparse"));
function exportCsv(rows) {
    return papaparse_1.default.unparse(rows, {
        quotes: false, // Let Papa Parse handle quotes automatically
        delimiter: ',',
        header: true
    });
}
function importCsv(csv) {
    const parsed = papaparse_1.default.parse(csv, { header: true });
    if (parsed.errors.length)
        throw new Error(parsed.errors.map((e) => e.message).join('; '));
    return parsed.data;
}
