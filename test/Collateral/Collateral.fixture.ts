import { run } from "hardhat";

import { FakeStablecoin } from "../../src/types";

export async function deployFakeStablecoin(): Promise<FakeStablecoin> {
  return await run("deploy:stablecoin");
}
