import { expect } from "chai";
import { ethers } from "hardhat";

export function shouldBehaveLikeHedgers(): void {
  it("should approve and mint", async function () {
    const hedger = this.signers.hedger.getAddress();
    // Approve collateral
    await this.collateral.connect(this.signers.hedger).approve(this.diamond.address, ethers.constants.MaxUint256);
    expect(await this.collateral.allowance(hedger, this.diamond.address)).to.equal(ethers.constants.MaxUint256);
    // Mint the hedger some USD
    await this.collateral.mint(hedger, 10_000);
    expect(await this.collateral.balanceOf(hedger)).to.equal(10_000);
  });

  it("should enlist a hedger", async function () {
    await expect(this.hedgers.connect(this.signers.hedger).enlist()).to.not.reverted;
  });

  it("should fail to enlist a hedger -- by the same hedger", async function () {
    await expect(this.hedgers.connect(this.signers.hedger).enlist()).to.be.revertedWith("Hedger already exists");
  });

  it("should find our hedger by address", async function () {
    const hedger = this.signers.hedger.getAddress();
    const [success] = await this.hedgers.getHedgerByAddress(hedger);
    expect(success).to.be.true;
  });

  it("should fail to find an invalid hedger address", async function () {
    const randomUser = this.signers.user.getAddress();
    const [success] = await this.hedgers.getHedgerByAddress(randomUser);
    expect(success).to.be.false;
  });

  it("should return a list of hedgers -- length should be 1", async function () {
    const list = await this.hedgers.getHedgers();
    expect(list.length).to.equal(1);
  });

  it("should return the correct length of all hedgers", async function () {
    const length = await this.hedgers.getHedgersLength();
    expect(length).to.equal(1);
  });
}
