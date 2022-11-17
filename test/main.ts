import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

import { shouldBehaveLikeAccountFacet } from "./AccountFacet/AccountFacet.behavior";
import { shouldBehaveLikeCloseMarketFacet } from "./CloseMarketFacet/CloseMarketFacet.behavior";
import { shouldBehaveLikeDiamond } from "./Diamond/Diamond.behavior";
import { deployDiamondFixture } from "./Diamond/Diamond.fixture";
import { shouldBehaveLikeHedgersFacet } from "./HedgersFacet/HedgersFacet.behavior";
import { shouldBehaveLikeLiquidationFacet } from "./LiquidationFacet/LiquidationFacet.behavior";
import { shouldBehaveLikeMarketsFacet } from "./MarketsFacet/MarketsFacet.behavior";
import { shouldBehaveLikeMasterFacet } from "./MasterFacet/MasterFacet.behavior";
import { shouldBehaveLikeOpenMarketSingleFacet } from "./OpenMarketSingleFacet/OpenMarketSingleFacet.behavior";
import type { Signers } from "./types";

describe("Unit Test", function () {
  before(async function () {
    this.signers = {} as Signers;
    this.loadFixture = loadFixture;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.user = signers[1];
    this.signers.hedger = signers[2];

    const { diamond, collateral } = await this.loadFixture(deployDiamondFixture);
    this.collateral = collateral;
    this.diamond = diamond;

    // Facets
    this.diamondCutFacet = await ethers.getContractAt("DiamondCutFacet", diamond.address);
    this.diamondLoupeFacet = await ethers.getContractAt("DiamondLoupeFacet", diamond.address);
    this.constantsFacet = await ethers.getContractAt("ConstantsFacet", diamond.address);
    this.ownershipFacet = await ethers.getContractAt("OwnershipFacet", diamond.address);
    this.accountFacet = await ethers.getContractAt("AccountFacet", diamond.address);
    this.hedgersFacet = await ethers.getContractAt("HedgersFacet", diamond.address);
    this.marketsFacet = await ethers.getContractAt("MarketsFacet", diamond.address);
    this.liquidationFacet = await ethers.getContractAt("LiquidationFacet", diamond.address);
    this.masterFacet = await ethers.getContractAt("MasterFacet", diamond.address);
    this.openMarketSingleFacet = await ethers.getContractAt("OpenMarketSingleFacet", diamond.address);
    this.closeMarketFacet = await ethers.getContractAt("CloseMarketFacet", diamond.address);
  });

  describe("Diamond", function () {
    shouldBehaveLikeDiamond();
  });

  describe("AccountFacet", function () {
    shouldBehaveLikeAccountFacet();
  });

  describe("MarketsFacet", function () {
    shouldBehaveLikeMarketsFacet();
  });

  describe("HedgersFacet", function () {
    shouldBehaveLikeHedgersFacet();
  });

  describe("OpenMarketSingleFacet", function () {
    shouldBehaveLikeOpenMarketSingleFacet();
  });

  describe("MasterFacet", function () {
    shouldBehaveLikeMasterFacet();
  });

  describe("CloseMarketFacet", function () {
    shouldBehaveLikeCloseMarketFacet();
  });

  describe("LiquidationFacet", function () {
    shouldBehaveLikeLiquidationFacet();
  });
});
