import BigNumber from "bignumber.js";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import hexToUuid from "hex-to-uuid";
import { v4 as uuidv4 } from "uuid";
import uuidToHex from "uuid-to-hex";

import { PRECISION } from "../constants";
import { PositionType, Side } from "../types";

export function shouldBehaveLikeOpenMarketSingleFacet(): void {
  let marketId = 1;
  let rfqId = 1;
  let positionId = 1;
  let uuid = uuidv4();
  let uuidHex = uuidToHex(uuid, true);
  let bytes16 = ethers.utils.arrayify(uuidHex);

  it("should mint the user & hedger some collateral", async function () {
    await this.collateral.mint(this.signers.user.getAddress(), new BigNumber(1_000_000).times(PRECISION).toFixed());
    await this.collateral.mint(this.signers.hedger.getAddress(), new BigNumber(1_000_000).times(PRECISION).toFixed());
    await this.collateral.connect(this.signers.user).approve(this.diamond.address, ethers.constants.MaxUint256);
    await this.collateral.connect(this.signers.hedger).approve(this.diamond.address, ethers.constants.MaxUint256);

    await this.accountFacet
      .connect(this.signers.user)
      .depositAndAllocate(new BigNumber(1_000_000).times(PRECISION).toFixed());
    await this.accountFacet
      .connect(this.signers.hedger)
      .depositAndAllocate(new BigNumber(1_000_000).times(PRECISION).toFixed());
  });

  it("should request for a quote", async function () {
    await expect(
      this.openMarketSingleFacet
        .connect(this.signers.user)
        .requestOpenMarketSingle(
          this.signers.hedger.getAddress(),
          marketId,
          PositionType.ISOLATED,
          Side.BUY,
          new BigNumber(10_000).times(PRECISION).toFixed(),
          10,
          [new BigNumber(100_000).times(PRECISION).toFixed(), new BigNumber(100_000).times(PRECISION).toFixed()],
        ),
    ).to.not.reverted;

    const rfq = await this.masterFacet.getRequestForQuote(rfqId);
    expect(rfq.lockedMarginA.toString()).to.equal(new BigNumber(10_000).times(PRECISION).toFixed());
    expect(rfq.notionalUsd.toString()).to.equal(new BigNumber(100_000).times(PRECISION).toFixed());
    expect(rfq.lockedMarginA.toString()).to.equal(new BigNumber(10_000).times(PRECISION).toFixed());
    expect(rfq.protocolFee.toString()).to.equal(new BigNumber(50).times(PRECISION).toFixed());
    expect(rfq.liquidationFee.toString()).to.equal(new BigNumber(500).times(PRECISION).toFixed());
    expect(rfq.cva.toString()).to.equal(new BigNumber(2000).times(PRECISION).toFixed());
  });

  it("should have generated an rfqId of #1", async function () {
    const user = await this.signers.user.getAddress();
    const rfq = await this.masterFacet.getRequestForQuote(rfqId);
    expect(rfq.partyA).to.equal(user);
  });

  it("should return correct balances when rfq is created -- user", async function () {
    const user = this.signers.user.getAddress();

    const marginBalanceA = await this.accountFacet.getMarginBalance(user);
    const lockedMarginReservedA = await this.accountFacet.getLockedMarginReserved(user);

    const spent = new BigNumber(10_000).plus(50).plus(500).plus(2000);
    expect(marginBalanceA.toString()).to.equal(new BigNumber(1_000_000).minus(spent).times(PRECISION).toFixed());
    expect(lockedMarginReservedA.toString()).to.equal(spent.times(PRECISION).toFixed());
  });

  it("should return correct balances when rfq is created -- hedger", async function () {
    const hedger = this.signers.hedger.getAddress();

    const marginBalanceB = await this.accountFacet.getMarginBalance(hedger);
    const lockedMarginReservedB = await this.accountFacet.getLockedMarginReserved(hedger);
    expect(marginBalanceB.toString()).to.equal(new BigNumber(1_000_000).times(PRECISION).toFixed());
    expect(lockedMarginReservedB.toString()).to.equal("0");
  });

  it("should request for a cancelation -- wrong party requesting", async function () {
    await expect(
      this.openMarketSingleFacet.connect(this.signers.admin).cancelOpenMarketSingle(rfqId),
    ).to.be.revertedWith("Invalid party");
  });

  it("should request for a cancelation -- will not be honored by hedger", async function () {
    await expect(this.openMarketSingleFacet.connect(this.signers.user).cancelOpenMarketSingle(rfqId)).to.not.reverted;
  });

  it("should fail to accept the rfq -- wrong party replying", async function () {
    await expect(
      this.openMarketSingleFacet
        .connect(this.signers.user)
        .fillOpenMarketSingle(
          rfqId,
          new BigNumber(100_000).times(PRECISION).toFixed(),
          new BigNumber(1).times(PRECISION).toFixed(),
          bytes16,
        ),
    ).to.be.revertedWith("Invalid party");
  });

  it("should fill the rfq -- 100_000 units at 1$ a piece", async function () {
    await expect(
      this.openMarketSingleFacet
        .connect(this.signers.hedger)
        .fillOpenMarketSingle(
          rfqId,
          new BigNumber(100_000).times(PRECISION).toFixed(),
          new BigNumber(1).times(PRECISION).toFixed(),
          bytes16,
        ),
    ).to.not.reverted;
  });

  it("should bind the RFQ to positionId #1", async function () {
    const user = await this.signers.user.getAddress();
    const position = await this.masterFacet.getPosition(positionId);
    expect(position.partyA).to.equal(user);
  });

  it("should be able to recover the uuid", async function () {
    const position = await this.masterFacet.getPosition(positionId);
    const recovered = hexToUuid(position.uuid);
    expect(recovered).to.equal(uuid);
  });

  it("should return correct balances when rfq is accepted -- hedger", async function () {
    const hedger = this.signers.hedger.getAddress();

    const marginBalanceB = await this.accountFacet.getMarginBalance(hedger);
    const { lockedMarginB } = await this.masterFacet.getPosition(positionId);

    // no protocol fee
    const spent = new BigNumber(10_000).plus(500).plus(2000);
    expect(marginBalanceB.toString()).to.equal(new BigNumber(1_000_000).minus(spent).times(PRECISION).toFixed());
    expect(lockedMarginB.toString()).to.equal(new BigNumber(10_000).times(PRECISION).toFixed());
  });

  it("should fail to force a cancelation -- hedger already accepted", async function () {
    await expect(
      this.openMarketSingleFacet.connect(this.signers.user).forceCancelOpenMarketSingle(rfqId),
    ).to.be.revertedWith("Invalid RFQ state");
  });

  it("should fail to create another rfq -- notional too high", async function () {
    await expect(
      this.openMarketSingleFacet
        .connect(this.signers.user)
        .requestOpenMarketSingle(
          this.signers.hedger.getAddress(),
          marketId,
          PositionType.ISOLATED,
          Side.BUY,
          new BigNumber(1_000_000).times(PRECISION).toFixed(),
          10,
          [new BigNumber(100_000).times(PRECISION).toFixed(), new BigNumber(100_000).times(PRECISION).toFixed()],
        ),
    ).to.be.revertedWith("Insufficient margin balance");
  });

  it("should create another RFQ -- immediately force a cancelation (fail)", async function () {
    await expect(
      this.openMarketSingleFacet
        .connect(this.signers.user)
        .requestOpenMarketSingle(
          this.signers.hedger.getAddress(),
          marketId,
          PositionType.ISOLATED,
          Side.BUY,
          new BigNumber(100_000).times(PRECISION).toFixed(),
          10,
          [new BigNumber(100_000).times(PRECISION).toFixed(), new BigNumber(100_000).times(PRECISION).toFixed()],
        ),
    ).to.not.reverted;

    const id = 2; // above will generate this rfqid
    await expect(
      this.openMarketSingleFacet.connect(this.signers.user).forceCancelOpenMarketSingle(id),
    ).to.be.revertedWith("Invalid RFQ state");

    // request a cancellation
    await expect(this.openMarketSingleFacet.connect(this.signers.user).cancelOpenMarketSingle(id)).to.not.reverted;

    let rfq = await this.masterFacet.getRequestForQuote(id);
    expect(rfq.state).to.equal(1); // CANCELATION_REQUESTED

    const TIMEOUT = 119;
    await network.provider.request({
      method: "evm_increaseTime",
      params: [TIMEOUT],
    });

    await expect(
      this.openMarketSingleFacet.connect(this.signers.user).forceCancelOpenMarketSingle(id),
    ).to.be.revertedWith("Request Timeout");

    await network.provider.request({
      method: "evm_increaseTime",
      params: [2], // 2 extra seconds
    });

    await expect(this.openMarketSingleFacet.connect(this.signers.user).forceCancelOpenMarketSingle(id)).to.not.reverted;

    rfq = await this.masterFacet.getRequestForQuote(id);
    expect(rfq.state).to.equal(2); // CANCELED
  });

  it("should fail to accept RFQ -- it just got cancelled", async function () {
    const previousRfqId = 2;
    await expect(
      this.openMarketSingleFacet
        .connect(this.signers.hedger)
        .fillOpenMarketSingle(
          previousRfqId,
          new BigNumber(100_000).times(PRECISION).toFixed(),
          new BigNumber(1).times(PRECISION).toFixed(),
          bytes16,
        ),
    ).to.be.revertedWith("Invalid RFQ state");
  });
}
