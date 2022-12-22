import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
  /* Core */
  Diamond,
  DiamondCut,
  DiamondLoupe,
  ERC165,
  Ownable,
  /* App */
  AccessControl,
  AccessControlAdmin,
  Constants,
  ConstantsOwnable,
  Hedgers,
  Markets,
  MarketsOwnable,
  Accounts,
  AccountsOwnable,
  Liquidations,
  CloseMarket,
  ClosePosition,
  ClosePositionOwnable,
  OpenMarketSingle,
  OpenPosition,
  MasterAgreement,
  Oracle,
  OracleOwnable,
  PauseOwnable,
} from "../src/types";
import { Collateral } from "./collateral";

export interface Signers {
  owner: SignerWithAddress;
  admin: SignerWithAddress;
  pauser: SignerWithAddress;
  revenue: SignerWithAddress;
  emergency: SignerWithAddress;
  hedger: SignerWithAddress;
  user: SignerWithAddress;
}

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
    constants: Constants;
    constantsOwnable: ConstantsOwnable;
    hedgers: Hedgers;
    markets: Markets;
    marketsOwnable: MarketsOwnable;
    accounts: Accounts;
    accountsOwnable: AccountsOwnable;
    liquidations: Liquidations;
    closeMarket: CloseMarket;
    closePosition: ClosePosition;
    closePositionOwnable: ClosePositionOwnable;
    openMarketSingle: OpenMarketSingle;
    openPosition: OpenPosition;
    masterAgreement: MasterAgreement;
    oracle: Oracle;
    oracleOwnable: OracleOwnable;
    pauseOwnable: PauseOwnable;
    // Misc
    collateral: Collateral;
  }
}
