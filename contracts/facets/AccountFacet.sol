// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ReentrancyGuard } from "../utils/ReentrancyGuard.sol";
import { C } from "../C.sol";
import { LibHedgers } from "../libraries/LibHedgers.sol";
import { LibOracle, PositionPrice } from "../libraries/LibOracle.sol";
import { LibMaster } from "../libraries/LibMaster.sol";
import { SchnorrSign } from "../interfaces/IMuonV03.sol";

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

    function removeFreeMargin() external {
        _removeFreeMargin(msg.sender);
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

    function _removeFreeMargin(address party) private {
        require(s.ma._openPositionsCrossList[party].length == 0, "Removal denied");
        require(s.ma._lockedMargin[party] > 0, "No locked margin");

        uint256 amount = s.ma._lockedMargin[party];
        s.ma._lockedMargin[party] = 0;
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
