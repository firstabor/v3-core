import BigNumber from "bignumber.js";
import { expect } from "chai";
import { ethers, network } from "hardhat";

import { PRECISION } from "../constants";
import { Side } from "../types";

export function shouldBehaveLikeOpenMarketSingleFacet(): void {
  let marketId = 0;
  const marginRequiredPercentage = 20;
  const reqId = "0x";

  it("should mint the user & hedger some collateral", async function () {
    await this.collateral.mint(this.signers.user.getAddress(), new BigNumber(100_000).times(PRECISION).toFixed());
    await this.collateral.mint(this.signers.hedger.getAddress(), new BigNumber(100_000).times(PRECISION).toFixed());

    await this.collateral.connect(this.signers.user).approve(this.diamond.address, ethers.constants.MaxUint256);
    await this.collateral.connect(this.signers.hedger).approve(this.diamond.address, ethers.constants.MaxUint256);

    await this.accountFacet
      .connect(this.signers.user)
      .depositAndAllocate(new BigNumber(100_000).times(PRECISION).toFixed());
    await this.accountFacet
      .connect(this.signers.hedger)
      .depositAndAllocate(new BigNumber(100_000).times(PRECISION).toFixed());
  });

  it("should request for a quote", async function () {
    const marketIds = await this.marketsFacet.getMarkets();
    expect(marketIds.length).to.be.greaterThan(0);
    marketId = marketIds[0]._marketId.toNumber();

    await expect(
      this.openMarketSingleFacet
        .connect(this.signers.user)
        .requestOpenMarketSingle(
          this.signers.hedger.getAddress(),
          marketId,
          Side.BUY,
          new BigNumber(100_000).times(PRECISION).toFixed(),
          1,
          marginRequiredPercentage,
          [],
          reqId,
          [],
        ),
    ).to.not.reverted;

    const allRFQs = await this.masterFacet.getRequestForQuotes(this.signers.user.getAddress());
    expect(allRFQs.length).to.equal(1);
    const rfq = allRFQs[0];

    expect(rfq.lockedMarginA.toString()).to.equal(new BigNumber(32_000).times(PRECISION).toFixed());
    expect(rfq.lockedMarginB.toString()).to.equal(new BigNumber(32_000).times(PRECISION).toFixed());
  });

  it("should return correct balances when rfq is created -- user", async function () {
    const user = this.signers.user.getAddress();
    const marginBalanceA = await this.accountFacet.getMarginBalance(user);
    const lockedMarginReservedA = await this.accountFacet.getLockedMarginReserved(user);

    expect(marginBalanceA.toString()).to.equal(new BigNumber(68_000).times(PRECISION).toFixed());
    expect(lockedMarginReservedA.toString()).to.equal(new BigNumber(32_000).times(PRECISION).toFixed());
  });

  it("should return correct balances when rfq is created -- hedger", async function () {
    const hedger = this.signers.hedger.getAddress();
    const marginBalanceB = await this.accountFacet.getMarginBalance(hedger);
    const lockedMarginReservedB = await this.accountFacet.getLockedMarginReserved(hedger);

    expect(marginBalanceB.toString()).to.equal(new BigNumber(100_000).times(PRECISION).toFixed());
    expect(lockedMarginReservedB.toString()).to.equal("0");
  });

  it("should request for a cancelation -- wrong party requesting", async function () {
    await expect(this.openMarketSingleFacet.connect(this.signers.admin).cancelOpenMarketSingle(0)).to.be.revertedWith(
      "Invalid party",
    );
  });

  it("should request for a cancelation -- will not be honored by hedger", async function () {
    await expect(this.openMarketSingleFacet.connect(this.signers.user).cancelOpenMarketSingle(0)).to.not.reverted;
  });

  it("should fail to accept the rfq -- wrong party replying", async function () {
    await expect(
      this.openMarketSingleFacet
        .connect(this.signers.user)
        .fillOpenMarketSingle(
          this.signers.user.getAddress(),
          0,
          new BigNumber(1_000).times(PRECISION).toFixed(),
          new BigNumber(100_000).times(PRECISION).toFixed(),
          new BigNumber(100).times(PRECISION).toFixed(),
        ),
    ).to.be.revertedWith("Invalid party");
  });

  it("should fill the rfq -- 1000 units at 100$ a piece", async function () {
    await expect(
      this.openMarketSingleFacet
        .connect(this.signers.hedger)
        .fillOpenMarketSingle(
          this.signers.user.getAddress(),
          0,
          new BigNumber(1_000).times(PRECISION).toFixed(),
          new BigNumber(100_000).times(PRECISION).toFixed(),
          new BigNumber(100).times(PRECISION).toFixed(),
        ),
    ).to.not.reverted;
  });

  it("should return correct balances when rfq is accepted -- user", async function () {
    const user = this.signers.user.getAddress();
    const marginBalanceA = await this.accountFacet.getMarginBalance(user);
    const lockedMarginA = await this.accountFacet.getLockedMargin(user);

    expect(marginBalanceA.toString()).to.equal(new BigNumber(68_000).times(PRECISION).toFixed());
    expect(lockedMarginA.toString()).to.equal(new BigNumber(32_000).times(PRECISION).toFixed());
  });

  it("should return correct balances when rfq is accepted -- hedger", async function () {
    const hedger = this.signers.hedger.getAddress();
    const marginBalanceB = await this.accountFacet.getMarginBalance(hedger);
    const lockedMarginB = await this.accountFacet.getLockedMargin(hedger);

    expect(marginBalanceB.toString()).to.equal(new BigNumber(68_000).times(PRECISION).toFixed());
    expect(lockedMarginB.toString()).to.equal(new BigNumber(32_000).times(PRECISION).toFixed());
  });

  it("should fail to force a cancelation -- hedger already accepted", async function () {
    await expect(
      this.openMarketSingleFacet.connect(this.signers.user).forceCancelOpenMarketSingle(0),
    ).to.be.revertedWith("Invalid RFQ state");
  });

  it("should return the open positions", async function () {
    const userOpenPositions = await this.masterFacet.getOpenPositions(this.signers.user.getAddress());
    const hedgerOpenPositions = await this.masterFacet.getOpenPositions(this.signers.hedger.getAddress());

    expect(userOpenPositions.length).to.equal(1);
    expect(hedgerOpenPositions.length).to.equal(1);
    expect(userOpenPositions[0].positionId.toString()).to.equal(hedgerOpenPositions[0].positionId.toString());
  });

  it("should fail to create another rfq -- notional too high", async function () {
    await expect(
      this.openMarketSingleFacet
        .connect(this.signers.user)
        .requestOpenMarketSingle(
          this.signers.hedger.getAddress(),
          marketId,
          Side.BUY,
          new BigNumber(10_000).times(PRECISION).toFixed(),
          30,
          marginRequiredPercentage,
          [],
          reqId,
          [],
        ),
    ).to.be.revertedWith("Insufficient margin balance");
  });

  it("should fail to create another RFQ -- insolvency safeguard", async function () {
    /**
     * LockedMarginA = 32_000
     * LiquidationTreshold at 30% => 32_000 + UPnL > 9_600
     * UPnL = -22_400
     * InitialNotional = 100_000$ with 1_000 units
     * Price to fail safeguard = 100_000 - 22_400 / 1_000 = 77.60$
     */

    await expect(
      this.openMarketSingleFacet.connect(this.signers.user).requestOpenMarketSingle(
        this.signers.hedger.getAddress(),
        marketId,
        Side.BUY,
        new BigNumber(5_000).times(PRECISION).toFixed(),
        1,
        marginRequiredPercentage,
        [
          {
            marketId,
            bidPrice: new BigNumber(77.59).times(PRECISION).toFixed(),
            askPrice: new BigNumber(30).times(PRECISION).toFixed(),
          },
        ],
        reqId,
        [],
      ),
    ).to.be.revertedWith("PartyA fails solvency safeguard");
  });

  it("should create another RFQ -- immediately force a cancelation (fail)", async function () {
    await expect(
      this.openMarketSingleFacet.connect(this.signers.user).requestOpenMarketSingle(
        this.signers.hedger.getAddress(),
        marketId,
        Side.BUY,
        new BigNumber(5_000).times(PRECISION).toFixed(),
        1,
        marginRequiredPercentage,
        [
          {
            marketId,
            bidPrice: new BigNumber(99).times(PRECISION).toFixed(),
            askPrice: new BigNumber(101).times(PRECISION).toFixed(),
          },
        ],
        reqId,
        [],
      ),
    ).to.not.reverted;

    const rfqId = 1; // above will generate this rfqid

    await expect(
      this.openMarketSingleFacet.connect(this.signers.user).forceCancelOpenMarketSingle(rfqId),
    ).to.be.revertedWith("Invalid RFQ state");

    await expect(this.openMarketSingleFacet.connect(this.signers.user).cancelOpenMarketSingle(rfqId)).to.not.reverted;

    const MINUTE = 61;
    await network.provider.request({
      method: "evm_increaseTime",
      params: [MINUTE],
    });

    await expect(this.openMarketSingleFacet.connect(this.signers.user).forceCancelOpenMarketSingle(rfqId)).to.not
      .reverted;

    const rfq = await this.masterFacet.getRequestForQuote(this.signers.user.getAddress(), rfqId);
    expect(rfq.state).to.equal(2); // CANCELED
  });

  it("should fail to accept RFQ -- it just got cancelled", async function () {
    await expect(
      this.openMarketSingleFacet
        .connect(this.signers.hedger)
        .fillOpenMarketSingle(
          this.signers.user.getAddress(),
          1,
          new BigNumber(1_000).times(PRECISION).toFixed(),
          new BigNumber(100_000).times(PRECISION).toFixed(),
          new BigNumber(100).times(PRECISION).toFixed(),
        ),
    ).to.be.revertedWith("Invalid RFQ state");
  });
}
