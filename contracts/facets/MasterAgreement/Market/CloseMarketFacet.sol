// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.16;

import { AppStorage, LibAppStorage, Position, Fill } from "../../../libraries/LibAppStorage.sol";
import { LibMaster } from "../../../libraries/LibMaster.sol";
import { LibOracle, SchnorrSign } from "../../../libraries/LibOracle.sol";
import { C } from "../../../C.sol";
import "../../../libraries/LibEnums.sol";

/**
 * Close a Position through a Market order.
 * @dev Can only be done via the original partyB (hedgerMode=Single).
 */
contract CloseMarketFacet {
    AppStorage internal s;

    function requestCloseMarket(uint256 positionId) external {
        Position storage position = s.ma._allPositionsMap[positionId];

        require(position.partyA == msg.sender, "Invalid party");
        require(position.state == PositionState.OPEN, "Invalid position state");

        position.state = PositionState.MARKET_CLOSE_REQUESTED;
        position.mutableTimestamp = block.timestamp;

        // TODO: emit event
    }

    function cancelCloseMarket(uint256 positionId) external {
        Position storage position = s.ma._allPositionsMap[positionId];

        require(position.partyA == msg.sender, "Invalid party");
        require(position.state == PositionState.MARKET_CLOSE_REQUESTED, "Invalid position state");

        position.state = PositionState.MARKET_CLOSE_CANCELATION_REQUESTED;
        position.mutableTimestamp = block.timestamp;

        // TODO: emit event
    }

    function forceCancelCloseMarket(uint256 positionId) public {
        Position storage position = s.ma._allPositionsMap[positionId];

        require(position.partyA == msg.sender, "Invalid party");
        require(position.state == PositionState.MARKET_CLOSE_CANCELATION_REQUESTED, "Invalid position state");
        require(position.mutableTimestamp + C.getRequestTimeout() < block.timestamp, "Request Timeout");

        position.state = PositionState.OPEN;
        position.mutableTimestamp = block.timestamp;

        // TODO: emit event
    }

    function acceptCancelCloseMarket(uint256 positionId) external {
        Position storage position = s.ma._allPositionsMap[positionId];

        require(position.partyB == msg.sender, "Invalid party");
        require(position.state == PositionState.MARKET_CLOSE_CANCELATION_REQUESTED, "Invalid position state");

        position.state = PositionState.OPEN;
        position.mutableTimestamp = block.timestamp;

        // TODO: emit event
    }

    function rejectCloseMarket(uint256 positionId) external {
        Position storage position = s.ma._allPositionsMap[positionId];

        require(position.partyB == msg.sender, "Invalid party");
        require(position.state == PositionState.MARKET_CLOSE_REQUESTED, "Invalid position state");

        position.state = PositionState.OPEN;
        position.mutableTimestamp = block.timestamp;

        // TODO: emit event
    }

    function fillCloseMarket(
        uint256 positionId,
        uint256 bidPrice,
        uint256 askPrice,
        bytes calldata reqId,
        SchnorrSign[] calldata sigs
    ) external {
        Position storage position = s.ma._allPositionsMap[positionId];

        require(position.partyB == msg.sender, "Invalid party");
        require(position.state == PositionState.MARKET_CLOSE_REQUESTED, "Invalid position state");

        // Verify oracle signatures
        LibOracle.verifyPositionPriceOrThrow(positionId, bidPrice, askPrice, reqId, sigs);

        // Handle the fill
        LibMaster.onFillCloseMarket(positionId, LibOracle.createPositionPrice(positionId, bidPrice, askPrice));

        // TODO: emit event
    }
}
