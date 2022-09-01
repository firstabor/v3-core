// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.16;

import { Ownable } from "../utils/Ownable.sol";
import { LibMarkets } from "../libraries/LibMarkets.sol";
import { AppStorage, Market } from "../libraries/LibAppStorage.sol";
import "../libraries/LibEnums.sol";

contract MarketsFacet is Ownable {
    AppStorage internal s;

    // --------------------------------//
    //----- PUBLIC WRITE FUNCTIONS ----//
    // --------------------------------//

    function createMarket(
        string memory identifier,
        MarketType marketType,
        TradingSession tradingSession,
        bool active,
        string memory baseCurrency,
        string memory quoteCurrency,
        string memory symbol
    ) external onlyOwner returns (Market memory market) {
        uint256 currentMarketId = s.markets._marketList.length;
        market = Market(
            currentMarketId,
            identifier,
            marketType,
            tradingSession,
            active,
            baseCurrency,
            quoteCurrency,
            symbol
        );

        s.markets._marketMap[currentMarketId] = market;
        s.markets._marketList.push(market);

        // TODO: emit event
    }

    function updateMarketStatus(uint256 marketId, bool status) external onlyOwner {
        s.markets._marketMap[marketId].active = status;
        // TODO: emit event
    }

    // --------------------------------//
    //----- PUBLIC VIEW FUNCTIONS -----//
    // --------------------------------//

    function getMarketById(uint256 marketId) external view returns (Market memory market) {
        return s.markets._marketMap[marketId];
    }

    function getMarkets() external view returns (Market[] memory markets) {
        return s.markets._marketList;
    }

    function getMarketsLength() external view returns (uint256 length) {
        return s.markets._marketList.length;
    }
}
