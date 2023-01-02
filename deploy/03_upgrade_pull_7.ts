import { HardhatRuntimeEnvironment } from "hardhat/types";

import { DiamondCut } from "../src/types";
import { FacetCutAction, getSelectors } from "../src/utils/diamondCut";

const UPGRADE_NAME = "03_upgrade_pull_7";
const DIAMOND_ADDRESS = "0xfe2a4643a8DE03f7706980AA18B0f298B1561497";

const deploy = async function ({ deployments, getNamedAccounts, ethers }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Deploy new Liquidations
  const liquidations = await deploy("Liquidations", { from: deployer });
  console.log("Deployed: %o", {
    liquidations: liquidations.address,
  });

  // Replace ALL from Liquidations
  const facetCuts = [
    {
      facetAddress: liquidations.address,
      action: FacetCutAction.Replace,
      functionSelectors: getSelectors(await ethers.getContractAt("Liquidations", DIAMOND_ADDRESS)).selectors,
    },
  ];

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
