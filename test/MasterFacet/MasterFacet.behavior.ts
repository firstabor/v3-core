import BigNumber from "bignumber.js";
import { expect } from "chai";

import { PRECISION } from "../constants";

export function shouldBehaveLikeMasterFacet(): void {
  const crossLongId = 2; // worth 100k
  const crossShortId = 3; // worth 50k

  const bidPrice = new BigNumber(0.95).times(PRECISION);
  const askPrice = new BigNumber(0.95).times(PRECISION);

  it("should calculate UPnL Isolated -- long", async function () {
    const expectedUPnL = new BigNumber(5_000).times(-1).times(PRECISION);

    const [uPnlA, uPnlB] = await this.masterFacet.calculateUPnLIsolated(
      crossLongId,
      bidPrice.toFixed(),
      askPrice.toFixed(),
    );

    expect(uPnlA.toString()).to.equal(expectedUPnL.toFixed());
    expect(uPnlB.toString()).to.equal(expectedUPnL.times(-1).toFixed());
  });

  it("should calculate UPnL Isolated -- short", async function () {
    const expectedUPnL = new BigNumber(2_500).times(PRECISION);

    const [uPnlA, uPnlB] = await this.masterFacet.calculateUPnLIsolated(
      crossShortId,
      bidPrice.toFixed(),
      askPrice.toFixed(),
    );

    expect(uPnlA.toString()).to.equal(expectedUPnL.toFixed());
    expect(uPnlB.toString()).to.equal(expectedUPnL.times(-1).toFixed());
  });

  it("should calculate crossMarginHealth -- liquidated (0)", async function () {
    const user = await this.signers.user.getAddress();

    // user has a 100k long and a 50k short
    // in order to get liquidated he needs to lose 150k
    const expectedHealth = 0;
    const uPnLCross = new BigNumber(-150_000).times(PRECISION).toFixed();

    const result = await this.masterFacet.calculateCrossMarginHealth(user, uPnLCross);
    expect(result.toString()).to.equal(expectedHealth.toFixed());
  });

  it("should calculate crossMarginHealth -- liquidation delayed (x < 0)", async function () {
    const user = await this.signers.user.getAddress();

    // user has a 100k long and a 50k short
    // liquidation is delayed at > 150k
    const expectedHealth = 0;
    const uPnLCross = new BigNumber(-160_000).times(PRECISION).toFixed();

    const result = await this.masterFacet.calculateCrossMarginHealth(user, uPnLCross);
    expect(result.toString()).to.equal(expectedHealth.toFixed());
  });

  it("should calculate the crossPnl at 0.95$", async function () {
    const user = await this.signers.user.getAddress();

    // user has a 100k long and a 50k short
    // at 0.95$ his long is: 5k loss
    // at 0.95$ his short is: 2.5k profit
    // health = (margin + -uPnL) / margin => 150k - 2.5k / 150k => 99.83%
    const expectedCrossPnl = new BigNumber(-2_500).times(PRECISION).toFixed();

    const result = await this.masterFacet.calculateUPnLCross(
      [
        {
          positionId: crossLongId,
          bidPrice: bidPrice.toFixed(),
          askPrice: askPrice.toFixed(),
        },
        {
          positionId: crossShortId,
          bidPrice: bidPrice.toFixed(),
          askPrice: askPrice.toFixed(),
        },
      ],
      user,
    );

    expect(result.toString()).to.equal(expectedCrossPnl);
  });

  it("should calculate crossMarginHealth -- semi-healthy (0 < x < 100)", async function () {
    const user = await this.signers.user.getAddress();

    // crossPnL is -2.5k
    // health = (margin + -uPnL) / margin => 150k - 2.5k / 150k => 98.33%
    const expectedHealth = new BigNumber(0.9833).toFixed();
    const uPnLCross = new BigNumber(-2_500).times(PRECISION).toFixed();

    const result = await this.masterFacet.calculateCrossMarginHealth(user, uPnLCross);
    expect(new BigNumber(result.toString()).div(PRECISION).toFixed(4)).to.equal(expectedHealth);
  });

  it("should calculate crossMarginHealth -- neutral (100)", async function () {
    const user = await this.signers.user.getAddress();

    const expectedHealth = new BigNumber(1).times(PRECISION).toFixed();
    const uPnLCross = new BigNumber(0).times(PRECISION).toFixed();

    const result = await this.masterFacet.calculateCrossMarginHealth(user, uPnLCross);
    expect(result.toString()).to.equal(expectedHealth);
  });

  it("should calculate crossMarginHealth -- super-healthy (x > 100)", async function () {
    const user = await this.signers.user.getAddress();

    const expectedHealth = new BigNumber(1.5).times(PRECISION).toFixed();
    const uPnLCross = new BigNumber(75_000).times(PRECISION).toFixed();

    const result = await this.masterFacet.calculateCrossMarginHealth(user, uPnLCross);
    expect(result.toString()).to.equal(expectedHealth);
  });

  it("should calculate crossMarginHealth -- no locked margin (0 positions)", async function () {
    const adminWithoutPositions = await this.signers.admin.getAddress();

    const expectedHealth = new BigNumber(1).times(PRECISION).toFixed();
    const uPnLCross = new BigNumber(0).times(PRECISION).toFixed();

    const result = await this.masterFacet.calculateCrossMarginHealth(adminWithoutPositions, uPnLCross);
    expect(result.toString()).to.equal(expectedHealth);
  });
}
