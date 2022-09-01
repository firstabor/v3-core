import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-toolbox";
import { config as dotenvConfig } from "dotenv";
import type { HardhatUserConfig } from "hardhat/config";
import { resolve } from "path";

import "./tasks/deploy";

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "./.env";
dotenvConfig({ path: resolve(__dirname, dotenvConfigPath) });

// Ensure that we have all the environment variables we need.
const privateKey: string | undefined = process.env.PRIVATE_KEY;
if (!privateKey) {
  throw new Error("Please set your PRIVATE_KEY in a .env file");
}

const fantomRpcURL: string | undefined = process.env.FANTOM_RPC_URL;
if (!fantomRpcURL) {
  throw new Error("Please set your fantomRpcURL in a .env file");
}

const ftmscanAPIKey: string | undefined = process.env.FTMSCAN_API_KEY;
if (!ftmscanAPIKey) {
  throw new Error("Please set your ftmscanAPIKey in a .env file");
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
        url: fantomRpcURL,
      },
      allowUnlimitedContractSize: false,
    },
    fantom: {
      url: fantomRpcURL,
      accounts: [privateKey],
    },
  },
  etherscan: {
    apiKey: {
      opera: ftmscanAPIKey,
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
};

export default config;
