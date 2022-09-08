const hre = require("hardhat");
const ethers = hre.ethers

async function main() {
  [executor, proposer] = await ethers.getSigners()

  const thousandTokens = ethers.utils.parseEther("1000");

  const Token = await ethers.getContractFactory("AragonERC20Token", executor)
  const token = await Token.deploy(thousandTokens)
  await token.deployed()

  // const Token = await ethers.getContractFactory("AragonToken", executor)
  // token = await Token.deploy(100)
  // await token.deployed()

  // for (let i = 1; i <= 100; ++i) {
  //   if (i <= 10) {
  //     await token._safeTransferFrom(executor.address, user1.address, i)
  //   } else if (i > 10 && i <= 20) {
  //     await token._safeTransferFrom(executor.address, user2.address, i)
  //   } else if (i > 20 && i <= 30) {
  //     await token._safeTransferFrom(executor.address, user3.address, i)
  //   } else if (i > 30 && i <= 40) {
  //     await token._safeTransferFrom(executor.address, user4.address, i)
  //   } else if (i > 40 && i <= 50) {
  //     await token._safeTransferFrom(executor.address, user5.address, i)
  //   }
  // }

  const Governance = await ethers.getContractFactory("AragonDAO", executor)
  const governance = await Governance.deploy(token.address, 1, 5, 4)
  await governance.deployed()

  const ContractToVote = await ethers.getContractFactory("Contract", executor)
  const contractToVote = await ContractToVote.deploy()
  await contractToVote.deployed()
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
