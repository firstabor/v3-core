import { HardhatRuntimeEnvironment } from "hardhat/types";

import { DiamondCut } from "../src/types";
import { FacetCutAction, getSelectors } from "../src/utils/diamondCut";

const UPGRADE_NAME = "08_upgrade_pull_12";
// const DIAMOND_ADDRESS = "0xfe2a4643a8DE03f7706980AA18B0f298B1561497"; // FUSD
const DIAMOND_ADDRESS = "0x1570E893853897d806697F252300e32d99218fC2"; // DEI

const deploy = async function ({ deployments, getNamedAccounts, ethers }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Deploy new Markets
  const Markets = await deploy("Markets", { from: deployer });
  console.log("Deployed: %o", {
    Markets: Markets.address,
  });

  const facetCuts: Array<{
    facetAddress: string;
    action: FacetCutAction;
    functionSelectors: string[];
  }> = [];

  // Replace ALL from Markets
  facetCuts.push({
    facetAddress: Markets.address,
    action: FacetCutAction.Replace,
    functionSelectors: getSelectors(await ethers.getContractAt("Markets", DIAMOND_ADDRESS)).selectors,
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
