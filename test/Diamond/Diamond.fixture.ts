import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

import { Diamond } from "../../src/types";
import { FacetCutAction, FacetNames, getSelectors } from "../../tasks/deploy/utils";

export async function deployDiamondFixture(): Promise<Diamond> {
  const signers: SignerWithAddress[] = await ethers.getSigners();
  const owner: SignerWithAddress = signers[0];

  // Deploy DiamondCutFacet
  const DiamondCutFacetFactory = await ethers.getContractFactory("DiamondCutFacet");
  const diamondCutFacet = await DiamondCutFacetFactory.deploy();
  await diamondCutFacet.deployed();
  console.log("DiamondCutFacet deployed:", diamondCutFacet.address);

  // Deploy Diamond
  const DiamondFactory = await ethers.getContractFactory("Diamond");
  const diamond = await DiamondFactory.deploy(owner.address, diamondCutFacet.address);
  await diamond.deployed();
  console.log("Diamond deployed:", diamond.address);

  // Deploy DiamondInit
  const DiamondInit = await ethers.getContractFactory("DiamondInit");
  const diamondInit = await DiamondInit.deploy();
  await diamondInit.deployed();
  console.log("DiamondInit deployed:", diamondInit.address);

  // Deploy Facets
  const cut: Array<{
    facetAddress: string;
    action: FacetCutAction;
    functionSelectors: string[];
  }> = [];

  console.log("Deploying facets: ", FacetNames);
  for (const facetName of FacetNames) {
    const FacetFactory = await ethers.getContractFactory(facetName);
    const facet = await FacetFactory.deploy();
    await facet.deployed();
    console.log(`${facetName} deployed: ${facet.address}`);

    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet).selectors,
    });
  }

  // Upgrade Diamond with Facets
  const diamondCut = await ethers.getContractAt("IDiamondCut", diamond.address);

  // Call Initializer
  const call = diamondInit.interface.encodeFunctionData("init");
  const tx = await diamondCut.diamondCut(cut, diamondInit.address, call);
  const receipt = await tx.wait();

  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`);
  }

  console.log("Completed Diamond Cut");
  return diamond;
}
