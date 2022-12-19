import { deployments } from "hardhat";
import { Diamond } from "../../src/types";

export const deployDiamondFixture = deployments.createFixture(async ({ deployments, ethers }) => {
  await deployments.fixture();
  const diamond = await deployments.get("Diamond");
  return (await ethers.getContractAt("Diamond", diamond.address)) as Diamond;
});
