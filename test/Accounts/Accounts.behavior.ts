import { expect } from "chai";
import { ethers } from "hardhat";

export function shouldBehaveLikeAccounts(): void {
  it("should approve and mint", async function () {
    const user = this.signers.user.getAddress();

    // Approve collateral
    await this.collateral.connect(this.signers.user).approve(this.diamond.address, ethers.constants.MaxUint256);
    expect(await this.collateral.allowance(user, this.diamond.address)).to.equal(ethers.constants.MaxUint256);

    // Mint the user some USD
    expect(await this.accounts.getAccountBalance(user)).to.equal(0);
    await this.collateral.mint(user, 500);
    expect(await this.collateral.balanceOf(user)).to.equal(500);
  });

  it("should deposit collateral", async function () {
    const user = this.signers.user.getAddress();

    await this.accounts.connect(this.signers.user).deposit(500);
    expect(await this.accounts.getAccountBalance(user)).to.equal(500);
    expect(await this.collateral.balanceOf(user)).to.equal(0);
  });

  it("should withdraw collateral", async function () {
    const user = this.signers.user.getAddress();

    await this.accounts.connect(this.signers.user).withdraw(50);
    expect(await this.accounts.getAccountBalance(user)).to.equal(450);
  });

  it("should allocate", async function () {
    const user = this.signers.user.getAddress();

    await this.accounts.connect(this.signers.user).allocate(450);

    expect(await this.accounts.getAccountBalance(user)).to.equal(0);
    expect(await this.accounts.getMarginBalance(user)).to.equal(450);
  });

  it("should deallocate", async function () {
    const user = this.signers.user.getAddress();

    await this.accounts.connect(this.signers.user).deallocate(50);

    expect(await this.accounts.getAccountBalance(user)).to.equal(50);
    expect(await this.accounts.getMarginBalance(user)).to.equal(400);
  });

  it("should add free margin cross", async function () {
    const user = this.signers.user.getAddress();

    const addFreeMargin = this.accounts.connect(this.signers.user).addFreeMarginCross(1000);
    await expect(addFreeMargin).to.be.revertedWith("Insufficient margin balance");

    await this.accounts.connect(this.signers.user).addFreeMarginCross(50);
    expect(await this.accounts.getMarginBalance(user)).to.equal(350);
    expect(await this.accounts.getLockedMarginCross(user)).to.equal(50);
  });

  it("should fail to add free margin isolated - invalid position", async function () {
    const addFreeMargin = this.accounts.connect(this.signers.user).addFreeMarginIsolated(100, 0);
    await expect(addFreeMargin).to.be.revertedWith("Invalid party");
  });

  it("should reset the state", async function () {
    const user = this.signers.user.getAddress();

    await this.accounts.connect(this.signers.user).removeFreeMarginCross();
    await this.accounts.connect(this.signers.user).deallocate(400);
    await this.accounts.connect(this.signers.user).withdraw(450);

    expect(await this.accounts.getMarginBalance(user)).to.equal(0);
    expect(await this.accounts.getAccountBalance(user)).to.equal(0);
    expect(await this.collateral.balanceOf(user)).to.equal(500);
  });
}
