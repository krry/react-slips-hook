"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageIndexProvider = exports.SlipProvider = exports.SlipIndexContext = exports.SlipContext = void 0;
const react_1 = __importDefault(require("react"));
exports.SlipContext = react_1.default.createContext({
    slip: [],
    slipStates: {},
    navigateToSlip: () => { },
    highlightSlip: () => { },
});
exports.SlipIndexContext = react_1.default.createContext(0);
exports.SlipProvider = exports.SlipContext.Provider;
exports.PageIndexProvider = exports.SlipIndexContext.Provider;
