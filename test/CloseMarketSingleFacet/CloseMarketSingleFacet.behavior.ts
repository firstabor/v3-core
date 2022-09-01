import BigNumber from "bignumber.js";
import { expect } from "chai";
import { ethers, network } from "hardhat";

import { PRECISION } from "../constants";
import { Side } from "../types";

export function shouldBehaveLikeCloseMarketSingleFacet(): void {
  const positionId = 0;
  let oldMarginBalanceA = new BigNumber(0);
  let oldLockedMarginB = new BigNumber(0);

  it("should check if positionId exists", async function () {
    const userPositions = await this.masterFacet.getOpenPositions(this.signers.user.getAddress());
    const hedgerPositions = await this.masterFacet.getOpenPositions(this.signers.hedger.getAddress());
    expect(userPositions.length).to.equal(1);
    expect(hedgerPositions.length).to.equal(1);

    const position = userPositions[0];
    expect(position.positionId.toNumber()).to.equal(positionId);
    expect(position.positionId.toNumber()).to.equal(hedgerPositions[0].positionId.toNumber());
  });

  it("should request to close position", async function () {
    await expect(this.closeMarketSingleFacet.connect(this.signers.user).requestCloseMarket(positionId)).to.not.reverted;
  });

  it("hedger fills the close request -- 110$ a piece", async function () {
    const marginBalanceA = await this.accountFacet.getMarginBalance(this.signers.user.getAddress());
    const lockedMarginB = await this.accountFacet.getLockedMargin(this.signers.hedger.getAddress());

    oldMarginBalanceA = new BigNumber(marginBalanceA.toString());
    oldLockedMarginB = new BigNumber(lockedMarginB.toString());

    await expect(
      this.closeMarketSingleFacet
        .connect(this.signers.hedger)
        .fillCloseMarket(positionId, new BigNumber(110).times(PRECISION).toFixed()),
    ).to.not.reverted;
  });

  it("should have distributed the PNL properly", async function () {
    const pnl = new BigNumber(10_000).times(PRECISION);
    const marginBalanceA = await this.accountFacet.getMarginBalance(this.signers.user.getAddress());
    const lockedMarginB = await this.accountFacet.getLockedMargin(this.signers.hedger.getAddress());

    const expectedMarginBalanceA = oldMarginBalanceA.plus(pnl);
    const expectedLockedMarginB = oldLockedMarginB.minus(pnl);
    expect(expectedMarginBalanceA.toFixed()).to.equal(marginBalanceA.toString());
    expect(expectedLockedMarginB.toFixed()).to.equal(lockedMarginB.toString());
  });

  it("should have removed the open positions", async function () {
    const userPositions = await this.masterFacet.getOpenPositions(this.signers.user.getAddress());
    const hedgerPositions = await this.masterFacet.getOpenPositions(this.signers.hedger.getAddress());
    expect(userPositions.length).to.equal(0);
    expect(hedgerPositions.length).to.equal(0);
  });
}
