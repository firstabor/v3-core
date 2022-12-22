import { assert } from "chai";

export function shouldBehaveLikeDiamond(): void {
  const addresses: string[] = [];

  it("should have 23 facets", async function () {
    for (const address of await this.diamondLoupe.facetAddresses()) {
      addresses.push(address);
    }
    assert.equal(addresses.length, 23);
  });
}
