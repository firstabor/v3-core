import { run } from "hardhat";

import { Diamond, FakeStablecoin } from "../../src/types";
import { deployFakeStablecoin } from "../Collateral/Collateral.fixture";

export async function deployDiamondFixture(): Promise<{ diamond: Diamond; collateral: FakeStablecoin }> {
  const collateral = await deployFakeStablecoin();

  const diamond = await run("deploy:diamond", {
    collateral: collateral.address,
    muon: "0x0000000000000000000000000000000000000000",
    logData: false,
    reportGas: true,
  });

  return { diamond, collateral };
}
