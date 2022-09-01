// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.16;

import { Decimal } from "./libraries/LibDecimal.sol";

library C {
    using Decimal for Decimal.D256;

    // Collateral
    address private constant COLLATERAL = 0x63618c1aB39a848a789b88599f88186A11F785A2; // TODO

    // System
    uint256 private constant PERCENT_BASE = 1e18;
    uint256 private constant PRECISION = 1e18;

    // Oracle
    address private constant MUON = 0xE4F8d9A30936a6F8b17a73dC6fEb51a3BBABD51A;
    uint16 private constant MUON_APP_ID = 0; // TODO
    uint8 private constant MIN_REQUIRED_SIGNATURES = 0; // TODO

    // Configuration
    uint256 private constant MARGIN_OVERHEAD = 0.5e18; // 50%
    uint256 private constant LIQUIDATION_FEE = 0.1e18; // 10%

    uint16 private constant MAX_LEVERAGE = 1000;

    uint256 private constant SOLVENCY_THRESHOLD_TRADE_USER = 0.3e18; // 30%
    uint256 private constant SOLVENCY_THRESHOLD_TRADE_HEDGER = 0; // 0%

    uint256 private constant SOLVENCY_THRESHOLD_REMOVE_USER = 1e18; // 30%
    uint256 private constant SOLVENCY_THRESHOLD_REMOVE_HEDGER = 0.5e18; // 0%

    uint256 private constant REQUEST_TIMEOUT = 1 minutes;

    function getCollateral() internal pure returns (address) {
        return COLLATERAL;
    }

    function getPrecision() internal pure returns (uint256) {
        return PRECISION;
    }

    function getMuon() internal pure returns (address) {
        return MUON;
    }

    function getMuonAppId() internal pure returns (uint16) {
        return MUON_APP_ID;
    }

    function getMinimumRequiredSignatures() internal pure returns (uint8) {
        return MIN_REQUIRED_SIGNATURES;
    }

    function getMaxLeverage() internal pure returns (uint16) {
        return MAX_LEVERAGE;
    }

    function getMarginOverhead() internal pure returns (Decimal.D256 memory) {
        return Decimal.ratio(MARGIN_OVERHEAD, PERCENT_BASE);
    }

    function getLiquidationFee() internal pure returns (Decimal.D256 memory) {
        return Decimal.ratio(LIQUIDATION_FEE, PERCENT_BASE);
    }

    function getSolvencyThresholdToTrade(bool isHedger) internal pure returns (Decimal.D256 memory) {
        return
            isHedger
                ? Decimal.ratio(SOLVENCY_THRESHOLD_TRADE_HEDGER, PERCENT_BASE)
                : Decimal.ratio(SOLVENCY_THRESHOLD_TRADE_USER, PERCENT_BASE);
    }

    function getSolvencyThresholdToRemoveLockedMargin(bool isHedger) internal pure returns (Decimal.D256 memory) {
        return
            isHedger
                ? Decimal.ratio(SOLVENCY_THRESHOLD_REMOVE_HEDGER, PERCENT_BASE)
                : Decimal.ratio(SOLVENCY_THRESHOLD_REMOVE_USER, PERCENT_BASE);
    }

    function getRequestTimeout() internal pure returns (uint256) {
        return REQUEST_TIMEOUT;
    }

    function getChainId() internal view returns (uint256) {
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }
}
