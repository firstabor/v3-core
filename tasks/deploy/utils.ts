import { ethers } from "ethers";

export enum FacetCutAction {
  Add,
  Replace,
  Remove,
}

export const FacetNames = [
  "DiamondLoupeFacet",
  "OwnershipFacet",
  "AccountFacet",
  "HedgersFacet",
  "MarketsFacet",
  "LiquidationFacet",
  "MasterFacet",
  "OpenMarketSingleFacet",
  "CloseMarketSingleFacet",
];

// Get function selectors from ABI
export function getSelectors(contract: ethers.Contract | ethers.ContractFactory) {
  const signatures = Object.keys(contract.interface.functions);

  const selectors = signatures.reduce((acc, val) => {
    if (val !== "init(bytes)") {
      acc.push(contract.interface.getSighash(val));
    }
    return acc;
  }, [] as string[]);

  const remove = (functionNames: string[]) => {
    return selectors.filter(val => {
      for (const functionName of functionNames) {
        if (val === contract.interface.getSighash(functionName)) {
          return false;
        }
      }
      return true;
    });
  };

  const get = (functionNames: string[]) => {
    return selectors.filter(val => {
      for (const functionName of functionNames) {
        if (val === contract.interface.getSighash(functionName)) {
          return true;
        }
      }
      return false;
    });
  };

  return {
    selectors,
    remove,
    get,
  };
}

// Get function selector from function signature
export function getSelector(func: string) {
  const abiInterface = new ethers.utils.Interface([func]);
  return abiInterface.getSighash(ethers.utils.Fragment.from(func));
}
