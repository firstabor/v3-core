// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
/******************************************************************************/

import { IERC165 } from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import { ERC165Storage } from "../introspection/ERC165Storage.sol";
import { IDiamondCut } from "./IDiamondCut.sol";
import { DiamondStorage } from "./DiamondStorage.sol";
import { IDiamondLoupe } from "./IDiamondLoupe.sol";
import { OwnableStorage } from "../access/ownable/OwnableStorage.sol";
import { IERC173 } from "../access/ownable/IERC173.sol";

contract Diamond {
    using ERC165Storage for ERC165Storage.Layout;
    using OwnableStorage for OwnableStorage.Layout;

    struct Initialization {
        address initContract;
        bytes initData;
    }

    struct CoreFacets {
        address diamondCutFacet;
        address diamondLoupeFacet;
        address erc165Facet;
        address erc173Facet;
    }

    constructor(
        address owner,
        CoreFacets memory _coreFacets,
        IDiamondCut.FacetCut[] memory _appFacets,
        Initialization[] memory _initializations
    ) {
        ERC165Storage.Layout storage erc165 = ERC165Storage.layout();

        // Register DiamondCut
        bytes4[] memory selectorsDiamondCut = new bytes4[](1);
        selectorsDiamondCut[0] = IDiamondCut.diamondCut.selector;
        erc165.setSupportedInterface(type(IDiamondCut).interfaceId, true);

        // Register DiamondLoupe
        bytes4[] memory selectorsDiamondLoupe = new bytes4[](4);
        selectorsDiamondLoupe[0] = IDiamondLoupe.facets.selector;
        selectorsDiamondLoupe[1] = IDiamondLoupe.facetFunctionSelectors.selector;
        selectorsDiamondLoupe[2] = IDiamondLoupe.facetAddresses.selector;
        selectorsDiamondLoupe[3] = IDiamondLoupe.facetAddress.selector;
        erc165.setSupportedInterface(type(IDiamondLoupe).interfaceId, true);

        // Register ERC165 (supportsInterface)
        bytes4[] memory selectorsERC165 = new bytes4[](1);
        selectorsERC165[0] = IERC165.supportsInterface.selector;

        // Register ERC173 (Ownable)
        bytes4[] memory selectorsERC173 = new bytes4[](3);
        selectorsERC173[0] = IERC173.owner.selector;
        selectorsERC173[1] = IERC173.renounceOwnership.selector;
        selectorsERC173[2] = IERC173.transferOwnership.selector;
        erc165.setSupportedInterface(type(IERC173).interfaceId, true);

        // Execute the first ever diamond cut, we're calling the addFunctions directly to save ~ %50 gas
        DiamondStorage.addFunctions(_coreFacets.diamondCutFacet, selectorsDiamondCut);
        DiamondStorage.addFunctions(_coreFacets.diamondLoupeFacet, selectorsDiamondLoupe);
        DiamondStorage.addFunctions(_coreFacets.erc165Facet, selectorsERC165);
        DiamondStorage.addFunctions(_coreFacets.erc173Facet, selectorsERC173);

        // Set owner
        OwnableStorage.layout().setOwner(owner);

        // Initialize facet selectors
        for (uint256 i = 0; i < _appFacets.length; i++) {
            DiamondStorage.addFunctions(_appFacets[i].facetAddress, _appFacets[i].functionSelectors);
        }

        // Init additional txns atomically
        for (uint256 i = 0; i < _initializations.length; i++) {
            DiamondStorage.initializeDiamondCut(_initializations[i].initContract, _initializations[i].initData);
        }
    }

    // Find facet for function that is called and execute the
    // function if a facet is found and return any value.
    fallback() external payable {
        DiamondStorage.Layout storage l;
        bytes32 position = DiamondStorage.DIAMOND_STORAGE_POSITION;

        // get diamond storage
        assembly {
            l.slot := position
        }

        // get facet from function selector
        address facet = l.selectorToFacetAndPosition[msg.sig].facetAddress;
        require(facet != address(0), "Diamond: Function does not exist");

        // Execute external function from facet using delegatecall and return any value.
        assembly {
            // copy function selector and any arguments
            calldatacopy(0, 0, calldatasize())
            // execute function call using the facet
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            // get any return value
            returndatacopy(0, 0, returndatasize())
            // return any return value or error back to the caller
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    receive() external payable {}
}
