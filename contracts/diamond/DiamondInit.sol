// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
/******************************************************************************/

import { IERC20, SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { DiamondStorage } from "../diamond/DiamondStorage.sol";
import { AppStorage, LibAppStorage } from "../libraries/LibAppStorage.sol";
import { IERC165 } from "../interfaces/IERC165.sol";
import { IDiamondCut } from "../interfaces/IDiamondCut.sol";
import { IDiamondLoupe } from "../interfaces/IDiamondLoupe.sol";

import { HedgerStorage } from "../hedger/HedgerStorage.sol";
import { HedgerInternal } from "../hedger//HedgerInternal.sol";
import { ERC2771ContextStorage } from "../metatx/ERC2771ContextStorage.sol";

contract DiamondInit {
    using HedgerStorage for HedgerStorage.Layout;
    using ERC2771ContextStorage for ERC2771ContextStorage.Layout;
    using SafeERC20 for IERC20;

    function init() external {
        address masterAgreement = 0x212e1A33350a85c4bdB2607C47E041a65bD14361;
        address collateral = 0xB62F2fb600D39A44883688DE20A8E058c76Ad558;
        HedgerInternal.addMasterAgreement(masterAgreement, collateral);

        address trustedForwarder = 0x4461377e03cD75bc5B9b3D5514318b10b05B76d1;
        ERC2771ContextStorage.layout().trustedForwarder = trustedForwarder;

        DiamondStorage.Layout storage ds = DiamondStorage.layout();
        ds.supportedInterfaces[type(IERC165).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondCut).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondLoupe).interfaceId] = true;

        // Initialize AppStorage
        AppStorage storage s = LibAppStorage.diamondStorage();
        s.constants.collateral = 0xB62F2fb600D39A44883688DE20A8E058c76Ad558;
        s.constants.muonAppId = 0xe3338429f245381abeff397891ec063410462933b264c7c9451c9c407c0f0849;
        s.constants.minimumRequiredSignatures = 0;
        s.constants.protocolFee = 0.0005e18; // 0.05%
        s.constants.liquidationFee = 0.005e18; // 0.5%
        s.constants.protocolLiquidationShare = 0.1e18; // 10%
        s.constants.cva = 0.02e18; // 2%
        s.constants.requestTimeout = 2 minutes;
        s.constants.maxOpenPositionsCross = 10;
    }
}
