import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

import {
  /* Core */
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
import { shouldBehaveLikeAccounts } from "./Accounts/Accounts.behavior";
import { shouldBehaveLikeDiamond } from "./Diamond/Diamond.behavior";
import { deployDiamondFixture } from "./Diamond/Diamond.fixture";
import { shouldBehaveLikeHedgers } from "./Hedgers/Hedgers.behavior";
import { Collateral, CollateralABI } from "./collateral";
import { Signers } from "./types";

describe("Unit Test", function () {
  before(async function () {
    const signers: SignerWithAddress[] = await ethers.getSigners();

    this.signers = {} as Signers;
    this.signers.owner = signers[0];
    this.signers.admin = signers[1];
    this.signers.pauser = signers[2];
    this.signers.revenue = signers[3];
    this.signers.emergency = signers[4];
    this.signers.hedger = signers[5];
    this.signers.user = signers[6];

    const diamond = await deployDiamondFixture();
    this.diamond = diamond;

    // Core
    this.diamondCut = (await ethers.getContractAt("DiamondCut", diamond.address)) as DiamondCut;
    this.diamondLoupe = (await ethers.getContractAt("DiamondLoupe", diamond.address)) as DiamondLoupe;
    this.erc165 = (await ethers.getContractAt("ERC165", diamond.address)) as ERC165;
    this.ownable = (await ethers.getContractAt("Ownable", diamond.address)) as Ownable;

    // App
    this.accessControl = (await ethers.getContractAt("AccessControl", diamond.address)) as AccessControl;
    this.accessControlAdmin = (await ethers.getContractAt("AccessControlAdmin", diamond.address)) as AccessControlAdmin;
    this.constants = (await ethers.getContractAt("Constants", diamond.address)) as Constants;
    this.constantsOwnable = (await ethers.getContractAt("ConstantsOwnable", diamond.address)) as ConstantsOwnable;
    this.hedgers = (await ethers.getContractAt("Hedgers", diamond.address)) as Hedgers;
    this.markets = (await ethers.getContractAt("Markets", diamond.address)) as Markets;
    this.marketsOwnable = (await ethers.getContractAt("MarketsOwnable", diamond.address)) as MarketsOwnable;
    this.accounts = (await ethers.getContractAt("Accounts", diamond.address)) as Accounts;
    this.accountsOwnable = (await ethers.getContractAt("AccountsOwnable", diamond.address)) as AccountsOwnable;
    this.liquidations = (await ethers.getContractAt("Liquidations", diamond.address)) as Liquidations;
    this.closeMarket = (await ethers.getContractAt("CloseMarket", diamond.address)) as CloseMarket;
    this.closePosition = (await ethers.getContractAt("ClosePosition", diamond.address)) as ClosePosition;
    this.closePositionOwnable = (await ethers.getContractAt(
      "ClosePositionOwnable",
      diamond.address,
    )) as ClosePositionOwnable;
    this.openMarketSingle = (await ethers.getContractAt("OpenMarketSingle", diamond.address)) as OpenMarketSingle;
    this.openPosition = (await ethers.getContractAt("OpenPosition", diamond.address)) as OpenPosition;
    this.masterAgreement = (await ethers.getContractAt("MasterAgreement", diamond.address)) as MasterAgreement;
    this.oracle = (await ethers.getContractAt("Oracle", diamond.address)) as Oracle;
    this.oracleOwnable = (await ethers.getContractAt("OracleOwnable", diamond.address)) as OracleOwnable;
    this.pauseOwnable = (await ethers.getContractAt("PauseOwnable", diamond.address)) as PauseOwnable;

    // Misc
    this.collateral = (await ethers.getContractAt(
      CollateralABI,
      await this.constants.getCollateral(),
    )) as unknown as Collateral;
  });

  before(async function () {
    // Setup roles
    await this.accessControlAdmin.connect(this.signers.owner).grantAdminRole(this.signers.admin.address);
    await this.accessControlAdmin.connect(this.signers.admin).grantEmergencyRole(this.signers.emergency.address);
    await this.accessControlAdmin.connect(this.signers.admin).grantPauserRole(this.signers.pauser.address);
    await this.accessControlAdmin.connect(this.signers.admin).grantRevenueRole(this.signers.revenue.address);
  });

  describe("Diamond", function () {
    shouldBehaveLikeDiamond();
  });

  describe("Hedgers", function () {
    shouldBehaveLikeHedgers();
  });

  describe("Accounts", function () {
    shouldBehaveLikeAccounts();
  });
});
