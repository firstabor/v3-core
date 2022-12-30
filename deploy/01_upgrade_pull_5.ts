import { HardhatRuntimeEnvironment } from "hardhat/types";

import { DiamondCut } from "../src/types";
import { FacetCutAction, getSelectors } from "../src/utils/diamondCut";

const UPGRADE_NAME = "01_upgrade_pull_5";
const DIAMOND_ADDRESS = "0xfe2a4643a8DE03f7706980AA18B0f298B1561497";

const deploy = async function ({ deployments, getNamedAccounts, ethers }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Deploy new Oracle / Liquidations / OracleOwnable
  const oracle = await deploy("Oracle", { from: deployer });
  const liquidations = await deploy("Liquidations", { from: deployer });
  const oracleOwnable = await deploy("OracleOwnable", { from: deployer });
  console.log("Deployed: %o", {
    oracle: oracle.address,
    liquidations: liquidations.address,
    oracleOwnable: oracleOwnable.address,
  });

  const oldLiquidations = await ethers.getContractAt(FORMER_LIQUIDATIONS_ABI, DIAMOND_ADDRESS);
  const oldOracle = await ethers.getContractAt(FORMER_ORACLE_ABI, DIAMOND_ADDRESS);
  const oldOracleOwnable = await ethers.getContractAt(FORMER_ORACLE_OWNABLE_ABI, DIAMOND_ADDRESS);
  const newLiquidations = await ethers.getContractAt("Liquidations", liquidations.address);
  const newOracle = await ethers.getContractAt("Oracle", oracle.address);
  const newOracleOwnable = await ethers.getContractAt("OracleOwnable", oracleOwnable.address);

  // Gather all applicable selectors
  const facetCuts: {
    facetAddress: string;
    action: FacetCutAction;
    functionSelectors: string[];
  }[] = [];

  // Remove ALL from oldLiquidations
  const removableLiquidationsSelectors = getSelectors(oldLiquidations).selectors;
  facetCuts.push({
    facetAddress: ethers.constants.AddressZero,
    action: FacetCutAction.Remove,
    functionSelectors: removableLiquidationsSelectors,
  });

  // Add ALL to newLiquidations
  const newLiquidationsSelectors = getSelectors(newLiquidations).selectors;
  facetCuts.push({
    facetAddress: newLiquidations.address,
    action: FacetCutAction.Add,
    functionSelectors: newLiquidationsSelectors,
  });

  // Remove ALL from oldOracle
  const removableOracleSelectors = getSelectors(oldOracle).selectors;
  facetCuts.push({
    facetAddress: ethers.constants.AddressZero,
    action: FacetCutAction.Remove,
    functionSelectors: removableOracleSelectors,
  });

  // Add ALL to newOracle
  const newOracleSelectors = getSelectors(newOracle).selectors;
  facetCuts.push({
    facetAddress: newOracle.address,
    action: FacetCutAction.Add,
    functionSelectors: newOracleSelectors,
  });

  // Remove ALL from oldOracleOwnable
  const removableOracleOwnableSelectors = getSelectors(oldOracleOwnable).selectors;
  facetCuts.push({
    facetAddress: ethers.constants.AddressZero,
    action: FacetCutAction.Remove,
    functionSelectors: removableOracleOwnableSelectors,
  });

  // Add ALL to newOracleOwnable
  const newOracleOwnableSelectors = getSelectors(newOracleOwnable).selectors;
  facetCuts.push({
    facetAddress: newOracleOwnable.address,
    action: FacetCutAction.Add,
    functionSelectors: newOracleOwnableSelectors,
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

const FORMER_LIQUIDATIONS_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "positionId", type: "uint256" },
      { indexed: false, internalType: "address", name: "partyA", type: "address" },
      { indexed: false, internalType: "address", name: "partyB", type: "address" },
      { indexed: false, internalType: "address", name: "targetParty", type: "address" },
      { indexed: false, internalType: "uint256", name: "amountUnits", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "priceUsd", type: "uint256" },
    ],
    name: "Liquidate",
    type: "event",
  },
  {
    inputs: [
      { internalType: "address", name: "partyA", type: "address" },
      { internalType: "uint256[]", name: "positionIds", type: "uint256[]" },
      { internalType: "uint256[]", name: "bidPrices", type: "uint256[]" },
      { internalType: "uint256[]", name: "askPrices", type: "uint256[]" },
      { internalType: "bytes", name: "reqId", type: "bytes" },
      {
        components: [
          { internalType: "uint256", name: "signature", type: "uint256" },
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "address", name: "nonce", type: "address" },
        ],
        internalType: "struct SchnorrSign",
        name: "sign",
        type: "tuple",
      },
      { internalType: "bytes", name: "gatewaySignature", type: "bytes" },
    ],
    name: "liquidatePartyCross",
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
      {
        components: [
          { internalType: "uint256", name: "signature", type: "uint256" },
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "address", name: "nonce", type: "address" },
        ],
        internalType: "struct SchnorrSign",
        name: "sign",
        type: "tuple",
      },
      { internalType: "bytes", name: "gatewaySignature", type: "bytes" },
    ],
    name: "liquidatePositionIsolated",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "party", type: "address" },
      { internalType: "int256", name: "uPnLCross", type: "int256" },
    ],
    name: "partyShouldBeLiquidatedCross",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "positionId", type: "uint256" },
      { internalType: "uint256", name: "bidPrice", type: "uint256" },
      { internalType: "uint256", name: "askPrice", type: "uint256" },
    ],
    name: "positionShouldBeLiquidatedIsolated",
    outputs: [
      { internalType: "bool", name: "shouldBeLiquidated", type: "bool" },
      { internalType: "int256", name: "uPnLA", type: "int256" },
      { internalType: "int256", name: "uPnLB", type: "int256" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const FORMER_ORACLE_ABI = [
  {
    inputs: [],
    name: "getMuonAppCID",
    outputs: [{ internalType: "bytes", name: "", type: "bytes" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMuonAppId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMuonGatewaySigner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMuonPublicKey",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "x", type: "uint256" },
          { internalType: "uint8", name: "parity", type: "uint8" },
        ],
        internalType: "struct PublicKey",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "positionId", type: "uint256" },
      { internalType: "uint256", name: "bidPrice", type: "uint256" },
      { internalType: "uint256", name: "askPrice", type: "uint256" },
      { internalType: "bytes", name: "reqId", type: "bytes" },
      {
        components: [
          { internalType: "uint256", name: "signature", type: "uint256" },
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "address", name: "nonce", type: "address" },
        ],
        internalType: "struct SchnorrSign",
        name: "sign",
        type: "tuple",
      },
      { internalType: "bytes", name: "gatewaySignature", type: "bytes" },
    ],
    name: "verifyPositionPriceOrThrow",
    outputs: [],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256[]", name: "positionIds", type: "uint256[]" },
      { internalType: "uint256[]", name: "bidPrices", type: "uint256[]" },
      { internalType: "uint256[]", name: "askPrices", type: "uint256[]" },
      { internalType: "bytes", name: "reqId", type: "bytes" },
      {
        components: [
          { internalType: "uint256", name: "signature", type: "uint256" },
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "address", name: "nonce", type: "address" },
        ],
        internalType: "struct SchnorrSign",
        name: "sign",
        type: "tuple",
      },
      { internalType: "bytes", name: "gatewaySignature", type: "bytes" },
    ],
    name: "verifyPositionPricesOrThrow",
    outputs: [],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "hash", type: "bytes32" },
      {
        components: [
          { internalType: "uint256", name: "signature", type: "uint256" },
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "address", name: "nonce", type: "address" },
        ],
        internalType: "struct SchnorrSign",
        name: "sign",
        type: "tuple",
      },
      { internalType: "bytes", name: "gatewaySignature", type: "bytes" },
    ],
    name: "verifyTSSAndGatewayOrThrow",
    outputs: [],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "data", type: "string" },
      { internalType: "bytes", name: "reqId", type: "bytes" },
      {
        components: [
          { internalType: "uint256", name: "signature", type: "uint256" },
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "address", name: "nonce", type: "address" },
        ],
        internalType: "struct SchnorrSign",
        name: "sign",
        type: "tuple",
      },
    ],
    name: "verifyTSSOrThrow",
    outputs: [],
    stateMutability: "view",
    type: "function",
  },
];

const FORMER_ORACLE_OWNABLE_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
      { indexed: true, internalType: "bytes32", name: "previousAdminRole", type: "bytes32" },
      { indexed: true, internalType: "bytes32", name: "newAdminRole", type: "bytes32" },
    ],
    name: "RoleAdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
      { indexed: true, internalType: "address", name: "account", type: "address" },
      { indexed: true, internalType: "address", name: "sender", type: "address" },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
      { indexed: true, internalType: "address", name: "account", type: "address" },
      { indexed: true, internalType: "address", name: "sender", type: "address" },
    ],
    name: "RoleRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "bytes", name: "oldCID", type: "bytes" },
      { indexed: false, internalType: "bytes", name: "newCID", type: "bytes" },
    ],
    name: "SetMuonAppCID",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "oldId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newId", type: "uint256" },
    ],
    name: "SetMuonAppId",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "address", name: "oldSigner", type: "address" },
      { indexed: false, internalType: "address", name: "newSigner", type: "address" },
    ],
    name: "SetMuonGatewaySigner",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "oldX", type: "uint256" },
      { indexed: false, internalType: "uint8", name: "oldParity", type: "uint8" },
      { indexed: false, internalType: "uint256", name: "newX", type: "uint256" },
      { indexed: false, internalType: "uint8", name: "newParity", type: "uint8" },
    ],
    name: "SetMuonPublicKey",
    type: "event",
  },
  {
    inputs: [{ internalType: "bytes", name: "muonAppCID", type: "bytes" }],
    name: "setMuonAppCID",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "muonAppId", type: "uint256" }],
    name: "setMuonAppId",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "muonGatewaySigner", type: "address" }],
    name: "setMuonGatewaySigner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "x", type: "uint256" },
      { internalType: "uint8", name: "parity", type: "uint8" },
    ],
    name: "setMuonPublicKey",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
