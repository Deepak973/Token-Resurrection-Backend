"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchLabel = exports.wait = void 0;
const cheerio_1 = require("cheerio");
const isomorphic_unfetch_1 = __importDefault(require("isomorphic-unfetch"));
const wait = (seconds) => new Promise((resolve) => setTimeout(() => resolve(true), seconds * 1000));
exports.wait = wait;
async function fetchLabel(address, labels) {
    if (labels[address] !== undefined)
        return labels[address];
    const response = await (0, isomorphic_unfetch_1.default)(`https://etherscan.io/address/${address}`);
    await (0, exports.wait)(0.3);
    const body = await response.text();
    const $ = (0, cheerio_1.load)(body);
    const tags = [];
    $('a[href*="/accounts/label"].mb-1.mb-sm-0.u-label.u-label--xs.u-label--info').each((i, node) => {
        const text = $(node).text();
        tags.push(text);
    });
    labels[address] = tags.join(',').trim();
    return labels[address];
}
exports.fetchLabel = fetchLabel;
