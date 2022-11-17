import BigNumber from "bignumber.js";

// Collateral
export const COLLATERAL = "0x63618c1ab39a848a789b88599f88186a11f785a2"; // TODO

// System
export const PERCENT_BASE = new BigNumber(1).shiftedBy(18);
export const PRECISION = new BigNumber(1).shiftedBy(18);

const PROTOCOL_FEE_BPS = 5; // 0.05%
const LIQUIDATION_FEE_BPS = 50; // 0.5%
const CVA_BPS = 200; // 2%

export const PROTOCOL_FEE_MULTIPLIER = PROTOCOL_FEE_BPS / 10000;
export const LIQUIDATION_FEE_MULTIPLIER = LIQUIDATION_FEE_BPS / 10000;
export const CVA_MULTIPLIER = CVA_BPS / 10000;
export const TOTAL_FEE_RESERVED = PROTOCOL_FEE_MULTIPLIER + LIQUIDATION_FEE_MULTIPLIER + CVA_MULTIPLIER;

export const REQUEST_TIMEOUT_SEC = 120; // 2 minutes
export const MAX_OPEN_POSITIONS_CROSS = 10;
