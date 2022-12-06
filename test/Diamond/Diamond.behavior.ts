import { assert } from "chai";
import { ethers } from "hardhat";

import { FacetCutAction, getSelectors } from "../../tasks/utils/diamondCut";

export function shouldBehaveLikeDiamond(): void {
  const addresses: string[] = [];
  let selectors: string[] = [];
  let result: string[] = [];

  it("should have 13 facets", async function () {
    for (const address of await this.diamondLoupeFacet.facetAddresses()) {
      addresses.push(address);
    }
    assert.equal(addresses.length, 13);
  });

  it("facets should have the right function selectors -- call to facetFunctionSelectors function", async function () {
    // DiamondCutFacet
    selectors = getSelectors(this.diamondCutFacet).selectors;
    result = await this.diamondLoupeFacet.facetFunctionSelectors(addresses[0]);
    assert.sameMembers(result, selectors);

    // DiamondLoupeFacet
    selectors = getSelectors(this.diamondLoupeFacet).selectors;
    result = await this.diamondLoupeFacet.facetFunctionSelectors(addresses[1]);
    assert.sameMembers(result, selectors);

    // ConstantsFacet
    selectors = getSelectors(this.constantsFacet).selectors;
    result = await this.diamondLoupeFacet.facetFunctionSelectors(addresses[2]);
    assert.sameMembers(result, selectors);

    // OwnershipFacet
    selectors = getSelectors(this.ownershipFacet).selectors;
    result = await this.diamondLoupeFacet.facetFunctionSelectors(addresses[3]);
    assert.sameMembers(result, selectors);

    // PauseFacet
    selectors = getSelectors(this.pauseFacet).selectors;
    result = await this.diamondLoupeFacet.facetFunctionSelectors(addresses[4]);
    assert.sameMembers(result, selectors);

    // AccountFacet
    selectors = getSelectors(this.accountFacet).selectors;
    result = await this.diamondLoupeFacet.facetFunctionSelectors(addresses[5]);
    assert.sameMembers(result, selectors);

    // HedgersFacet
    selectors = getSelectors(this.hedgersFacet).selectors;
    result = await this.diamondLoupeFacet.facetFunctionSelectors(addresses[6]);
    assert.sameMembers(result, selectors);

    // MarketsFacet
    selectors = getSelectors(this.marketsFacet).selectors;
    result = await this.diamondLoupeFacet.facetFunctionSelectors(addresses[7]);
    assert.sameMembers(result, selectors);

    // LiquidationFacet
    selectors = getSelectors(this.liquidationFacet).selectors;
    result = await this.diamondLoupeFacet.facetFunctionSelectors(addresses[8]);

    assert.sameMembers(result, selectors);

    // MasterFacet
    selectors = getSelectors(this.masterFacet).selectors;
    result = await this.diamondLoupeFacet.facetFunctionSelectors(addresses[9]);
    assert.sameMembers(result, selectors);

    // OpenMarketSingleFacet
    selectors = getSelectors(this.openMarketSingleFacet).selectors;
    result = await this.diamondLoupeFacet.facetFunctionSelectors(addresses[10]);
    assert.sameMembers(result, selectors);

    // CloseMarketSingleFacet
    selectors = getSelectors(this.closeMarketFacet).selectors;
    result = await this.diamondLoupeFacet.facetFunctionSelectors(addresses[11]);
    assert.sameMembers(result, selectors);

    // OracleFacet
    selectors = getSelectors(this.oracleFacet).selectors;
    result = await this.diamondLoupeFacet.facetFunctionSelectors(addresses[12]);
    assert.sameMembers(result, selectors);
  });

  it("should remove a function from AccountFacet -- getAccountBalance()", async function () {
    const AccountFacet = await ethers.getContractFactory("AccountFacet");
    const selectors = getSelectors(AccountFacet).get(["getAccountBalance(address)"]);
    const accountFacetAddress = addresses[5];

    const tx = await this.diamondCutFacet.diamondCut(
      [
        {
          facetAddress: ethers.constants.AddressZero,
          action: FacetCutAction.Remove,
          functionSelectors: selectors,
        },
      ],
      ethers.constants.AddressZero,
      "0x",
      { gasLimit: 800000 },
    );
    const receipt = await tx.wait();

    if (!receipt.status) {
      throw new Error(`Diamond upgrade failed: ${tx.hash}`);
    }

    const result = await this.diamondLoupeFacet.facetFunctionSelectors(accountFacetAddress);
    assert.sameMembers(result, getSelectors(AccountFacet).remove(["getAccountBalance(address)"]));
  });

  it("should add the getAccountBalance() function back", async function () {
    const AccountFacet = await ethers.getContractFactory("AccountFacet");
    const accountFacetAddress = addresses[5];

    const tx = await this.diamondCutFacet.diamondCut(
      [
        {
          facetAddress: accountFacetAddress,
          action: FacetCutAction.Add,
          functionSelectors: getSelectors(AccountFacet).get(["getAccountBalance(address)"]),
        },
      ],
      ethers.constants.AddressZero,
      "0x",
      { gasLimit: 800000 },
    );
    const receipt = await tx.wait();

    if (!receipt.status) {
      throw new Error(`Diamond upgrade failed: ${tx.hash}`);
    }

    const result = await this.diamondLoupeFacet.facetFunctionSelectors(accountFacetAddress);
    assert.sameMembers(result, getSelectors(AccountFacet).selectors);
  });
}
