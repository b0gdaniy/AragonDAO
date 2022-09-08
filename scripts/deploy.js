const hre = require("hardhat");
const ethers = hre.ethers

async function main() {
  [executor, proposer, user1, user2, user3, user4, user5] = await ethers.getSigners()

  const Token = await ethers.getContractFactory("AragonToken", executor)
  const token = await Token.deploy(100)
  await token.deployed()

  for (let i = 0; i < 100; ++i) {
    if (i < 10) {
      await token._safeTransferFrom(executor.address, user1.address, i)
    } else if (i > 9 && i <= 18) {
      await token._safeTransferFrom(executor.address, user2.address, i)
    } else if (i > 18 && i <= 25) {
      await token._safeTransferFrom(executor.address, user3.address, i)
    } else if (i > 25 && i <= 33) {
      await token._safeTransferFrom(executor.address, user4.address, i)
    } else if (i > 33 && i <= 39) {
      await token._safeTransferFrom(executor.address, user5.address, i)
    }
  }

  const Contract = await ethers.getContractFactory("Contract", executor)
  const contract = await Contract.deploy()
  await contract.deployed()

  const Governance = await ethers.getContractFactory("AragonDAO", executor)
  const governance = await Governance.deploy(token.address)
  await governance.deployed()

  console.log("token: ", token.address)
  console.log("contract: ", contract.address)
  console.log("governance: ", governance.address)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
