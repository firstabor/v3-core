export const diamondName = "V3CoreDiamond";

export const coreFacetNames = ["DiamondCut", "DiamondLoupe", "ERC165", "Ownable"] as const;
export const appFacetNames = [
  "AccessControl",
  "AccessControlAdmin",
  "Constants",
  "ConstantsOwnable",
  "Hedgers",
  "Markets",
  "MarketsOwnable",
  "Accounts",
  "AccountsOwnable",
  "Liquidations",
  "CloseMarket",
  "ClosePosition",
  "ClosePositionOwnable",
  "OpenMarketSingle",
  "OpenPosition",
  "MasterAgreement",
  "Oracle",
  "OracleOwnable",
  "PauseOwnable",
];
export const allFacetNames = [...coreFacetNames, ...appFacetNames];
