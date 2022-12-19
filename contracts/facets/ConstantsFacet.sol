// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.16;

import { AccessControlInternal } from "../access/roles/AccessControlInternal.sol";
import { AppStorage } from "../libraries/LibAppStorage.sol";
import { PublicKey } from "../libraries/LibOracle.sol";
import { C } from "../C.sol";

contract ConstantsFacet is AccessControlInternal {
    AppStorage internal s;

    /*------------------------*
     * PUBLIC WRITE FUNCTIONS *
     *------------------------*/

    function setCollateral(address _collateral) external onlyRole(ADMIN_ROLE) {
        s.constants.collateral = _collateral;
    }

    function setMuonAppId(uint256 _muonAppId) external onlyRole(ADMIN_ROLE) {
        s.constants.muonAppIdV2 = _muonAppId;
    }

    function setMuonPublicKey(uint256 x, uint8 parity) external onlyRole(ADMIN_ROLE) {
        s.constants.muonPublicKey = PublicKey(x, parity);
    }

    function setMuonGatewaySigner(address _muonGatewaySigner) external onlyRole(ADMIN_ROLE) {
        s.constants.muonGatewaySigner = _muonGatewaySigner;
    }

    function setProtocolFee(uint256 _protocolFee) external onlyRole(ADMIN_ROLE) {
        s.constants.protocolFee = _protocolFee;
    }

    function setLiquidationFee(uint256 _liquidationFee) external onlyRole(ADMIN_ROLE) {
        s.constants.liquidationFee = _liquidationFee;
    }

    function setProtocolLiquidationShare(uint256 _protocolLiquidationShare) external onlyRole(ADMIN_ROLE) {}

    function setCVA(uint256 _cva) external onlyRole(ADMIN_ROLE) {
        s.constants.cva = _cva;
    }

    function setRequestTimeout(uint256 _requestTimeout) external onlyRole(ADMIN_ROLE) {
        s.constants.requestTimeout = _requestTimeout;
    }

    function setMaxOpenPositionsCross(uint256 _maxOpenPositionsCross) external onlyRole(ADMIN_ROLE) {
        s.constants.maxOpenPositionsCross = _maxOpenPositionsCross;
    }

    /*-----------------------*
     * PUBLIC VIEW FUNCTIONS *
     *-----------------------*/

    function getPrecision() external pure returns (uint256) {
        return C.getPrecision();
    }

    function getPercentBase() external pure returns (uint256) {
        return C.getPercentBase();
    }

    function getCollateral() external view returns (address) {
        return C.getCollateral();
    }

    function getMuonAppId() external view returns (uint256) {
        return C.getMuonAppId();
    }

    function getMuonPublicKey() external view returns (PublicKey memory) {
        return C.getMuonPublicKey();
    }

    function getMuonGatewaySigner() external view returns (address) {
        return C.getMuonGatewaySigner();
    }

    function getProtocolFee() external view returns (uint256) {
        return C.getProtocolFee().value;
    }

    function getLiquidationFee() external view returns (uint256) {
        return C.getLiquidationFee().value;
    }

    function getProtocolLiquidationShare() external view returns (uint256) {
        return C.getProtocolLiquidationShare().value;
    }

    function getCVA() external view returns (uint256) {
        return C.getCVA().value;
    }

    function getRequestTimeout() external view returns (uint256) {
        return C.getRequestTimeout();
    }

    function getMaxOpenPositionsCross() external view returns (uint256) {
        return C.getMaxOpenPositionsCross();
    }
}
