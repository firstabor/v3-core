import BigNumber from "bignumber.js";
import { expect } from "chai";

import { MARGIN_OVERHEAD, LIQUIDATION_FEE, PRECISION } from "../constants";

export function shouldBehaveLikeMasterFacet(): void {
  it("should calculate locked margin", async function () {
    const notionalUSD = new BigNumber(10_000).times(PRECISION);
    const marginRequiredPercentage = 20;

    const multiplier = 1 + MARGIN_OVERHEAD + LIQUIDATION_FEE;
    const expectedResult = notionalUSD.times(marginRequiredPercentage).div(100).times(multiplier);

    const lockedMargin = await this.masterFacet.calculateLockedMargin(
      notionalUSD.toFixed(),
      marginRequiredPercentage,
      false,
    );
    expect(lockedMargin.toString()).to.equal(expectedResult.toFixed());
  });

  it("should calculate UPnL Isolated -- long", async function () {
    const side = 0;
    const currentBalanceUnits = new BigNumber(2).times(PRECISION);
    const initialNotionalUSD = new BigNumber(10).times(PRECISION);
    const price = new BigNumber(6).times(PRECISION);

    const expectedUPnL = new BigNumber(2).times(PRECISION);
    const expectedNotionalIsolated = new BigNumber(12).times(PRECISION);

    const [uPnLResult, notionalIsolatedResult] = await this.masterFacet.calculateUPnLIsolated(
      side,
      currentBalanceUnits.toFixed(),
      initialNotionalUSD.toFixed(),
      price.toFixed(),
      price.toFixed(),
    );

    expect(uPnLResult.toString()).to.equal(expectedUPnL.toFixed());
    expect(notionalIsolatedResult.toString()).to.equal(expectedNotionalIsolated.toFixed());
  });

  it("should calculate UPnL Isolated -- short", async function () {
    const side = 1;
    const currentBalanceUnits = new BigNumber(2).times(PRECISION);
    const initialNotionalUSD = new BigNumber(10).times(PRECISION);
    const price = new BigNumber(6).times(PRECISION);

    const expectedUPnL = new BigNumber(-2).times(PRECISION);
    const expectedNotionalIsolated = new BigNumber(8).times(PRECISION);

    const [uPnLResult, notionalIsolatedResult] = await this.masterFacet.calculateUPnLIsolated(
      side,
      currentBalanceUnits.toFixed(),
      initialNotionalUSD.toFixed(),
      price.toFixed(),
      price.toFixed(),
    );

    expect(uPnLResult.toString()).to.equal(expectedUPnL.toFixed());
    expect(notionalIsolatedResult.toString()).to.equal(expectedNotionalIsolated.toFixed());
  });

  it("should calculate crossMarginHealth -- liquidated (0)", async function () {
    const lockedMargin = new BigNumber(10).times(PRECISION);
    const uPnLCross = new BigNumber(-10).times(PRECISION);
    const expectedHealth = 0;

    const result = await this.masterFacet.calculateCrossMarginHealth(lockedMargin.toFixed(), uPnLCross.toFixed());
    expect(result.toString()).to.equal(expectedHealth.toFixed());
  });

  it("should calculate crossMarginHealth -- liquidation delayed (x < 0)", async function () {
    const lockedMargin = new BigNumber(10).times(PRECISION);
    const uPnLCross = new BigNumber(-12).times(PRECISION);
    const expectedHealth = 0;

    const result = await this.masterFacet.calculateCrossMarginHealth(lockedMargin.toFixed(), uPnLCross.toFixed());
    expect(result.toString()).to.equal(expectedHealth.toFixed());
  });

  it("should calculate crossMarginHealth -- semi-healthy (0 < x < 100)", async function () {
    const lockedMargin = new BigNumber(10).times(PRECISION);
    const uPnLCross = new BigNumber(-5).times(PRECISION);
    const expectedHealth = new BigNumber(0.5).times(PRECISION);

    const result = await this.masterFacet.calculateCrossMarginHealth(lockedMargin.toFixed(), uPnLCross.toFixed());
    expect(result.toString()).to.equal(expectedHealth.toFixed());
  });

  it("should calculate crossMarginHealth -- neutral (100)", async function () {
    const lockedMargin = new BigNumber(10).times(PRECISION);
    const uPnLCross = new BigNumber(0).times(PRECISION);
    const expectedHealth = new BigNumber(1).times(PRECISION);

    const result = await this.masterFacet.calculateCrossMarginHealth(lockedMargin.toFixed(), uPnLCross.toFixed());
    expect(result.toString()).to.equal(expectedHealth.toFixed());
  });

  it("should calculate crossMarginHealth -- super-healthy (x > 100)", async function () {
    const lockedMargin = new BigNumber(10).times(PRECISION);
    const uPnLCross = new BigNumber(5).times(PRECISION);
    const expectedHealth = new BigNumber(1.5).times(PRECISION);

    const result = await this.masterFacet.calculateCrossMarginHealth(lockedMargin.toFixed(), uPnLCross.toFixed());
    expect(result.toString()).to.equal(expectedHealth.toFixed());
  });

  it("should calculate crossMarginHealth -- no locked margin (0 positions)", async function () {
    const lockedMargin = new BigNumber(0).times(PRECISION);
    const uPnLCross = new BigNumber(0).times(PRECISION);
    const expectedHealth = new BigNumber(1).times(PRECISION);

    const result = await this.masterFacet.calculateCrossMarginHealth(lockedMargin.toFixed(), uPnLCross.toFixed());
    expect(result.toString()).to.equal(expectedHealth.toFixed());
  });

  it("should should pass the solvencySafeguard (as user) -- first position", async function () {
    const lockedMargin = new BigNumber(0).times(PRECISION);
    const uPnLCross = new BigNumber(0).times(PRECISION);

    const result = await this.masterFacet.solvencySafeguardToTrade(lockedMargin.toFixed(), uPnLCross.toFixed(), false);
    expect(result).to.be.true;
  });

  it("should should pass the solvencySafeguard (as user) -- 50% health", async function () {
    const lockedMargin = new BigNumber(10).times(PRECISION);
    const uPnLCross = new BigNumber(-5).times(PRECISION);

    const result = await this.masterFacet.solvencySafeguardToTrade(lockedMargin.toFixed(), uPnLCross.toFixed(), false);
    expect(result).to.be.true;
  });

  it("should should fail the solvencySafeguard (as user) -- 20% health (< 30% threshold)", async function () {
    const lockedMargin = new BigNumber(10).times(PRECISION);
    const uPnLCross = new BigNumber(-8).times(PRECISION);

    const result = await this.masterFacet.solvencySafeguardToTrade(lockedMargin.toFixed(), uPnLCross.toFixed(), false);
    expect(result).to.be.false;
  });
}
