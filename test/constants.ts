import { keccak256 } from "@ethersproject/keccak256";
import { toUtf8Bytes } from "ethers/lib/utils";

export const SIGNER_ROLE = keccak256(toUtf8Bytes("SIGNER_ROLE"));
export const ADMIN_ROLE = keccak256(toUtf8Bytes("ADMIN_ROLE"));

export const MASTER_AGREEMENT = "0x212e1A33350a85c4bdB2607C47E041a65bD14361";
