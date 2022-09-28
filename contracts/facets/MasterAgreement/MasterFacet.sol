// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.16;

import { AppStorage, RequestForQuote, Position } from "../../libraries/LibAppStorage.sol";
import { Decimal } from "../../libraries/LibDecimal.sol";
import { LibMaster } from "../../libraries/LibMaster.sol";
import { PositionPrice } from "../../libraries/LibOracle.sol";
import "../../libraries/LibEnums.sol";

contract MasterFacet {
    AppStorage internal s;

    function getOpenRequestForQuotes(address party) external view returns (RequestForQuote[] memory rfqs) {
        uint256 len = s.ma._openRequestForQuotesList[party].length;
        rfqs = new RequestForQuote[](len);

        for (uint256 i = 0; i < len; i++) {
            rfqs[i] = (s.ma._requestForQuotesMap[s.ma._openRequestForQuotesList[party][i]]);
        }
    }

    function getRequestForQuotes(uint256[] calldata rfqIds) external view returns (RequestForQuote[] memory rfqs) {
        uint256 len = rfqIds.length;
        rfqs = new RequestForQuote[](len);

        for (uint256 i = 0; i < len; i++) {
            rfqs[i] = (s.ma._requestForQuotesMap[rfqIds[i]]);
        }
    }

    function getRequestForQuote(uint256 rfqId) external view returns (RequestForQuote memory) {
        return s.ma._requestForQuotesMap[rfqId];
    }

    function getOpenPositionsIsolated(address party) external view returns (Position[] memory) {
        return LibMaster.getOpenPositionsIsolated(party);
    }

    function getOpenPositionsCross(address party) external view returns (Position[] memory) {
        return LibMaster.getOpenPositionsCross(party);
    }

    function calculateUPnLIsolated(
        uint256 positionId,
        uint256 bidPrice,
        uint256 askPrice
    ) external view returns (int256 uPnLA, int256 uPnLB) {
        return LibMaster.calculateUPnLIsolated(positionId, bidPrice, askPrice);
    }

    function calculateUPnLCross(PositionPrice[] memory positionPrices, address party)
        external
        view
        returns (int256 uPnLCross, int256 notionalCross)
    {
        return LibMaster.calculateUPnLCross(positionPrices, party);
    }

    function calculateProtocolFeeAmount(uint256 notionalUsd) external pure returns (uint256) {
        return LibMaster.calculateProtocolFeeAmount(notionalUsd);
    }

    function calculateLiquidationFeeAmount(uint256 lockedMargin) external pure returns (uint256) {
        return LibMaster.calculateLiquidationFeeAmount(lockedMargin);
    }

    function calculateCVAAmount(uint256 lockedMargin) external pure returns (uint256) {
        return LibMaster.calculateCVAAmount(lockedMargin);
    }

    function calculateCrossMarginHealth(uint256 lockedMargin, int256 uPnL)
        external
        pure
        returns (Decimal.D256 memory ratio)
    {
        return LibMaster.calculateCrossMarginHealth(lockedMargin, uPnL);
    }

    function positionShouldBeLiquidatedIsolated(
        uint256 positionId,
        uint256 bidPrice,
        uint256 askPrice
    )
        external
        view
        returns (
            bool shouldLiquidated,
            int256 pnlA,
            int256 pnlB
        )
    {
        return LibMaster.positionShouldBeLiquidatedIsolated(positionId, bidPrice, askPrice);
    }

    function shouldBeLiquidatedCross(address party, int256 uPnLCross) external view returns (bool) {
        return LibMaster.partyShouldBeLiquidatedCross(party, uPnLCross);
    }

    function solvencySafeguardToRemoveLockedMargin(uint256 lockedMargin, int256 uPnLCross)
        external
        pure
        returns (bool)
    {
        return LibMaster.solvencySafeguardToRemoveLockedMargin(lockedMargin, uPnLCross);
    }
}
