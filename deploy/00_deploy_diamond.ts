import { HardhatRuntimeEnvironment } from "hardhat/types";

import { coreFacetNames, appFacetNames } from "../src/config/constants";
import { FacetCutAction, getSelectors } from "../src/utils/diamondCut";

const deploy = async function ({ deployments, getNamedAccounts, ethers }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Deploy CoreFacets -> DiamondCut / DiamondLoupe / ERC165 / Ownable
  if (
    coreFacetNames[0] !== "DiamondCut" ||
    coreFacetNames[1] !== "DiamondLoupe" ||
    coreFacetNames[2] !== "ERC165" ||
    coreFacetNames[3] !== "Ownable"
  ) {
    throw new Error("CoreFacets are not properly defined");
  }

  const coreFacets: string[] = [];
  for (let i = 0; i < coreFacetNames.length; i++) {
    const name = coreFacetNames[i];
    const facet = await deploy(name, { from: deployer });
    console.log(`Core:${name} deployed: ${facet.address}`);
    coreFacets.push(facet.address);
  }

  // Deploy DiamondInit
  const DiamondInitFactory = await ethers.getContractFactory("DiamondInit");
  const diamondInit = await DiamondInitFactory.deploy();
  await diamondInit.deployed();
  await diamondInit.deployTransaction.wait();
  console.log(`Init:DiamondInit deployed: ${diamondInit.address}`);

  // Deploy AppFacets
  const appFacets: Array<{
    facetAddress: string;
    action: FacetCutAction;
    functionSelectors: string[];
  }> = [];

  for (let i = 0; i < appFacetNames.length; i++) {
    const name = appFacetNames[i];
    const factory = await ethers.getContractFactory(name);
    const facet = await deploy(name, { from: deployer });
    console.log(`App:${name} deployed: ${facet.address}`);
    appFacets.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(factory).selectors,
    });
  }

  console.log("Done deploying facets");

  // Deploy Diamond
  const diamond = await deploy("Diamond", {
    from: deployer,
    args: [
      deployer,
      coreFacets,
      appFacets,
      [
        {
          initContract: diamondInit.address,
          initData: diamondInit.interface.encodeFunctionData("init", undefined),
        },
      ],
    ],
  });

  console.log("Diamond deployed:", diamond.address);
};

export default deploy;
deploy.tags = ["Diamond"];
