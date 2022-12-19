import { expect } from "chai";
import { SIGNER_ROLE } from "../constants";

export function shouldBehaveLikeHedgerERC2771(): void {
  it("should attempt to call signer -- wrong role", async function () {
    const { owner } = this.signers;
    const calldata = this.masterAgreement.interface.encodeFunctionData("deposit", [0]);

    await expect(
      this.hedgerERC2771.connect(owner).callMasterAgreementSigner(this.masterAgreement.address, calldata),
    ).to.be.revertedWith(
      `AccessControl: account ${owner.address.toLowerCase()} is missing role ${SIGNER_ROLE.toLowerCase()}`,
    );
  });

  it("should attempt to call signer -- correct role", async function () {
    const { signer } = this.signers;
    const calldata = this.masterAgreement.interface.encodeFunctionData("deposit", [0]);

    await expect(this.hedgerERC2771.connect(signer).callMasterAgreementSigner(this.masterAgreement.address, calldata))
      .to.not.reverted;
  });
}
