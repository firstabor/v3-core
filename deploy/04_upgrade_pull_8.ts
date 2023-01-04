import { HardhatRuntimeEnvironment } from "hardhat/types";

import { DiamondCut } from "../src/types";
import { FacetCutAction, getSelectors } from "../src/utils/diamondCut";

const UPGRADE_NAME = "04_upgrade_pull_8";
const DIAMOND_ADDRESS = "0xfe2a4643a8DE03f7706980AA18B0f298B1561497";

const deploy = async function ({ deployments, getNamedAccounts, ethers }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Deploy new Liquidations / Positions / PositionsOwnable
  const Liquidations = await deploy("Liquidations", { from: deployer });
  const ClosePosition = await deploy("ClosePosition", { from: deployer });
  const ClosePositionOwnable = await deploy("ClosePositionOwnable", { from: deployer });

  console.log("Deployed: %o", {
    Liquidations: Liquidations.address,
    ClosePosition: ClosePosition.address,
    ClosePositionOwnable: ClosePositionOwnable.address,
  });

  const facetCuts: Array<{
    facetAddress: string;
    action: FacetCutAction;
    functionSelectors: string[];
  }> = [];

  // Replace ALL from Liquidations
  facetCuts.push({
    facetAddress: Liquidations.address,
    action: FacetCutAction.Replace,
    functionSelectors: getSelectors(await ethers.getContractAt("Liquidations", DIAMOND_ADDRESS)).selectors,
  });

  // Replace ALL from ClosePosition
  facetCuts.push({
    facetAddress: ClosePosition.address,
    action: FacetCutAction.Replace,
    functionSelectors: getSelectors(await ethers.getContractAt("ClosePosition", DIAMOND_ADDRESS)).selectors,
  });

  // Replace ALL from ClosePositionOwnable
  facetCuts.push({
    facetAddress: ClosePositionOwnable.address,
    action: FacetCutAction.Replace,
    functionSelectors: getSelectors(await ethers.getContractAt("ClosePositionOwnable", DIAMOND_ADDRESS)).selectors,
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
