import { run } from "hardhat";

import { Diamond, FakeStablecoin } from "../../src/types";
import { deployFakeStablecoin } from "../Collateral/Collateral.fixture";

export async function deployDiamondFixture(): Promise<{ diamond: Diamond; collateral: FakeStablecoin }> {
  const collateral = await deployFakeStablecoin();

  const diamond = await run("deploy:diamond", {
    logData: false,
    genABI: false,
    reportGas: true,
  });

  return { diamond, collateral };
}
