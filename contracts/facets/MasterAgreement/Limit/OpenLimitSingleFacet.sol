// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.16;

/**
 * Open a Position through a Limit order. There's 2 methods:
 *
 * 1) A keeper can request a market order on behalf of a user.
 * 2) An actual Limit order living on the broker's orderbook.
 *
 * The below will be using the 2nd method, as the margin used
 * is safe from liquidations. And therefor, we don't have to
 * deal with atomicity issues.
 */
contract OpenLimitSingleFacet {
    function requestOpenLimitSingle() external {}

    function cancelOpenLimitSingle() external {}

    function forceCancelOpenLimitSingle() external {}

    function acceptCancelOpenLimitSingle() external {}

    function acknowledgeOpenLimitSingle() external {}

    function rejectOpenLimitSingle() external {}

    function fillOpenLimitSingle() external {}
}
