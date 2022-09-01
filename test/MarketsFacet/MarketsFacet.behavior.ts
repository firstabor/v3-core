import { expect } from "chai";

import { MarketType, TradingSession } from "../types";

export function shouldBehaveLikeMarketsFacet(): void {
  let marketId = -1;

  it("should create a market", async function () {
    await expect(
      this.marketsFacet
        .connect(this.signers.admin)
        .createMarket("some-isin-identifier", MarketType.FOREX, TradingSession._24_5, true, "EUR", "USD", "EURUSD"),
    ).to.not.reverted;
  });

  it("should fail to create a market -- onlyOwner allowed", async function () {
    await expect(
      this.marketsFacet
        .connect(this.signers.user)
        .createMarket("some-isin-identifier", MarketType.FOREX, TradingSession._24_5, true, "EUR", "USD", "EURUSD"),
    ).to.be.revertedWith("LibDiamond: Must be contract owner");
  });

  it("should return a list of markets", async function () {
    const markets = await this.marketsFacet.connect(this.signers.admin).getMarkets();
    expect(markets.length).to.equal(1);
    marketId = markets[0]._marketId.toNumber();
    expect(marketId).to.equal(0);
  });

  it("should return the correct length of markets", async function () {
    const length = await this.marketsFacet.connect(this.signers.admin).getMarketsLength();
    expect(length).to.equal(1);
  });

  it("should update market status -- active=false", async function () {
    await expect(this.marketsFacet.connect(this.signers.admin).updateMarketStatus(marketId, false)).to.not.reverted;
  });

  it("should verify if active is correctly set to false", async function () {
    const market = await this.marketsFacet.getMarketById(marketId);
    expect(market.active).to.equal(false);
  });
}
