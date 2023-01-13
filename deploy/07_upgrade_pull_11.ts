import { HardhatRuntimeEnvironment } from "hardhat/types";

import { DiamondCut } from "../src/types";
import { FacetCutAction, getSelectors } from "../src/utils/diamondCut";

const UPGRADE_NAME = "07_upgrade_pull_11";
// const DIAMOND_ADDRESS = "0xfe2a4643a8DE03f7706980AA18B0f298B1561497"; // FUSD
const DIAMOND_ADDRESS = "0x1570E893853897d806697F252300e32d99218fC2"; // DEI

const deploy = async function ({ deployments, getNamedAccounts, ethers }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Deploy new MarketsOwnable
  const MarketsOwnable = await deploy("MarketsOwnable", { from: deployer });
  console.log("Deployed: %o", {
    MarketsOwnable: MarketsOwnable.address,
  });

  const facetCuts: Array<{
    facetAddress: string;
    action: FacetCutAction;
    functionSelectors: string[];
  }> = [];

  // Get old MarketsOwnable
  const oldMarketsOwnable = await ethers.getContractAt(FORMER_MARKETS_OWNABLE_ABI, DIAMOND_ADDRESS);

  // Remove ALL from oldMarketsOwnable
  facetCuts.push({
    facetAddress: ethers.constants.AddressZero,
    action: FacetCutAction.Remove,
    functionSelectors: getSelectors(oldMarketsOwnable).selectors,
  });

  // Add ALL from new MarketsOwnable
  facetCuts.push({
    facetAddress: MarketsOwnable.address,
    action: FacetCutAction.Add,
    functionSelectors: getSelectors(await ethers.getContractAt("MarketsOwnable", DIAMOND_ADDRESS)).selectors,
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

const FORMER_MARKETS_OWNABLE_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "marketId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "CreateMarket",
    type: "event",
  },
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
      { indexed: true, internalType: "uint256", name: "marketId", type: "uint256" },
      { indexed: false, internalType: "bool", name: "oldStatus", type: "bool" },
      { indexed: false, internalType: "bool", name: "newStatus", type: "bool" },
    ],
    name: "UpdateMarketActive",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "marketId", type: "uint256" },
      { indexed: false, internalType: "bytes32", name: "oldFundingRateId", type: "bytes32" },
      { indexed: false, internalType: "bytes32", name: "newFundingRateId", type: "bytes32" },
    ],
    name: "UpdateMarketFundingRateId",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "marketId", type: "uint256" },
      { indexed: false, internalType: "string", name: "oldIdentifier", type: "string" },
      { indexed: false, internalType: "string", name: "newIdentifier", type: "string" },
    ],
    name: "UpdateMarketIdentifier",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "marketId", type: "uint256" },
      { indexed: false, internalType: "bytes32", name: "oldMuonPriceFeedId", type: "bytes32" },
      { indexed: false, internalType: "bytes32", name: "newMuonPriceFeedId", type: "bytes32" },
    ],
    name: "UpdateMarketMuonPriceFeedId",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "marketId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "oldProtocolFee", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newProtocolFee", type: "uint256" },
    ],
    name: "UpdateProtocolFee",
    type: "event",
  },
  {
    inputs: [
      { internalType: "string", name: "identifier", type: "string" },
      { internalType: "enum MarketType", name: "marketType", type: "uint8" },
      { internalType: "bool", name: "active", type: "bool" },
      { internalType: "string", name: "baseCurrency", type: "string" },
      { internalType: "string", name: "quoteCurrency", type: "string" },
      { internalType: "string", name: "symbol", type: "string" },
      { internalType: "bytes32", name: "muonPriceFeedId", type: "bytes32" },
      { internalType: "bytes32", name: "fundingRateId", type: "bytes32" },
      { internalType: "uint256", name: "protocolFee", type: "uint256" },
    ],
    name: "createMarket",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "marketId", type: "uint256" },
          { internalType: "string", name: "identifier", type: "string" },
          { internalType: "enum MarketType", name: "marketType", type: "uint8" },
          { internalType: "bool", name: "active", type: "bool" },
          { internalType: "string", name: "baseCurrency", type: "string" },
          { internalType: "string", name: "quoteCurrency", type: "string" },
          { internalType: "string", name: "symbol", type: "string" },
          { internalType: "bytes32", name: "muonPriceFeedId", type: "bytes32" },
          { internalType: "bytes32", name: "fundingRateId", type: "bytes32" },
          { internalType: "uint256", name: "protocolFee", type: "uint256" },
        ],
        internalType: "struct Market",
        name: "market",
        type: "tuple",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "marketId", type: "uint256" },
      { internalType: "bool", name: "active", type: "bool" },
    ],
    name: "updateMarketActive",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "marketId", type: "uint256" },
      { internalType: "bytes32", name: "fundingRateId", type: "bytes32" },
    ],
    name: "updateMarketFundingRateId",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "marketId", type: "uint256" },
      { internalType: "string", name: "identifier", type: "string" },
    ],
    name: "updateMarketIdentifier",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "marketId", type: "uint256" },
      { internalType: "bytes32", name: "muonPriceFeedId", type: "bytes32" },
    ],
    name: "updateMarketMuonPriceFeedId",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "marketId", type: "uint256" },
      { internalType: "uint256", name: "protocolFee", type: "uint256" },
    ],
    name: "updateMarketProtocolFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
