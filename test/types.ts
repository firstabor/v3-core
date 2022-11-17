import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import type {
  ICollateral,
  Diamond,
  DiamondLoupeFacet,
  DiamondCutFacet,
  ConstantsFacet,
  OwnershipFacet,
  AccountFacet,
  MarketsFacet,
  HedgersFacet,
  MasterFacet,
  OpenMarketSingleFacet,
  CloseMarketFacet,
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
    constantsFacet: ConstantsFacet;
    ownershipFacet: OwnershipFacet;
    accountFacet: AccountFacet;
    hedgersFacet: HedgersFacet;
    marketsFacet: MarketsFacet;
    liquidationFacet: LiquidationFacet;
    masterFacet: MasterFacet;
    openMarketSingleFacet: OpenMarketSingleFacet;
    closeMarketFacet: CloseMarketFacet;
  }
}

export interface Signers {
  admin: SignerWithAddress;
  user: SignerWithAddress;
  hedger: SignerWithAddress;
}

export enum MarketType {
  FOREX,
  METALS,
  ENERGIES,
  INDICES,
  STOCKS,
  COMMODITIES,
  BONDS,
  ETFS,
  CRYPTO,
}

export enum Side {
  BUY,
  SELL,
}

export enum OrderType {
  LIMIT,
  MARKET,
}

export enum PositionType {
  ISOLATED,
  CROSS,
}
