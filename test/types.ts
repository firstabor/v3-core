import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import type {
  AccessControl,
  AccessControlAdmin,
  Diamond,
  DiamondCut,
  DiamondLoupe,
  ERC165,
  ERC2771Context,
  ERC2771ContextOwnable,
  HedgerERC2771,
  HedgerOwnable,
  IMasterAgreement,
  Ownable,
} from "../src/types";

declare module "mocha" {
  export interface Context {
    signers: Signers;
    diamond: Diamond;
    // Core
    diamondCut: DiamondCut;
    diamondLoupe: DiamondLoupe;
    erc165: ERC165;
    ownable: Ownable;
    // App
    accessControl: AccessControl;
    accessControlAdmin: AccessControlAdmin;
    hedgerERC2771: HedgerERC2771;
    hedgerOwnable: HedgerOwnable;
    erc2771Context: ERC2771Context;
    erc2771ContextOwnable: ERC2771ContextOwnable;
    // Config
    masterAgreement: IMasterAgreement;
    collateral: string;
    trustedForwarder: string;
  }
}

export interface Signers {
  owner: SignerWithAddress;
  admin: SignerWithAddress;
  signer: SignerWithAddress;
  user: SignerWithAddress;
}
