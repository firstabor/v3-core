// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

interface IERC2771Context {
    function trustedForwarder() external view returns (address);

    function isTrustedForwarder(address forwarder) external view returns (bool);
}
