// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.16;

import { LibHedgers } from "../libraries/LibHedgers.sol";
import { AppStorage, Hedger } from "../libraries/LibAppStorage.sol";

contract HedgersFacet {
    AppStorage internal s;

    // --------------------------------//
    //----- PUBLIC WRITE FUNCTIONS ----//
    // --------------------------------//

    function enlist(
        string[] calldata pricingWssURLs,
        string[] calldata marketsHttpsURLs,
        bool slippageControl
    ) external returns (Hedger memory hedger) {
        require(msg.sender != address(0), "Invalid address");
        require(s.hedgers._hedgerMap[msg.sender].addr != msg.sender, "Hedger already exists");

        require(pricingWssURLs.length > 0, "pricingWebsocketURLs must be non-empty");
        require(marketsHttpsURLs.length > 0, "pricingWebsocketURLs must be non-empty");
        mustBeHTTPSOrThrow(marketsHttpsURLs);
        mustBeWSSOrThrow(pricingWssURLs);

        hedger = Hedger(msg.sender, pricingWssURLs, marketsHttpsURLs, slippageControl);
        s.hedgers._hedgerMap[msg.sender] = hedger;
        s.hedgers._hedgerList.push(hedger);

        // TODO: emit event
    }

    function updatePricingWssURLs(string[] calldata _pricingWssURLs) external {
        Hedger memory hedger = LibHedgers.getHedgerByAddressOrThrow(msg.sender);

        require(hedger.addr == msg.sender, "Access Denied");
        require(_pricingWssURLs.length > 0, "pricingWssURLs must be non-empty");
        mustBeWSSOrThrow(_pricingWssURLs);

        s.hedgers._hedgerMap[msg.sender].pricingWssURLs = _pricingWssURLs;

        // TODO: emit event
    }

    function updateMarketsHttpsURLs(string[] calldata _marketsHttpsURLs) external {
        Hedger memory hedger = LibHedgers.getHedgerByAddressOrThrow(msg.sender);

        require(hedger.addr == msg.sender, "Access Denied");
        require(_marketsHttpsURLs.length > 0, "marketsHttpsURLs must be non-empty");
        mustBeHTTPSOrThrow(_marketsHttpsURLs);

        s.hedgers._hedgerMap[msg.sender].marketsHttpsURLs = _marketsHttpsURLs;

        // TODO: emit event
    }

    function updateSlippageControl(bool _slippageControl) external {
        Hedger memory hedger = LibHedgers.getHedgerByAddressOrThrow(msg.sender);
        require(hedger.addr == msg.sender, "Access Denied");

        s.hedgers._hedgerMap[msg.sender].slippageControl = _slippageControl;

        // TODO: emit event
    }

    // --------------------------------//
    //----- PUBLIC VIEW FUNCTIONS -----//
    // --------------------------------//

    function getHedgerByAddress(address addr) external view returns (bool success, Hedger memory hedger) {
        hedger = s.hedgers._hedgerMap[addr];
        return hedger.addr == address(0) ? (false, hedger) : (true, hedger);
    }

    function getHedgers() external view returns (Hedger[] memory hedgerList) {
        return s.hedgers._hedgerList;
    }

    function getHedgersLength() external view returns (uint256 length) {
        return s.hedgers._hedgerList.length;
    }

    // --------------------------------//
    //----- PRIVATE VIEW FUNCTIONS ----//
    // --------------------------------//

    function substringASCII(
        string memory str,
        uint256 startIndex,
        uint256 endIndex
    ) private pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(endIndex - startIndex);
        for (uint256 i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = strBytes[i];
        }
        return string(result);
    }

    function compareStrings(string memory a, string memory b) private pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }

    function mustBeWSSOrThrow(string[] calldata urls) private pure {
        for (uint256 i = 0; i < urls.length; i++) {
            require(compareStrings(substringASCII(urls[i], 0, 6), "wss://"), "websocketURLs must be secure");
        }
    }

    function mustBeHTTPSOrThrow(string[] calldata urls) private pure {
        for (uint256 i = 0; i < urls.length; i++) {
            require(compareStrings(substringASCII(urls[i], 0, 8), "https://"), "httpsURLs must be secure");
        }
    }
}
