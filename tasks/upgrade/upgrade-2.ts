import { task } from "hardhat/config";

import { FacetCutAction, getSelectors } from "../utils/diamondCut";
import { readData, writeData } from "../utils/fs";
import { generateGasReport } from "../utils/gas";

const UPGRADE_NAME = "upgrade-2";
const JSON_FILE_NAME = `${UPGRADE_NAME}.json`;
const DIAMOND_ADDRESS = "0x212e1A33350a85c4bdB2607C47E041a65bD14361";

const FORMER_CONSTANTS_ADDRESS = "0x4f4990c9f259c9b15d6065ba2eb24f1476697778";
const FORMER_LIQUIDATION_ADDRESS = "0xd1540b173a478290887044c303c9d5d630dcf1f5";
const FORMER_ABI = [
  {
    inputs: [],
    name: "getMuon",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_muon", type: "address" }],
    name: "setMuon",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getMuonAppId",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "_muonAppId", type: "bytes32" }],
    name: "setMuonAppId",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getMinimumRequiredSignatures",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint8", name: "_minimumRequiredSignatures", type: "uint8" }],
    name: "setMinimumRequiredSignatures",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "positionId", type: "uint256" },
      { internalType: "uint256", name: "bidPrice", type: "uint256" },
      { internalType: "uint256", name: "askPrice", type: "uint256" },
      { internalType: "bytes", name: "reqId", type: "bytes" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      {
        components: [
          { internalType: "uint256", name: "signature", type: "uint256" },
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "address", name: "nonce", type: "address" },
        ],
        internalType: "struct SchnorrSign[]",
        name: "sigs",
        type: "tuple[]",
      },
    ],
    name: "liquidatePositionIsolated",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "partyA", type: "address" },
      { internalType: "uint256[]", name: "positionIds", type: "uint256[]" },
      { internalType: "uint256[]", name: "bidPrices", type: "uint256[]" },
      { internalType: "uint256[]", name: "askPrices", type: "uint256[]" },
      { internalType: "bytes", name: "reqId", type: "bytes" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      {
        components: [
          { internalType: "uint256", name: "signature", type: "uint256" },
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "address", name: "nonce", type: "address" },
        ],
        internalType: "struct SchnorrSign[]",
        name: "sigs",
        type: "tuple[]",
      },
    ],
    name: "liquidatePartyCross",
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

task(UPGRADE_NAME, "Upgrade the Diamond").setAction(async (_, { ethers, run }) => {
  const facetCuts: {
    facetAddress: string;
    action: FacetCutAction;
    functionSelectors: string[];
  }[] = [];

  // Deploy the new ConstantsFacet
  const ConstantsFacetFactory = await ethers.getContractFactory("ConstantsFacet");
  const constantsFacet = await ConstantsFacetFactory.deploy();
  await constantsFacet.deployed();
  console.log("Deployed the ConstantsFacet at: ", constantsFacet.address);

  // Deploy the new LiquidationFacet
  const LiquidationFacetFactory = await ethers.getContractFactory("LiquidationFacet");
  const liquidationFacet = await LiquidationFacetFactory.deploy();
  await liquidationFacet.deployed();
  console.log("Deployed the LiquidationFacet at: ", liquidationFacet.address);

  // Deploy the new OracleFacet
  const OracleFacetFactory = await ethers.getContractFactory("OracleFacet");
  const oracleFacet = await OracleFacetFactory.deploy();
  await oracleFacet.deployed();
  console.log("Deployed the OracleFacet at: ", oracleFacet.address);

  const formerConstantsFacet = await ethers.getContractAt(FORMER_ABI, FORMER_CONSTANTS_ADDRESS);
  facetCuts.push({
    facetAddress: ethers.constants.AddressZero,
    action: FacetCutAction.Remove,
    functionSelectors: getSelectors(formerConstantsFacet).get([
      "getMuon",
      "getMuonAppId",
      "getMinimumRequiredSignatures",
      "setMuon",
      "setMuonAppId",
      "setMinimumRequiredSignatures",
    ]),
  });

  facetCuts.push({
    facetAddress: constantsFacet.address,
    action: FacetCutAction.Add,
    functionSelectors: getSelectors(constantsFacet).get([
      "getMuonAppId",
      "getMuonPublicKey",
      "getMuonGatewaySigner",
      "setMuonAppId",
      "setMuonPublicKey",
      "setMuonGatewaySigner",
    ]),
  });

  const formerLiquidationFacet = await ethers.getContractAt(FORMER_ABI, FORMER_LIQUIDATION_ADDRESS);
  facetCuts.push({
    facetAddress: ethers.constants.AddressZero,
    action: FacetCutAction.Remove,
    functionSelectors: getSelectors(formerLiquidationFacet).get(["liquidatePositionIsolated", "liquidatePartyCross"]),
  });

  facetCuts.push({
    facetAddress: liquidationFacet.address,
    action: FacetCutAction.Add,
    functionSelectors: getSelectors(liquidationFacet).get(["liquidatePositionIsolated", "liquidatePartyCross"]),
  });

  facetCuts.push({
    facetAddress: oracleFacet.address,
    action: FacetCutAction.Add,
    functionSelectors: getSelectors(oracleFacet).get([
      "verifyTSSOrThrow",
      "verifyPositionPriceOrThrow",
      "verifyPositionPricesOrThrow",
    ]),
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
      name: "ConstantsFacet",
      address: constantsFacet.address,
      constructorArguments: [],
    },
    {
      name: "LiquidationFacet",
      address: liquidationFacet.address,
      constructorArguments: [],
    },
    {
      name: "OracleFacet",
      address: oracleFacet.address,
      constructorArguments: [],
    },
  ]);
  console.log("Newly deployed addresses written to json file");
});
