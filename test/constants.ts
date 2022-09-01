import BigNumber from "bignumber.js";

// Collateral
export const COLLATERAL = "0x63618c1ab39a848a789b88599f88186a11f785a2"; // TODO

// System
export const PERCENT_BASE = new BigNumber(1).shiftedBy(18);
export const PRECISION = new BigNumber(1).shiftedBy(18);

// Oracle
export const MUON = "0xe4f8d9a30936a6f8b17a73dc6feb51a3bbabd51a";
export const MUON_APP_ID = 0;
export const MIN_REQUIRED_SIGNATURES = 0;

// Configuration
export const MARGIN_OVERHEAD = 0.5; // 50%
export const LIQUIDATION_FEE = 0.1; // 10%

export const MAX_LEVERAGE = 1000;

export const SOLVENCY_THRESHOLD_TRADE_USER = 0.3; // 30%
export const SOLVENCY_THRESHOLD_TRADE_HEDGER = 0; // 0%

export const SOLVENCY_THRESHOLD_REMOVE_USER = 1; // 100%
export const SOLVENCY_THRESHOLD_REMOVE_HEDGER = 0.5; // 50%

export const REQUEST_TIMEOUT = 60; // 1 minute
