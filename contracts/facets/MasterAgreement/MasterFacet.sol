// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.16;

import { AppStorage, RequestForQuote, Position } from "../../libraries/LibAppStorage.sol";
import { Decimal } from "../../libraries/LibDecimal.sol";
import { LibMaster } from "../../libraries/LibMaster.sol";
import { MarketPrice } from "../../interfaces/IOracle.sol";
import "../../libraries/LibEnums.sol";

contract MasterFacet {
    AppStorage internal s;

    function getRequestForQuotes(address party) external view returns (RequestForQuote[] memory rfqs) {
        uint256 len = s.ma._requestForQuotesLength[party];
        rfqs = new RequestForQuote[](len);

        for (uint256 i = 0; i < len; i++) {
            rfqs[i] = (s.ma._requestForQuoteMap[party][i]);
        }
    }

    function getRequestForQuote(address party, uint256 rfqId) external view returns (RequestForQuote memory) {
        return s.ma._requestForQuoteMap[party][rfqId];
    }

    function getOpenPositions(address partyA) external view returns (Position[] memory) {
        return LibMaster.getOpenPositions(partyA);
    }

    function calculateLockedMargin(
        uint256 notionalUsd,
        uint8 marginRequiredPercentage,
        bool isHedger
    ) external pure returns (uint256) {
        return LibMaster.calculateLockedMargin(notionalUsd, marginRequiredPercentage, isHedger);
    }

    function calculateUPnLCross(MarketPrice[] memory marketPrices, address party)
        external
        view
        returns (int256 uPnLCross, int256 notionalCross)
    {
        return LibMaster.calculateUPnLCross(marketPrices, party);
    }

    function calculateUPnLIsolated(
        Side side,
        uint256 currentBalanceUnits,
        uint256 initialNotionalUsd,
        uint256 bidPrice,
        uint256 askPrice
    ) external pure returns (int256 uPnL, int256 notionalIsolated) {
        return LibMaster.calculateUPnLIsolated(side, currentBalanceUnits, initialNotionalUsd, bidPrice, askPrice);
    }

    function calculateCrossMarginHealth(uint256 lockedMargin, int256 uPnLCross)
        external
        pure
        returns (Decimal.D256 memory ratio)
    {
        return LibMaster.calculateCrossMarginHealth(lockedMargin, uPnLCross);
    }

    function solvencySafeguardToTrade(
        uint256 lockedMargin,
        int256 uPnLCross,
        bool isHedger
    ) external pure returns (bool) {
        return LibMaster.solvencySafeguardToTrade(lockedMargin, uPnLCross, isHedger);
    }
}
