const hre = require("hardhat");
const ethers = hre.ethers
const govArtifact = require("../artifacts/contracts/AragonDAO.sol/AragonDAO.json")
const tokenArtifact = require("../artifacts/contracts/VoteToken.sol/AragonToken.json")
const contractArtifact = require("../artifacts/contracts/Contract.sol/Contract.json")

const description = "Call function from Contract"

async function main() {
	[executor, proposer, user1, user2, user3, user4, user5] = await ethers.getSigners()
	const token = new ethers.Contract(
		"0x5FbDB2315678afecb367f032d93F642f64180aa3",
		tokenArtifact.abi,
		executor
	)
	const governance = new ethers.Contract(
		"0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
		govArtifact.abi,
		executor
	)
	const contract = new ethers.Contract(
		"0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
		contractArtifact.abi,
		executor
	)

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

	let ABI = ["function release()"]
	let iface = new ethers.utils.Interface(ABI)
	const encodedFuntion = iface.encodeFunctionData("release", [])

	propose = await governance.connect(proposer).propose([contract.address], [0], [encodedFuntion], description)

	const event = await governance.queryFilter("ProposalCreated", propose.blockHash)
	console.log(event)
	// governance.filters.ProposalCreated()
	// const proposeReceipt = await propose.wait()
	// const event = proposeReceipt.events.find(event => event.event === "ProposalCreated");
	// [proposalId] = event.args;

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
