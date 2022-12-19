import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import {
  AccessControl,
  AccessControlAdmin,
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
import { MASTER_AGREEMENT } from "./constants";
import { shouldBehaveLikeDiamond } from "./Diamond/Diamond.behavior";
import { deployDiamondFixture } from "./Diamond/Diamond.fixture";
import { shouldBehaveLikeHedgerERC2771 } from "./HedgerERC2771/HedgerERC2771.behavior";
import { Signers } from "./types";

describe("Unit Test", function () {
  before(async function () {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers = {} as Signers;
    this.signers.owner = signers[0];
    this.signers.admin = signers[1];
    this.signers.signer = signers[2];
    this.signers.user = signers[3];

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
    this.hedgerERC2771 = (await ethers.getContractAt("HedgerERC2771", diamond.address)) as HedgerERC2771;
    this.hedgerOwnable = (await ethers.getContractAt("HedgerOwnable", diamond.address)) as HedgerOwnable;
    this.erc2771Context = (await ethers.getContractAt("ERC2771Context", diamond.address)) as ERC2771Context;
    this.erc2771ContextOwnable = (await ethers.getContractAt(
      "ERC2771ContextOwnable",
      diamond.address,
    )) as ERC2771ContextOwnable;

    // Config
    this.masterAgreement = (await ethers.getContractAt("IMasterAgreement", MASTER_AGREEMENT)) as IMasterAgreement;
    this.collateral = await this.hedgerOwnable.getCollateral(MASTER_AGREEMENT);
    this.trustedForwarder = await this.erc2771Context.trustedForwarder();
  });

  before(async function () {
    // Setup roles
    await this.accessControlAdmin.connect(this.signers.owner).grantAdminRole(this.signers.admin.address);
    await this.accessControlAdmin.connect(this.signers.admin).grantSignerRole(this.signers.signer.address);
  });

  describe("Diamond", function () {
    shouldBehaveLikeDiamond();
  });

  describe("HedgerERC2771", function () {
    shouldBehaveLikeHedgerERC2771();
  });
});
