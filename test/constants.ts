import { keccak256 } from "@ethersproject/keccak256";
import BigNumber from "bignumber.js";
import { toUtf8Bytes } from "ethers/lib/utils";

export const SIGNER_ROLE = keccak256(toUtf8Bytes("SIGNER_ROLE"));
export const ADMIN_ROLE = keccak256(toUtf8Bytes("ADMIN_ROLE"));

// Collateral
export const COLLATERAL = "0xB62F2fb600D39A44883688DE20A8E058c76Ad558";

// System
export const PERCENT_BASE = new BigNumber(1).shiftedBy(18);
export const PRECISION = new BigNumber(1).shiftedBy(18);

const LIQUIDATION_FEE_BPS = 5; // 0.05%
const CVA_BPS = 100; // 1%

export const LIQUIDATION_FEE_MULTIPLIER = LIQUIDATION_FEE_BPS / 10000;
export const CVA_MULTIPLIER = CVA_BPS / 10000;

export const REQUEST_TIMEOUT_SEC = 120; // 2 minutes
export const MAX_OPEN_POSITIONS_CROSS = 5;
