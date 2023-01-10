import { HardhatRuntimeEnvironment } from "hardhat/types";

import { DiamondCut } from "../src/types";
import { FacetCutAction, getSelectors } from "../src/utils/diamondCut";

const UPGRADE_NAME = "05_upgrade_pull_9";
// const DIAMOND_ADDRESS = "0xfe2a4643a8DE03f7706980AA18B0f298B1561497"; // FUSD
const DIAMOND_ADDRESS = "0x1570E893853897d806697F252300e32d99218fC2"; // DEI

const deploy = async function ({ deployments, getNamedAccounts, ethers }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Deploy new OpenPosition
  const OpenPosition = await deploy("OpenPosition", { from: deployer });
  console.log("Deployed: %o", {
    Liquidations: OpenPosition.address,
  });

  const facetCuts: Array<{
    facetAddress: string;
    action: FacetCutAction;
    functionSelectors: string[];
  }> = [];

  // Remove openPostion() from OpenPosition
  facetCuts.push({
    facetAddress: ethers.constants.AddressZero,
    action: FacetCutAction.Remove,
    functionSelectors: ["0x5273a73e"],
  });

  // Add the new openPostion() to OpenPosition
  const factory = await ethers.getContractAt("OpenPosition", OpenPosition.address);
  facetCuts.push({
    facetAddress: OpenPosition.address,
    action: FacetCutAction.Add,
    functionSelectors: getSelectors(factory).get(["openPosition"]),
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
