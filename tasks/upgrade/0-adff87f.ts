import { task } from "hardhat/config";

import { FacetCutAction, getSelectors } from "../utils/diamondCut";
import { readData, writeData } from "../utils/fs";
import { generateGasReport } from "../utils/gas";

const UPGRADE_NAME = "upgrade-0-adff87f";
const JSON_FILE_NAME = `${UPGRADE_NAME}.json`;
const DIAMOND_ADDRESS = "0xE7f6e42e3b9ea3B082B4595D0363Cb58a9D1AE84";

const FORMER_ACCOUNT_FACET_ADDRESS = "0xdA2aE15A20d72e9db670A2c64AbC2B6934975828";
const FORMER_ACCOUNT_FACET_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256[]", name: "positionIds", type: "uint256[]" },
      { internalType: "uint256[]", name: "bidPrices", type: "uint256[]" },
      { internalType: "uint256[]", name: "askPrices", type: "uint256[]" },
    ],
    name: "dangerouslyRemoveLockedMargin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

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

task(UPGRADE_NAME, "Upgrade the Diamond according to commit adff87f").setAction(async (_, { ethers, run }) => {
  const facetCuts: {
    facetAddress: string;
    action: FacetCutAction;
    functionSelectors: string[];
  }[] = [];

  // Deploy the new liquidationFacet
  const LiquidationFacetFactory = await ethers.getContractFactory("LiquidationFacet");
  const liquidationFacet = await LiquidationFacetFactory.deploy();
  await liquidationFacet.deployed();
  console.log("Deployed the liquidationFacet at: ", liquidationFacet.address);

  // Replace the `liquidatePartyCross` function
  const liquidateSelectors = getSelectors(liquidationFacet).get(["liquidatePartyCross"]);
  facetCuts.push({
    facetAddress: liquidationFacet.address,
    action: FacetCutAction.Replace,
    functionSelectors: liquidateSelectors,
  });

  // Deploy the new accountFacet
  const AccountFacetFactory = await ethers.getContractFactory("AccountFacet");
  const accountFacet = await AccountFacetFactory.deploy();
  await accountFacet.deployed();
  console.log("Deployed the accountFacet at: ", accountFacet.address);

  // Add the `removeFreeMargin` function
  const accountSelectors = getSelectors(accountFacet).get(["removeFreeMargin"]);
  facetCuts.push({
    facetAddress: accountFacet.address,
    action: FacetCutAction.Add,
    functionSelectors: accountSelectors,
  });

  // Remove the `dangerouslyRemoveLockedMargin` function from the former AccountFacet
  const formerAccountFacet = await ethers.getContractAt(FORMER_ACCOUNT_FACET_ABI, FORMER_ACCOUNT_FACET_ADDRESS);
  const removableSelectors = getSelectors(formerAccountFacet).get(["dangerouslyRemoveLockedMargin"]);
  facetCuts.push({
    facetAddress: ethers.constants.AddressZero,
    action: FacetCutAction.Remove,
    functionSelectors: removableSelectors,
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
      name: "LiquidationFacet",
      address: liquidationFacet.address,
      constructorArguments: [],
    },
    {
      name: "AccountFacet",
      address: accountFacet.address,
      constructorArguments: [],
    },
  ]);
  console.log("Newly deployed addresses written to json file");
});
