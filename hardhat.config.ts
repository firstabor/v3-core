import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import "hardhat-diamond-abi";
import "@typechain/hardhat";
import { config as dotenvConfig } from "dotenv";
import type { HardhatUserConfig } from "hardhat/config";
import { resolve } from "path";
import { diamondName } from "./src/config/constants";

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "./.env";
dotenvConfig({ path: resolve(__dirname, dotenvConfigPath) });

// Ensure that we have all the environment variables we need.
const privateKey: string | undefined = process.env.PRIVATE_KEY;
if (!privateKey) {
  throw new Error("Please set your PRIVATE_KEY in a .env file");
}

const arbitrumRpcURL: string | undefined = process.env.ARBITRUM_RPC_URL;
if (!arbitrumRpcURL) {
  throw new Error("Please set your arbitrumRpcURL in a .env file");
}

const arbiscanAPIKey: string | undefined = process.env.ARBISCAN_API_KEY;
if (!arbiscanAPIKey) {
  throw new Error("Please set your arbiscanAPIKey in a .env file");
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  gasReporter: {
    currency: "USD",
    enabled: true,
    excludeContracts: [],
    src: "./contracts",
  },
  networks: {
    hardhat: {
      forking: {
        url: arbitrumRpcURL,
      },
    },
    arbitrum: {
      url: arbitrumRpcURL,
      accounts: [privateKey],
    },
  },
  etherscan: {
    apiKey: {
      arbitrumOne: arbiscanAPIKey,
    },
  },
  verify: {
    etherscan: {
      apiKey: arbiscanAPIKey,
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.16",
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/hardhat-template/issues/31
        bytecodeHash: "none",
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  typechain: {
    outDir: "src/types",
    target: "ethers-v5",
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    admin: {
      default: 1,
    },
    signer: {
      default: 2,
    },
  },
  diamondAbi: {
    name: diamondName,
    strict: false,
    filter: function (abiElement, index, fullAbi, fullyQualifiedName) {
      return !fullyQualifiedName.includes("IMasterAgreement");
    },
  },
};

export default config;
