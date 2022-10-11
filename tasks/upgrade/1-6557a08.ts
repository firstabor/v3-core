import { task } from "hardhat/config";

import { FacetCutAction, getSelectors } from "../utils/diamondCut";
import { readData, writeData } from "../utils/fs";
import { generateGasReport } from "../utils/gas";

const UPGRADE_NAME = "upgrade-1-6557a08";
const JSON_FILE_NAME = `${UPGRADE_NAME}.json`;
const DIAMOND_ADDRESS = "0xE7f6e42e3b9ea3B082B4595D0363Cb58a9D1AE84";

task(`verify:${UPGRADE_NAME}`, "Verifies the upgrade").setAction(async (_, { run }) => {
  const deployedAddresses = readData(JSON_FILE_NAME);

  for (const facet of deployedAddresses) {
    try {
      console.log(`Verifying ${facet.name} - ${facet.address}`);
      await run("verify:verify", {
        address: facet.address,
        constructorArguments: facet.constructorArguments,
      });
    } catch (err) {
      console.error(err);
    }
  }
});

task(UPGRADE_NAME, "Upgrade the Diamond according to commit 6557a08").setAction(async (_, { ethers, run }) => {
  const facetCuts: {
    facetAddress: string;
    action: FacetCutAction;
    functionSelectors: string[];
  }[] = [];

  // Deploy the new marketsFacet
  const MarketsFacetFactory = await ethers.getContractFactory("MarketsFacet");
  const marketsFacet = await MarketsFacetFactory.deploy();
  await marketsFacet.deployed();
  console.log("Deployed the marketsFacet at: ", marketsFacet.address);

  /**
   * Add the following functions:
   * - getMarketFromPositionId
   * - getMarketsFromPositionIds
   */
  const selectors = getSelectors(marketsFacet).get(["getMarketFromPositionId", "getMarketsFromPositionIds"]);
  facetCuts.push({
    facetAddress: marketsFacet.address,
    action: FacetCutAction.Add,
    functionSelectors: selectors,
  });

  // Get the DiamondCutFacet
  const diamondCutFacet = await ethers.getContractAt("DiamondCutFacet", DIAMOND_ADDRESS);

  // Cut the facets
  const tx = await diamondCutFacet.diamondCut(facetCuts, ethers.constants.AddressZero, "0x", { gasLimit: 8000000 });
  const receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`);
  }
  console.log("Diamond successfully upgraded: %o", receipt);

  // Generate a gas report
  await generateGasReport(ethers.provider, receipt.gasUsed);

  // Write the new facet addresses to a JSON file
  writeData(JSON_FILE_NAME, [
    {
      name: "MarketsFacet",
      address: marketsFacet.address,
      constructorArguments: [],
    },
  ]);
  console.log("Newly deployed addresses written to json file");
});
