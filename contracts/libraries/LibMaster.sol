// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.16;

import { AppStorage, LibAppStorage, RequestForQuote, Position, Fill } from "../libraries/LibAppStorage.sol";
import { Decimal } from "../libraries/LibDecimal.sol";
import { SchnorrSign } from "../interfaces/IMuonV02.sol";
import { LibOracle } from "../libraries/LibOracle.sol";
import { MarketPrice } from "../interfaces/IOracle.sol";
import { C } from "../C.sol";
import "../libraries/LibEnums.sol";

library LibMaster {
    using Decimal for Decimal.D256;

    // --------------------------------//
    //---- INTERNAL WRITE FUNCTIONS ---//
    // --------------------------------//

    function onRequestForQuote(
        address partyA,
        address partyB,
        uint256 marketId,
        OrderType orderType,
        HedgerMode hedgerMode,
        Side side,
        uint256 usdAmount,
        uint16 leverage,
        uint8 marginRequiredPercentage,
        MarketPrice[] calldata marketPrices,
        bytes calldata reqId,
        SchnorrSign[] calldata sigs
    ) internal returns (RequestForQuote memory rfq) {
        AppStorage storage s = LibAppStorage.diamondStorage();

        uint256 lockedMarginA = calculateLockedMargin(usdAmount * leverage, marginRequiredPercentage, false);
        uint256 lockedMarginB = calculateLockedMargin(usdAmount * leverage, marginRequiredPercentage, true);
        require(lockedMarginA <= s.ma._marginBalances[partyA], "Insufficient margin balance");

        // Validate raw oracle signatures. Can be bypassed if a user has no open positions.
        if (s.ma._openPositionsList[partyA].length > 0) {
            bool valid = LibOracle.isValidMarketPrices(marketPrices, reqId, sigs);
            require(valid, "Invalid oracle inputs");
        }
        /**
         * Note: We don't have to guesstimate the solvency post-trade,
         * because the isolated marginHealth will be 100% at T=0. Thus,
         * it will have no effect on the cross margin health.
         */
        (int256 uPnLCrossA, ) = LibMaster.calculateUPnLCross(marketPrices, partyA);
        require(
            LibMaster.solvencySafeguardToTrade(s.ma._lockedMargin[partyA], uPnLCrossA, false),
            "PartyA fails solvency safeguard"
        );

        uint256 currentRfqId = s.ma._requestForQuotesLength[partyA];

        rfq = RequestForQuote(
            currentRfqId,
            RequestForQuoteState.ORPHAN,
            orderType,
            partyA,
            partyB,
            hedgerMode,
            marketId,
            side,
            usdAmount * leverage,
            leverage,
            marginRequiredPercentage,
            lockedMarginA,
            lockedMarginB,
            block.timestamp,
            block.timestamp
        );

        s.ma._requestForQuoteMap[partyA][currentRfqId] = rfq;
        s.ma._requestForQuotesLength[partyA]++;

        /// @notice We will only lock partyB's margin once he accepts the RFQ.
        s.ma._marginBalances[partyA] -= lockedMarginA;
        s.ma._lockedMarginReserved[partyA] += lockedMarginA;
    }

    function createFill(
        Side side,
        uint256 amountUnits,
        uint256 avgPriceUsd
    ) internal view returns (Fill memory fill) {
        fill = Fill(side == Side.BUY ? Side.SELL : Side.BUY, amountUnits, avgPriceUsd, block.timestamp);
    }

    function distributePnL(
        address partyA,
        address partyB,
        int256 pnlA
    ) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        /**
         * Winning party receives the PNL.
         * Losing party pays for the PNL using his lockedMargin.
         *
         * Note: the winning party will NOT receive his lockedMargin back,
         * he'll have to withdraw it manually. This has to do with the
         * risk of liquidation + the fact that his initially lockedMargin
         * could be greater than what he currently has locked.
         */
        if (pnlA >= 0) {
            s.ma._marginBalances[partyA] += uint256(pnlA);
            s.ma._lockedMargin[partyB] -= uint256(pnlA);
        } else {
            s.ma._marginBalances[partyB] += uint256(pnlA);
            s.ma._lockedMargin[partyA] -= uint256(pnlA);
        }
    }

    function removeOpenPosition(address party, uint256 positionId) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        int256 index = -1;
        for (uint256 i = 0; i < s.ma._openPositionsList[party].length; i++) {
            if (s.ma._openPositionsList[party][i] == positionId) {
                index = int256(i);
                break;
            }
        }
        require(index != -1, "Position not found");

        s.ma._openPositionsList[party][uint256(index)] = s.ma._openPositionsList[party][
            s.ma._openPositionsList[party].length - 1
        ];
        s.ma._openPositionsList[party].pop();
    }

    // --------------------------------//
    //---- INTERNAL VIEW FUNCTIONS ----//
    // --------------------------------//

    function getOpenPositions(address party) internal view returns (Position[] memory positions) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint256[] memory positionIds = s.ma._openPositionsList[party];

        positions = new Position[](positionIds.length);
        for (uint256 i = 0; i < positionIds.length; i++) {
            positions[i] = s.ma._allPositionsMap[positionIds[i]];
        }
    }

    // TODO: upgrade to new 'realLeverage' system
    function calculateLockedMargin(
        uint256 notionalUsd,
        uint8 marginRequiredPercentage,
        bool isHedger // TODO: give this meaning
    ) internal pure returns (uint256) {
        Decimal.D256 memory multiplier = Decimal.one().add(C.getMarginOverhead()).add(C.getLiquidationFee());
        return Decimal.from(notionalUsd).mul(Decimal.ratio(marginRequiredPercentage, 100)).mul(multiplier).asUint256();
    }

    function calculateUPnLCross(MarketPrice[] memory marketPrices, address party)
        internal
        view
        returns (int256 uPnLCross, int256 notionalCross)
    {
        (uPnLCross, notionalCross) = _calculateUPnLCross(marketPrices, getOpenPositions(party));
    }

    /**
        Initial Units: 2
        Initial Price: 5
        Initial Notional: 2 * 5 = 10
        Current Price: 6

        Long: 
            Current Notional: 2 * 6 = 12
            PNL = CurrentNotional - InitialNotional 
                = 12 - 10 = +2 PROFIT
        Short:
            TEMP Current notional: 2 * 6 = 12
            PNL = InitialNotional - CurrentNotional
                = 10 - 12 = -2 LOSS
            Current Notional: VirtualNotional + (PNL * 2)
                = 12 + (-2 * 2) = 8
    */
    function calculateUPnLIsolated(
        Side side,
        uint256 currentBalanceUnits,
        uint256 initialNotionalUsd,
        uint256 bidPrice,
        uint256 askPrice
    ) internal pure returns (int256 uPnL, int256 notionalIsolated) {
        if (currentBalanceUnits == 0) return (0, 0);

        uint256 precision = C.getPrecision();

        if (side == Side.BUY) {
            require(bidPrice != 0, "Oracle bidPrice is invalid");
            notionalIsolated = int256((currentBalanceUnits * bidPrice) / precision);
            uPnL = notionalIsolated - int256(initialNotionalUsd);
        } else {
            require(askPrice != 0, "Oracle askPrice is invalid");
            int256 tempNotionalIsolated = int256((currentBalanceUnits * askPrice) / precision);
            uPnL = int256(initialNotionalUsd) - tempNotionalIsolated;
            notionalIsolated = tempNotionalIsolated + (uPnL * 2);
        }
    }

    function calculateCrossMarginHealth(uint256 _lockedMargin, int256 uPnLCross)
        internal
        pure
        returns (Decimal.D256 memory ratio)
    {
        int256 lockedMargin = int256(_lockedMargin);

        if (lockedMargin == 0) {
            return Decimal.ratio(1, 1);
        } else if (lockedMargin + uPnLCross <= 0) {
            return Decimal.zero();
        }

        ratio = Decimal.ratio(uint256(lockedMargin + uPnLCross), uint256(lockedMargin));
    }

    /**
     * A party (user and/or hedger) isn't allowed to open a trade if he's near insolvency.
     * This restriction is put in place to protect the hedger against concurrency
     * problematics. Instead, the party is encouraged to top-up his locked margin via addFreeMargin.
     */
    function solvencySafeguardToTrade(
        uint256 lockedMargin,
        int256 uPnLCross,
        bool isHedger
    ) internal pure returns (bool) {
        Decimal.D256 memory ratio = calculateCrossMarginHealth(lockedMargin, uPnLCross);
        Decimal.D256 memory threshold = C.getSolvencyThresholdToTrade(isHedger);
        return ratio.greaterThanOrEqualTo(threshold);
    }

    function solvencySafeguardToRemoveLockedMargin(
        uint256 lockedMargin,
        int256 uPnLCross,
        bool isHedger
    ) internal pure returns (bool) {
        Decimal.D256 memory ratio = calculateCrossMarginHealth(lockedMargin, uPnLCross);
        Decimal.D256 memory threshold = C.getSolvencyThresholdToRemoveLockedMargin(isHedger);
        return ratio.greaterThanOrEqualTo(threshold);
    }

    function isValidLeverage(uint16 leverage) internal pure returns (bool) {
        return leverage > 0 && leverage <= C.getMaxLeverage();
    }

    // --------------------------------//
    //----- PRIVATE VIEW FUNCTIONS ----//
    // --------------------------------//

    /**
     * Returns the UPnL of a party across all his open positions.
     *
     * @notice This function consumes a lot of gas, so make sure to limit `marketPrices`
     * strictly to the markets that the party has open positions with.
     *
     * @dev We assume the signature of `marketPrices` is already validated by parent caller.
     */
    function _calculateUPnLCross(MarketPrice[] memory marketPrices, Position[] memory positions)
        private
        pure
        returns (int256 uPnLCross, int256 notionalCross)
    {
        require(marketPrices.length <= positions.length, "Redundant marketPrices");
        if (positions.length == 0) {
            return (0, 0);
        }

        uint256 count;
        for (uint256 i = 0; i < marketPrices.length; i++) {
            uint256 marketId = marketPrices[i].marketId;
            uint256 bidPrice = marketPrices[i].bidPrice;
            uint256 askPrice = marketPrices[i].askPrice;

            for (uint256 j = 0; j < positions.length; j++) {
                if (positions[j].marketId == marketId) {
                    (int256 _uPnLIsolated, int256 _notionalIsolated) = calculateUPnLIsolated(
                        positions[j].side,
                        positions[j].currentBalanceUnits,
                        positions[j].initialNotionalUsd,
                        bidPrice,
                        askPrice
                    );
                    uPnLCross += _uPnLIsolated;
                    notionalCross += _notionalIsolated;
                    count++;
                }
            }
        }

        require(count == positions.length, "Incomplete price feeds");
    }
}
