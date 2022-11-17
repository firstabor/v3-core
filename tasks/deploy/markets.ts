import { MarketsFacet } from "../../src/types";

export async function initializeMarkets(marketsFacet: MarketsFacet) {
  await marketsFacet.createMarket(
    "EURO",
    0, // forex
    true,
    "EUR",
    "USD",
    "EURUSD",
    "0x0000000000000000000000000000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  );
  await marketsFacet.createMarket(
    "GOLD",
    1, // metals
    true,
    "XAU",
    "USD",
    "XAUUSD",
    "0x0000000000000000000000000000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  );
}
