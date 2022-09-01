// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.16;
import "./LibEnums.sol";

struct Hedger {
    address addr;
    string[] pricingWssURLs;
    string[] marketsHttpsURLs;
    bool slippageControl;
}

struct Market {
    uint256 _marketId;
    string identifier;
    MarketType marketType;
    TradingSession tradingSession;
    bool active;
    string baseCurrency;
    string quoteCurrency;
    string symbol;
}

struct RequestForQuote {
    uint256 rfqId;
    RequestForQuoteState state;
    OrderType orderType;
    address partyA;
    address partyB;
    HedgerMode hedgerMode;
    uint256 marketId;
    Side side;
    uint256 notionalUsd;
    uint16 leverageUsed;
    uint256 marginRequiredPercentage;
    uint256 lockedMarginA;
    uint256 lockedMarginB;
    uint256 creationTimestamp;
    uint256 mutableTimestamp;
}

struct Fill {
    Side side;
    uint256 filledAmountUnits;
    uint256 avgPriceUsd;
    uint256 timestamp;
}

struct Position {
    uint256 positionId;
    PositionState state;
    uint256 marketId;
    address partyA;
    address partyB;
    uint256 lockedMarginA;
    uint256 lockedMarginB;
    uint16 leverageUsed;
    Side side;
    uint256 currentBalanceUnits;
    uint256 initialNotionalUsd;
    uint256 creationTimestamp;
    uint256 mutableTimestamp;
}

struct HedgersState {
    mapping(address => Hedger) _hedgerMap;
    Hedger[] _hedgerList;
}

struct MarketsState {
    mapping(uint256 => Market) _marketMap;
    Market[] _marketList;
}

struct MAState {
    mapping(address => mapping(uint256 => RequestForQuote)) _requestForQuoteMap;
    mapping(address => uint256) _requestForQuotesLength;
    mapping(address => uint256) _accountBalances;
    mapping(address => uint256) _marginBalances;
    mapping(address => uint256) _lockedMargin;
    mapping(address => uint256) _lockedMarginReserved;
    mapping(uint256 => Position) _allPositionsMap;
    uint256 _allPositionsLength;
    mapping(address => uint256[]) _openPositionsList;
    mapping(uint256 => Fill[]) _positionFills;
}

struct AppStorage {
    bool paused;
    uint128 pausedAt;
    uint256 reentrantStatus;
    address ownerCandidate;
    HedgersState hedgers;
    MarketsState markets;
    MAState ma;
}

library LibAppStorage {
    function diamondStorage() internal pure returns (AppStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }
}
