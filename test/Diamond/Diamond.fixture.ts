import { run } from "hardhat";

import { Diamond } from "../../src/types";

export async function deployDiamondFixture(): Promise<Diamond> {
  return await run("deploy:diamond", {
    logData: false,
    reportGas: true,
  });
}
