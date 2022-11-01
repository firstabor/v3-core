import { task } from "hardhat/config";

import { FacetCutAction, getSelectors } from "../utils/diamondCut";
import { readData, writeData } from "../utils/fs";
import { generateGasReport } from "../utils/gas";

const UPGRADE_NAME = "upgrade-2";
const JSON_FILE_NAME = `${UPGRADE_NAME}.json`;
const DIAMOND_ADDRESS = "0xF78B5C36b37CF03fB30E1C5fE0eD75002B93a466";

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

task(UPGRADE_NAME, "Upgrade the Diamond according to commit 2").setAction(async (_, { ethers, run }) => {
  const facetCuts: {
    facetAddress: string;
    action: FacetCutAction;
    functionSelectors: string[];
  }[] = [];

  // Deploy the new OpenMarketSingleFacet
  const OpenMarketSingleFacetFactory = await ethers.getContractFactory("OpenMarketSingleFacet");
  const facet = await OpenMarketSingleFacetFactory.deploy();
  await facet.deployed();
  console.log("Deployed the OpenMarketSingleFacet at: ", facet.address);

  const selectors = getSelectors(facet).get(["requestOpenMarketSingle"]);
  facetCuts.push({
    facetAddress: facet.address,
    action: FacetCutAction.Replace,
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
      name: "OpenMarketSingleFacet",
      address: facet.address,
      constructorArguments: [],
    },
  ]);
  console.log("Newly deployed addresses written to json file");

  await run("verify:upgrade-2");
});
