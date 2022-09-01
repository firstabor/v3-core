// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ReentrancyGuard } from "../utils/ReentrancyGuard.sol";
import { C } from "../C.sol";
import { LibHedgers } from "../libraries/LibHedgers.sol";
import { LibOracle } from "../libraries/LibOracle.sol";
import { LibMaster } from "../libraries/LibMaster.sol";
import { SchnorrSign } from "../interfaces/IMuonV02.sol";
import { MarketPrice } from "../interfaces/IOracle.sol";

contract AccountFacet is ReentrancyGuard {
    // --------------------------------//
    //----- PUBLIC WRITE FUNCTIONS ----//
    // --------------------------------//

    function deposit(uint256 amount) external {
        _deposit(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        _withdraw(msg.sender, amount);
    }

    function allocate(uint256 amount) external {
        _allocate(msg.sender, amount);
    }

    function deallocate(uint256 amount) external {
        _deallocate(msg.sender, amount);
    }

    function depositAndAllocate(uint256 amount) external {
        _deposit(msg.sender, amount);
        _allocate(msg.sender, amount);
    }

    function deallocateAndWithdraw(uint256 amount) external {
        _deallocate(msg.sender, amount);
        _withdraw(msg.sender, amount);
    }

    function addFreeMargin(uint256 amount) external {
        _addFreeMargin(msg.sender, amount);
    }

    function dangerouslyRemoveLockedMargin(
        uint256 amount,
        MarketPrice[] calldata marketPrices,
        bytes calldata reqId,
        SchnorrSign[] calldata sigs
    ) external {
        _dangerouslyRemoveLockedMargin(msg.sender, amount, marketPrices, reqId, sigs);
    }

    // --------------------------------//
    //----- PRIVATE WRITE FUNCTIONS ---//
    // --------------------------------//

    function _deposit(address party, uint256 amount) private nonReentrant {
        bool success = IERC20(C.getCollateral()).transferFrom(party, address(this), amount);
        require(success, "Failed to deposit collateral");
        s.ma._accountBalances[party] += amount;
        // TODO: emit event
    }

    function _withdraw(address party, uint256 amount) private nonReentrant {
        require(s.ma._accountBalances[party] >= amount, "Insufficient account balance");
        s.ma._accountBalances[party] -= amount;

        bool success = IERC20(C.getCollateral()).transfer(party, amount);
        require(success, "Failed to withdraw collateral");
        // TODO: emit event
    }

    function _allocate(address party, uint256 amount) private nonReentrant {
        require(s.ma._accountBalances[party] >= amount, "Insufficient account balance");

        s.ma._accountBalances[party] -= amount;
        s.ma._marginBalances[party] += amount;
        // TODO: emit event
    }

    function _deallocate(address party, uint256 amount) private nonReentrant {
        require(s.ma._marginBalances[party] >= amount, "Insufficient margin balance");

        s.ma._marginBalances[party] -= amount;
        s.ma._accountBalances[party] += amount;
        // TODO: emit event
    }

    function _addFreeMargin(address party, uint256 amount) private {
        require(s.ma._marginBalances[party] >= amount, "Insufficient margin balance");

        s.ma._marginBalances[party] -= amount;
        s.ma._lockedMargin[party] += amount;

        // TODO: emit event
    }

    function _dangerouslyRemoveLockedMargin(
        address party,
        uint256 amount,
        MarketPrice[] calldata marketPrices,
        bytes calldata reqId,
        SchnorrSign[] calldata sigs
    ) private {
        require(s.ma._lockedMargin[party] >= amount, "Insufficient lockedMargin balance");

        // Validate raw oracle signatures. Can be bypassed if a user has no open positions.
        if (s.ma._openPositionsList[party].length > 0) {
            bool valid = LibOracle.isValidMarketPrices(marketPrices, reqId, sigs);
            require(valid, "Invalid oracle inputs");
        }

        (int256 uPnLCross, ) = LibMaster.calculateUPnLCross(marketPrices, party);
        (bool isHedger, ) = LibHedgers.isValidHedger(party);
        require(
            LibMaster.solvencySafeguardToRemoveLockedMargin(s.ma._lockedMargin[party] - amount, uPnLCross, isHedger),
            "Party fails solvency safeguard"
        );

        s.ma._lockedMargin[party] -= amount;
        s.ma._marginBalances[party] += amount;
    }

    // --------------------------------//
    //----- PUBLIC VIEW FUNCTIONS -----//
    // --------------------------------//

    function getAccountBalance(address party) external view returns (uint256) {
        return s.ma._accountBalances[party];
    }

    function getMarginBalance(address party) external view returns (uint256) {
        return s.ma._marginBalances[party];
    }

    function getLockedMargin(address party) external view returns (uint256) {
        return s.ma._lockedMargin[party];
    }

    function getLockedMarginReserved(address party) external view returns (uint256) {
        return s.ma._lockedMarginReserved[party];
    }
}
