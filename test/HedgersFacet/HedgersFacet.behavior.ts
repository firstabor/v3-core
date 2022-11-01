import { expect } from "chai";
import { ethers } from "hardhat";

export function shouldBehaveLikeHedgersFacet(): void {
  it("should approve and mint", async function () {
    const hedger = this.signers.hedger.getAddress();
    // Approve collateral
    await this.collateral.connect(this.signers.hedger).approve(this.diamond.address, ethers.constants.MaxUint256);
    expect(await this.collateral.allowance(hedger, this.diamond.address)).to.equal(ethers.constants.MaxUint256);
    // Mint the hedger some USD
    await this.collateral.mint(hedger, "5000");
    expect(await this.collateral.balanceOf(hedger)).to.equal("5000");
  });

  it("should enlist a hedger", async function () {
    await expect(
      this.hedgersFacet
        .connect(this.signers.hedger)
        .enlist(["wss://pricing.example.com"], ["https://markets.example.com"]),
    ).to.not.reverted;
  });

  it("should fail to enlist a hedger -- by the same hedger", async function () {
    await expect(
      this.hedgersFacet
        .connect(this.signers.hedger)
        .enlist(["wss://pricing.example.com"], ["https://markets.example.com"]),
    ).to.be.revertedWith("Hedger already exists");
  });

  it("should find our hedger by address", async function () {
    const hedger = this.signers.hedger.getAddress();
    const [success] = await this.hedgersFacet.getHedgerByAddress(hedger);
    expect(success).to.be.true;
  });

  it("should fail to find an invalid hedger address", async function () {
    const randomUser = this.signers.user.getAddress();
    const [success] = await this.hedgersFacet.getHedgerByAddress(randomUser);
    expect(success).to.be.false;
  });

  it("should return a list of hedgers -- length should be 1", async function () {
    const list = await this.hedgersFacet.getHedgers();
    expect(list.length).to.equal(1);
  });

  it("should return the correct length of all hedgers", async function () {
    const length = await this.hedgersFacet.getHedgersLength();
    expect(length).to.equal(1);
  });

  it("should try to update prices", async function () {
    await expect(
      this.hedgersFacet
        .connect(this.signers.hedger)
        .updatePricingWssURLs(["wss://pricing1.example.com", "wss://pricing2.example.com"]),
    ).to.not.reverted;
  });

  it("should try to update prices -- no length", async function () {
    await expect(this.hedgersFacet.connect(this.signers.hedger).updatePricingWssURLs([])).to.be.revertedWith(
      "pricingWssURLs must be non-empty",
    );
  });

  it("should fail to update pricesWssURLs with insecure URLs", async function () {
    await expect(
      this.hedgersFacet.connect(this.signers.hedger).updatePricingWssURLs(["ws://insecure-url.com"]),
    ).to.be.revertedWith("websocketURLs must be secure");
  });

  it("should fail to update marketsHttpsURLs with insecure URLs", async function () {
    await expect(
      this.hedgersFacet.connect(this.signers.hedger).updateMarketsHttpsURLs(["http://insecure-url.com"]),
    ).to.be.revertedWith("httpsURLs must be secure");
  });
}
