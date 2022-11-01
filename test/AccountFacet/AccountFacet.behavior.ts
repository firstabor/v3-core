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

    await this.accountFacet.connect(this.signers.user).deposit("300");
    expect(await this.accountFacet.getAccountBalance(user)).to.equal("300");
    expect(await this.collateral.balanceOf(user)).to.equal("200");
  });

  it("should withdraw collateral", async function () {
    const user = this.signers.user.getAddress();

    await this.accountFacet.connect(this.signers.user).withdraw("50");
    expect(await this.accountFacet.getAccountBalance(user)).to.equal("250");
  });

  it("should allocate", async function () {
    const user = this.signers.user.getAddress();

    await this.accountFacet.connect(this.signers.user).allocate("100");

    expect(await this.accountFacet.getAccountBalance(user)).to.equal("150");
    expect(await this.accountFacet.getMarginBalance(user)).to.equal("100");
  });

  it("should deallocate", async function () {
    const user = this.signers.user.getAddress();

    await this.accountFacet.connect(this.signers.user).deallocate("50");

    expect(await this.accountFacet.getAccountBalance(user)).to.equal("200");
    expect(await this.accountFacet.getMarginBalance(user)).to.equal("50");
  });

  it("should add free margin", async function () {
    const user = this.signers.user.getAddress();

    const addFreeMargin = this.accountFacet.connect(this.signers.user).addFreeMargin("100");
    await expect(addFreeMargin).to.be.revertedWith("Insufficient margin balance");

    await this.accountFacet.connect(this.signers.user).addFreeMargin("50");
    expect(await this.accountFacet.getMarginBalance(user)).to.equal("0");
    expect(await this.accountFacet.getLockedMargin(user)).to.equal("50");
  });

  it("should reset the state", async function () {
    await this.accountFacet.connect(this.signers.user).removeFreeMargin();
    await this.accountFacet.connect(this.signers.user).deallocate("50");
    await this.accountFacet.connect(this.signers.user).withdraw("250");
    await this.collateral.connect(this.signers.user).transfer(this.diamond.address, "500");
  });
}
