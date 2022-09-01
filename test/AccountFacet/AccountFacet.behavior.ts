import { expect } from "chai";
import { ethers } from "hardhat";

export function shouldBehaveLikeAccountFacet(): void {
  it("should approve and mint", async function () {
    const user = this.signers.user.getAddress();

    // Approve collateral
    await this.collateral.connect(this.signers.user).approve(this.diamond.address, ethers.constants.MaxUint256);
    expect(await this.collateral.allowance(user, this.diamond.address)).to.equal(ethers.constants.MaxUint256);

    // Mint the user some USD
    expect(await this.accountFacet.getAccountBalance(user)).to.equal("0");
    await this.collateral.mint(user, "500");
    expect(await this.collateral.balanceOf(user)).to.equal("500");
  });

  it("should deposit collateral", async function () {
    const user = this.signers.user.getAddress();

    await this.accountFacet.connect(this.signers.user).deposit("130");
    expect(await this.accountFacet.getAccountBalance(user)).to.equal("130");
    expect(await this.collateral.balanceOf(user)).to.equal("370");
  });

  it("should withdraw collateral", async function () {
    const user = this.signers.user.getAddress();

    await this.accountFacet.connect(this.signers.user).withdraw("50");
    expect(await this.accountFacet.getAccountBalance(user)).to.equal("80");
  });

  it("should allocate", async function () {
    const user = this.signers.user.getAddress();

    await this.accountFacet.connect(this.signers.user).allocate("20");

    expect(await this.accountFacet.getAccountBalance(user)).to.equal("60");
    expect(await this.accountFacet.getMarginBalance(user)).to.equal("20");
  });

  it("should deallocate", async function () {
    const user = this.signers.user.getAddress();

    await this.accountFacet.connect(this.signers.user).deallocate("10");

    expect(await this.accountFacet.getAccountBalance(user)).to.equal("70");
    expect(await this.accountFacet.getMarginBalance(user)).to.equal("10");
  });

  it("should add free margin", async function () {
    const user = this.signers.user.getAddress();

    expect(await this.accountFacet.getMarginBalance(user)).to.equal("10");
    const addFreeMargin = this.accountFacet.connect(this.signers.user).addFreeMargin("50");
    await expect(addFreeMargin).to.be.revertedWith("Insufficient margin balance");

    await this.accountFacet.connect(this.signers.user).addFreeMargin("5");
    expect(await this.accountFacet.getMarginBalance(user)).to.equal("5");
    expect(await this.accountFacet.getLockedMargin(user)).to.equal("5");
  });

  it("should reset the state", async function () {
    await this.accountFacet.connect(this.signers.user).dangerouslyRemoveLockedMargin("5", [], "0x", []);
    await this.accountFacet.connect(this.signers.user).deallocate("10");
    await this.accountFacet.connect(this.signers.user).withdraw("80");
    await this.collateral.connect(this.signers.user).transfer(this.diamond.address, "500");
  });
}
