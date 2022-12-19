// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.8.16;

import { LibDiamond } from "../libraries/LibDiamond.sol";
import { AppStorage, LibAppStorage } from "../libraries/LibAppStorage.sol";
import { AccessControlInternal } from "../access/roles/AccessControlInternal.sol";

contract PauseFacet is AccessControlInternal {
    AppStorage internal s;

    event Pause(uint256 timestamp);
    event Unpause(uint256 timestamp);

    function pause() external onlyRole(ADMIN_ROLE) {
        require(!s.paused, "Pause: already paused.");
        s.paused = true;
        s.pausedAt = uint128(block.timestamp);
        emit Pause(block.timestamp);
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        require(s.paused, "Pause: not paused.");
        s.paused = false;
        emit Unpause(block.timestamp);
    }
}
