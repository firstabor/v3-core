// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.16;

import { AppStorage, RequestForQuote, Position, Fill } from "../../../libraries/LibAppStorage.sol";
import { LibMarkets } from "../../../libraries/LibMarkets.sol";
import { LibHedgers } from "../../../libraries/LibHedgers.sol";
import { LibMaster } from "../../../libraries/LibMaster.sol";
import { SchnorrSign } from "../../../interfaces/IMuonV02.sol";
import { MarketPrice } from "../../../interfaces/IOracle.sol";
import { C } from "../../../C.sol";
import "../../../libraries/LibEnums.sol";

contract OpenMarketSingleFacet {
    AppStorage internal s;

    function requestOpenMarketSingle(
        address partyB,
        uint256 marketId,
        Side side,
        uint256 usdAmount,
        uint16 leverage,
        uint8 marginRequiredPercentage,
        MarketPrice[] calldata marketPrices,
        bytes calldata reqId,
        SchnorrSign[] calldata sigs
    ) external returns (RequestForQuote memory rfq) {
        require(msg.sender != partyB, "Parties can not be the same");
        require(LibMarkets.isValidMarketId(marketId), "Invalid market");
        require(LibMaster.isValidLeverage(leverage), "Invalid leverage");
        (bool validHedger, ) = LibHedgers.isValidHedger(partyB);
        require(validHedger, "Invalid hedger");

        rfq = LibMaster.onRequestForQuote(
            msg.sender,
            partyB,
            marketId,
            OrderType.MARKET,
            HedgerMode.SINGLE,
            side,
            usdAmount,
            leverage,
            marginRequiredPercentage,
            marketPrices,
            reqId,
            sigs
        );

        // TODO: emit event
    }

    function cancelOpenMarketSingle(uint256 rfqId) external {
        RequestForQuote storage rfq = s.ma._requestForQuoteMap[msg.sender][rfqId];

        require(rfq.partyA == msg.sender, "Invalid party");
        require(rfq.hedgerMode == HedgerMode.SINGLE, "Invalid hedger mode");
        require(rfq.orderType == OrderType.MARKET, "Invalid order type");
        require(rfq.state == RequestForQuoteState.ORPHAN, "Invalid RFQ state");

        rfq.state = RequestForQuoteState.CANCELATION_REQUESTED;
        rfq.mutableTimestamp = block.timestamp;

        // TODO: emit the event
    }

    function forceCancelOpenMarketSingle(uint256 rfqId) public {
        RequestForQuote storage rfq = s.ma._requestForQuoteMap[msg.sender][rfqId];

        require(rfq.partyA == msg.sender, "Invalid party");
        require(rfq.hedgerMode == HedgerMode.SINGLE, "Invalid hedger mode");
        require(rfq.orderType == OrderType.MARKET, "Invalid order type");
        require(rfq.state == RequestForQuoteState.CANCELATION_REQUESTED, "Invalid RFQ state");
        require(rfq.mutableTimestamp + C.getRequestTimeout() < block.timestamp, "Request Timeout");

        // Update the RFQ state.
        rfq.state = RequestForQuoteState.CANCELED;
        rfq.mutableTimestamp = block.timestamp;

        // Return the collateral to partyA.
        s.ma._lockedMarginReserved[msg.sender] -= rfq.lockedMarginA;
        s.ma._marginBalances[msg.sender] += rfq.lockedMarginA;

        // TODO: emit event
    }

    function acceptCancelOpenMarketSingle(address partyA, uint256 rfqId) external {
        RequestForQuote storage rfq = s.ma._requestForQuoteMap[msg.sender][rfqId];

        require(rfq.partyB == msg.sender, "Invalid party");
        require(rfq.hedgerMode == HedgerMode.SINGLE, "Invalid hedger mode");
        require(rfq.orderType == OrderType.MARKET, "Invalid order type");
        require(rfq.state == RequestForQuoteState.CANCELATION_REQUESTED, "Invalid RFQ state");

        // Update the RFQ state.
        rfq.state = RequestForQuoteState.CANCELED;
        rfq.mutableTimestamp = block.timestamp;

        // Return the collateral to partyA.
        s.ma._lockedMarginReserved[partyA] -= rfq.lockedMarginA;
        s.ma._marginBalances[partyA] += rfq.lockedMarginA;
    }

    function rejectOpenMarketSingle(address partyA, uint256 rfqId) external {
        RequestForQuote storage rfq = s.ma._requestForQuoteMap[partyA][rfqId];

        require(rfq.partyB == msg.sender, "Invalid party");
        require(rfq.hedgerMode == HedgerMode.SINGLE, "Invalid hedger mode");
        require(rfq.orderType == OrderType.MARKET, "Invalid order type");
        require(
            rfq.state == RequestForQuoteState.ORPHAN || rfq.state == RequestForQuoteState.CANCELATION_REQUESTED,
            "Invalid RFQ state"
        );

        // Update the RFQ
        rfq.state = RequestForQuoteState.REJECTED;
        rfq.mutableTimestamp = block.timestamp;

        // Return the collateral to partyA
        s.ma._lockedMarginReserved[partyA] -= rfq.lockedMarginA;
        s.ma._marginBalances[partyA] += rfq.lockedMarginA;

        // TODO: emit event
    }

    function fillOpenMarketSingle(
        address partyA,
        uint256 rfqId,
        uint256 filledAmountUnits,
        uint256 initialNotionalUsd,
        uint256 avgPriceUsd
    ) external {
        RequestForQuote storage rfq = s.ma._requestForQuoteMap[partyA][rfqId];

        require(rfq.partyB == msg.sender, "Invalid party");
        require(rfq.hedgerMode == HedgerMode.SINGLE, "Invalid hedger mode");
        require(rfq.orderType == OrderType.MARKET, "Invalid order type");
        require(
            rfq.state == RequestForQuoteState.ORPHAN || rfq.state == RequestForQuoteState.CANCELATION_REQUESTED,
            "Invalid RFQ state"
        );

        // Update the RFQ
        rfq.state = RequestForQuoteState.ACCEPTED;
        rfq.mutableTimestamp = block.timestamp;

        // Create the Position
        uint256 currentPositionId = s.ma._allPositionsLength;
        Position memory position = Position(
            currentPositionId,
            PositionState.OPEN,
            rfq.marketId,
            partyA,
            msg.sender,
            rfq.lockedMarginA,
            rfq.lockedMarginB,
            rfq.leverageUsed,
            rfq.side,
            filledAmountUnits,
            initialNotionalUsd,
            block.timestamp,
            block.timestamp
        );

        // Create the first Fill
        s.ma._positionFills[currentPositionId].push(Fill(rfq.side, filledAmountUnits, avgPriceUsd, block.timestamp));

        // Update global mappings
        s.ma._allPositionsMap[currentPositionId] = position;
        s.ma._allPositionsLength++;

        // Update party mappings
        s.ma._openPositionsList[partyA].push(currentPositionId);
        s.ma._openPositionsList[msg.sender].push(currentPositionId);

        // Transfer partyA's collateral
        s.ma._lockedMarginReserved[partyA] -= rfq.lockedMarginA;
        s.ma._lockedMargin[partyA] += rfq.lockedMarginA;

        // Transfer partyB's collateral
        s.ma._marginBalances[msg.sender] -= rfq.lockedMarginB;
        s.ma._lockedMargin[msg.sender] += rfq.lockedMarginB;

        // TODO: emit event
    }
}
