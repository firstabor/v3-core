// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

interface IERC2771ContextAdmin {
    function setTrustedForwarder(address trustedForwarder) external;
}
