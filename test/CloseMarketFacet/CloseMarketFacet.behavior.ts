import BigNumber from "bignumber.js";
import { expect } from "chai";

import { PRECISION } from "../constants";

export function shouldBehaveLikeCloseMarketFacet(): void {
  const positionId = 1;
  let oldMarginBalanceA = new BigNumber(0);
  let oldMarginBalanceB = new BigNumber(0);
  const avgPriceUsd = new BigNumber(1.01).times(PRECISION).toFixed();
  const pnl = new BigNumber(1_000).times(PRECISION).toFixed();

  it("should check if positionId exists -- positionId #1", async function () {
    const user = await this.signers.user.getAddress();
    const hedger = await this.signers.hedger.getAddress();

    const position = await this.masterFacet.getPosition(positionId);
    expect(position.partyA).to.equal(user);
    expect(position.partyB).to.equal(hedger);
  });

  it("should request to close position", async function () {
    await expect(this.closeMarketFacet.connect(this.signers.user).requestCloseMarket(positionId)).to.not.reverted;
  });

  it("should have a PNL at 1.01$ worth 1000$", async function () {
    const upnl = await this.masterFacet.calculateUPnLIsolated(positionId, avgPriceUsd, avgPriceUsd);
    expect(upnl[0].toString()).to.equal(pnl);
  });

  it("hedger fills the close request -- 1.01$ a piece", async function () {
    const marginBalanceA = await this.accountFacet.getMarginBalance(this.signers.user.getAddress());
    const marginBalanceB = await this.accountFacet.getMarginBalance(this.signers.hedger.getAddress());

    oldMarginBalanceA = new BigNumber(marginBalanceA.toString());
    oldMarginBalanceB = new BigNumber(marginBalanceB.toString());

    await expect(this.closeMarketFacet.connect(this.signers.hedger).fillCloseMarket(positionId, avgPriceUsd)).to.not
      .reverted;
  });

  it("should have distributed the PNL + margins properly", async function () {
    const marginBalanceA = await this.accountFacet.getMarginBalance(this.signers.user.getAddress());
    const marginBalanceB = await this.accountFacet.getMarginBalance(this.signers.hedger.getAddress());

    const position = await this.masterFacet.getPosition(positionId);
    const lockedMarginA = new BigNumber(position.lockedMarginA.toString());
    const lockedMarginB = new BigNumber(position.lockedMarginB.toString());
    const liquidationFee = new BigNumber(position.liquidationFee.toString());
    const cva = new BigNumber(position.cva.toString());

    const expectedMarginBalanceA = oldMarginBalanceA.plus(pnl).plus(lockedMarginA).plus(liquidationFee).plus(cva);
    const expectedMarginBalanceB = oldMarginBalanceB.minus(pnl).plus(lockedMarginB).plus(liquidationFee).plus(cva);
    expect(expectedMarginBalanceA.toFixed()).to.equal(marginBalanceA.toString());
    expect(expectedMarginBalanceB.toFixed()).to.equal(marginBalanceB.toString());
  });
}
