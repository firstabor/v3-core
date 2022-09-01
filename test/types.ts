import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import type {
  ICollateral,
  Diamond,
  DiamondLoupeFacet,
  DiamondCutFacet,
  OwnershipFacet,
  AccountFacet,
  MarketsFacet,
  HedgersFacet,
  MasterFacet,
  OpenMarketSingleFacet,
  CloseMarketSingleFacet,
  LiquidationFacet,
} from "../src/types";

type Fixture<T> = () => Promise<T>;

declare module "mocha" {
  export interface Context {
    signers: Signers;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    // Misc
    collateral: ICollateral;
    // Diamond Facets
    diamond: Diamond;
    diamondLoupeFacet: DiamondLoupeFacet;
    diamondCutFacet: DiamondCutFacet;
    ownershipFacet: OwnershipFacet;
    accountFacet: AccountFacet;
    hedgersFacet: HedgersFacet;
    marketsFacet: MarketsFacet;
    liquidationFacet: LiquidationFacet;
    masterFacet: MasterFacet;
    openMarketSingleFacet: OpenMarketSingleFacet;
    closeMarketSingleFacet: CloseMarketSingleFacet;
  }
}

export interface Signers {
  admin: SignerWithAddress;
  user: SignerWithAddress;
  hedger: SignerWithAddress;
}

export enum MarketType {
  FOREX,
  CRYPTO,
  STOCK,
}

export enum TradingSession {
  _24_7,
  _24_5,
}

export enum Side {
  BUY,
  SELL,
}
