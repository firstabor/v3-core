import { HardhatRuntimeEnvironment } from "hardhat/types";

import { DiamondCut } from "../src/types";
import { FacetCutAction } from "../src/utils/diamondCut";

const UPGRADE_NAME = "02_upgrade_pull_6";
const DIAMOND_ADDRESS = "0xfe2a4643a8DE03f7706980AA18B0f298B1561497";

const deploy = async function ({ deployments, getNamedAccounts, ethers }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Deploy new AccountsOwnable
  const accountsOwnable = await deploy("AccountsOwnable", { from: deployer });
  console.log("Deployed: %o", {
    accountsOwnable: accountsOwnable.address,
  });

  // Gather all applicable selectors
  const facetCuts: {
    facetAddress: string;
    action: FacetCutAction;
    functionSelectors: string[];
  }[] = [];

  // Replace collectFees() in accountsOwnable
  facetCuts.push({
    facetAddress: accountsOwnable.address,
    action: FacetCutAction.Replace,
    functionSelectors: ["0xc8796572"],
  });

  // Get the DiamondCut
  const diamondCut = (await ethers.getContractAt("DiamondCut", DIAMOND_ADDRESS)) as DiamondCut;

  // Cut the facets
  const tx = await diamondCut.diamondCut(facetCuts, ethers.constants.AddressZero, "0x", {
    from: deployer,
    gasLimit: 8000000,
  });

  const receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`);
  }
  console.log("Diamond successfully upgraded: %o", receipt);
};

export default deploy;
deploy.tags = [UPGRADE_NAME];
