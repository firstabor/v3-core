import { expect } from "chai";
import { ethers } from "hardhat";

import { MarketType } from "../types";

const market = [
  "identifier",
  MarketType.FOREX,
  true,
  "EUR",
  "USD",
  "EURUSD",
  ethers.utils.formatBytes32String("0x"),
  ethers.utils.formatBytes32String("0x"),
] as const;

export function shouldBehaveLikeMarketsFacet(): void {
  let marketId = 0;
  it("should create a market", async function () {
    await expect(this.marketsFacet.connect(this.signers.admin).createMarket(...market)).to.not.reverted;
  });

  it("should fail to create a market -- onlyOwner allowed", async function () {
    await expect(this.marketsFacet.connect(this.signers.user).createMarket(...market)).to.be.revertedWith(
      "LibDiamond: Must be contract owner",
    );
  });

  it("should return a list of markets", async function () {
    const markets = await this.marketsFacet.connect(this.signers.admin).getMarkets();
    expect(markets.length).to.equal(1);
    marketId = markets[0].marketId.toNumber();
    expect(marketId).to.equal(1);
  });

  it("should return the correct length of markets", async function () {
    const length = await this.marketsFacet.connect(this.signers.admin).getMarketsLength();
    expect(length).to.equal(1);
  });

  it("should update market status -- active=false", async function () {
    await expect(this.marketsFacet.connect(this.signers.admin).updateMarketActive(marketId, false)).to.not.reverted;
  });

  it("should verify if active is correctly set to false", async function () {
    const market = await this.marketsFacet.getMarketById(marketId);
    expect(market.active).to.equal(false);
  });

  it("should update market status -- active=true", async function () {
    await expect(this.marketsFacet.connect(this.signers.admin).updateMarketActive(marketId, true)).to.not.reverted;
  });

  it("should update market identifier ", async function () {
    await expect(this.marketsFacet.connect(this.signers.admin).updateMarketIdentifier(marketId, "hello")).to.not
      .reverted;
    const market = await this.marketsFacet.getMarketById(marketId);
    expect(market.identifier).to.equal("hello");
  });

  it("should update market price feed id ", async function () {
    await expect(
      this.marketsFacet
        .connect(this.signers.admin)
        .updateMarketMuonPriceFeedId(marketId, ethers.utils.formatBytes32String("muonPriceFeedId")),
    ).to.not.reverted;
    const market = await this.marketsFacet.getMarketById(marketId);
    expect(market.muonPriceFeedId).to.equal(ethers.utils.formatBytes32String("muonPriceFeedId"));
  });

  it("should update market funding rate id ", async function () {
    await expect(
      this.marketsFacet
        .connect(this.signers.admin)
        .updateMarketMuonPriceFeedId(marketId, ethers.utils.formatBytes32String("funding rate id")),
    ).to.not.reverted;
    const market = await this.marketsFacet.getMarketById(marketId);
    expect(market.muonPriceFeedId).to.equal(ethers.utils.formatBytes32String("funding rate id"));
  });
}
