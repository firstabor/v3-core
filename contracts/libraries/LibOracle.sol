// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.16;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { MarketPrice } from "../interfaces/IOracle.sol";
import { SchnorrSign, IMuonV02 } from "../interfaces/IMuonV02.sol";
import { C } from "../C.sol";

library LibOracle {
    using ECDSA for bytes32;

    function isValidMarketPrices(
        MarketPrice[] calldata marketPrices,
        bytes calldata reqId,
        SchnorrSign[] calldata sigs
    ) internal returns (bool) {
        require(sigs.length >= C.getMinimumRequiredSignatures(), "Insufficient signatures");

        bytes32 hash = keccak256(abi.encode(marketPrices, C.getChainId(), C.getMuonAppId()));
        IMuonV02 _muon = IMuonV02(C.getMuon());

        // bool valid = _muon.verify(reqId, uint256(hash), sigs);
        // TODO: return `valid` once we've integrated Muon.
        return true;
    }
}
