const hre = require("hardhat");
const ethers = hre.ethers
const tokenArtifact = require("../artifacts/contracts/VoteToken.sol/AragonToken.json")

const description = "Call function from Contract"

async function main() {
	[executor, proposer, user1, user2, user3, user4, user5] = await ethers.getSigners()
	const token = new ethers.Contract(
		"0x5FbDB2315678afecb367f032d93F642f64180aa3",
		tokenArtifact.abi,
		executor
	)

	await token.transfer(user1.address, fiftyTokens)
	await token.transfer(user2.address, fiftyTokens)
	await token.transfer(user3.address, fiftyTokens)
	await token.transfer(user4.address, fiftyTokens)
	await token.transfer(user5.address, fiftyTokens)

	const user1Delegate = await token.connect(user1).delegate(user1.address)
	await user1Delegate.wait()
	const user2Delegate = await token.connect(user2).delegate(user2.address)
	await user2Delegate.wait()
	const user3Delegate = await token.connect(user3).delegate(user3.address)
	await user3Delegate.wait()
	const user4Delegate = await token.connect(user4).delegate(user4.address)
	await user4Delegate.wait()
	const user5Delegate = await token.connect(user5).delegate(user5.address)
	await user5Delegate.wait()
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
