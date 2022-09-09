const { expect } = require("chai");
const { ethers } = require("hardhat");

let delay = ms => new Promise(res => setTimeout(res, ms))

describe("AragonDAO", function () {
  let governance, token, timelock, contract // contracts
  let executor, proposer, user1, user2, user3, user4, user5 // accounts

  let propose

  let encodedFuntion
  const description = "Call function from Contract"
  let hash

  let vote
  let proposalId

  let fiftyTokens

  beforeEach(async () => {
    [executor, proposer, user1, user2, user3, user4, user5] = await ethers.getSigners()

    const thousandTokens = ethers.utils.parseEther("1000");
    fiftyTokens = ethers.utils.parseEther("50");

    const Token = await ethers.getContractFactory("AragonERC20Token", executor)
    token = await Token.deploy(thousandTokens, 10, true)
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

    await token.transfer(user1.address, fiftyTokens)
    await token.transfer(user2.address, fiftyTokens)
    await token.transfer(user3.address, fiftyTokens)
    await token.transfer(user4.address, fiftyTokens)
    await token.transfer(user5.address, fiftyTokens)

    const Governance = await ethers.getContractFactory("AragonDAO", executor)
    governance = await Governance.deploy(token.address, 1, 5, 4)
    await governance.deployed()

    const Contract = await ethers.getContractFactory("Contract", executor)
    contract = await Contract.deploy()
    await contract.deployed()

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
    encodedFuntion = iface.encodeFunctionData("release", [])

    propose = await governance.connect(proposer).propose([contract.address], [0], [encodedFuntion], description)
    const proposeReceipt = await propose.wait()
    const event = proposeReceipt.events.find(event => event.event === "ProposalCreated");
    [proposalId] = event.args;

    hash = ethers.utils.id("Call function from Contract")
  })

  it("deployed", async () => {
    expect(governance.address).to.be.properAddress
    expect(token.address).to.be.properAddress
  })

  it("contains the correct names", async () => {
    expect(await governance.name()).to.eq("AragonDAO")
    expect(await token.name()).to.eq("AragonERC20Token")
  })

  it("delegates voting", async () => {
    expect(await token.delegates(user1.address)).to.eq(user1.address)
    expect(await token.delegates(user2.address)).to.eq(user2.address)
    expect(await token.delegates(user3.address)).to.eq(user3.address)
    expect(await token.delegates(user4.address)).to.eq(user4.address)
    expect(await token.delegates(user5.address)).to.eq(user5.address)
  })

  it("voting correct", async () => {
    await ethers.provider.send('evm_mine', [])
    // 0 = Against, 1 = For, 2 = Abstain
    vote = await governance.connect(user1).castVote(proposalId, 1)
    vote = await governance.connect(user2).castVote(proposalId, 2)
    vote = await governance.connect(user3).castVote(proposalId, 1)
    vote = await governance.connect(user4).castVote(proposalId, 1)
    vote = await governance.connect(user5).castVote(proposalId, 0)

    expect(await governance.hasVotedOn(proposalId, user1.address)).to.eq(1)
    expect(await governance.hasVotedOn(proposalId, user2.address)).to.eq(2)
    expect(await governance.hasVotedOn(proposalId, user3.address)).to.eq(1)
    expect(await governance.hasVotedOn(proposalId, user4.address)).to.eq(1)
    expect(await governance.hasVotedOn(proposalId, user5.address)).to.eq(0)

    // created for moves forward one block after the voting
    const transfer = await token.transfer(proposer.address, 80)
    await transfer.wait()

    const { againstVotes, forVotes, abstainVotes } = await governance.proposalVotes(proposalId)

    expect(againstVotes.toString()).to.eq(fiftyTokens)
    expect(forVotes.toString()).to.eq(fiftyTokens.mul(3))
    expect(abstainVotes.toString()).to.eq(fiftyTokens)
  })

  it("voting weight correct", async () => {
    (await token.transfer(user1.address, fiftyTokens)).wait()
    // 0 = Against, 1 = For, 2 = Abstain
    vote = await governance.connect(user1).castVote(proposalId, 0)
    vote = await governance.connect(user2).castVote(proposalId, 2)
    vote = await governance.connect(user3).castVote(proposalId, 1)
    vote = await governance.connect(user4).castVote(proposalId, 1)
    vote = await governance.connect(user5).castVote(proposalId, 0)

    // created for moves forward one block after the voting
    const transfer = await token.transfer(proposer.address, 80)
    await transfer.wait()

    const { againstVotes, forVotes, abstainVotes } = await governance.proposalVotes(proposalId)

    expect(againstVotes.toString()).to.eq(fiftyTokens.mul(3))
    expect(forVotes.toString()).to.eq(fiftyTokens.mul(2))
    expect(abstainVotes.toString()).to.eq(fiftyTokens)
  })

  it("executed", async () => {
    await ethers.provider.send('evm_mine', [])
    vote = await governance.connect(user1).castVote(proposalId, 0)
    vote = await governance.connect(user2).castVote(proposalId, 2)
    vote = await governance.connect(user3).castVote(proposalId, 1)
    vote = await governance.connect(user4).castVote(proposalId, 1)
    vote = await governance.connect(user5).castVote(proposalId, 1)

    // created for moves forward one block after the voting
    const transfer = await token.transfer(proposer.address, 80)
    await transfer.wait()

    // await network.provider.send("evm_increaseTime", [50000]);
    await network.provider.send("evm_mine", []);
    await network.provider.send("evm_mine", []);
    await network.provider.send("evm_mine", []);
    await network.provider.send("evm_mine", []);
    await network.provider.send("evm_mine", []);
    await network.provider.send("evm_mine", []);
    await network.provider.send("evm_mine", []);

    await governance.connect(executor).execute([contract.address], [0], [encodedFuntion], hash)

    expect(await contract.isConractReleased()).to.eq("Contract released")
  })
});

describe("Override vote", function () {
  let governance, token, contract // contracts
  let executor, proposer, user1, user2, user3, user4, user5 // accounts

  let propose

  let encodedFuntion
  const description = "Call function from Contract"
  let hash

  let vote
  let proposalId

  let fiftyTokens

  beforeEach(async () => {
    [executor, proposer, user1, user2, user3, user4, user5] = await ethers.getSigners()

    const thousandTokens = ethers.utils.parseEther("1000");
    fiftyTokens = ethers.utils.parseEther("50");

    const Token = await ethers.getContractFactory("AragonERC20Token", executor)
    token = await Token.deploy(thousandTokens, 10, true)
    await token.deployed()

    await token.transfer(user1.address, fiftyTokens)
    await token.transfer(user2.address, fiftyTokens)
    await token.transfer(user3.address, fiftyTokens)
    await token.transfer(user4.address, fiftyTokens)
    await token.transfer(user5.address, fiftyTokens)

    const Governance = await ethers.getContractFactory("AragonDAO", executor)
    governance = await Governance.deploy(token.address, 1, 5, 4)
    await governance.deployed()

    const Contract = await ethers.getContractFactory("Contract", executor)
    contract = await Contract.deploy()
    await contract.deployed()

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
    encodedFuntion = iface.encodeFunctionData("release", [])

    propose = await governance.connect(proposer).propose([contract.address], [0], [encodedFuntion], description)
    const proposeReceipt = await propose.wait()
    const event = proposeReceipt.events.find(event => event.event === "ProposalCreated");
    [proposalId] = event.args;

    await governance.quorum((await ethers.provider.getBlockNumber()) - 1)

    hash = ethers.utils.id("Call function from Contract")
  })

  it("overriding votes correct", async () => {
    const tx = await token.transfer(user2.address, fiftyTokens)
    await tx.wait()

    // 0 = Against, 1 = For, 2 = Abstain
    vote = await governance.connect(user2).castVote(proposalId, 2)

    vote = await governance.connect(user2).castVote(proposalId, 0)

    vote = await governance.connect(user3).castVote(proposalId, 1)
    vote = await governance.connect(user4).castVote(proposalId, 1)
    vote = await governance.connect(user5).castVote(proposalId, 0)

    // created for moves forward one block after the voting
    const transfer = await token.transfer(proposer.address, 80)
    await transfer.wait()

    const { againstVotes, forVotes, abstainVotes } = await governance.proposalVotes(proposalId)

    expect(againstVotes.toString()).to.eq(fiftyTokens.mul(3))
    expect(forVotes.toString()).to.eq(fiftyTokens.mul(2))
    expect(abstainVotes.toString()).to.eq("0")
  })
});

describe("Undelegates", function () {
  let token, timelock// contracts
  let executor, proposer, user1, user2, user3// accounts

  let fiftyTokens

  let timelockDelay = 10

  let timestamp

  beforeEach(async () => {
    [executor, proposer, user1, user2, user3, user4] = await ethers.getSigners()

    const thousandTokens = ethers.utils.parseEther("1000");
    fiftyTokens = ethers.utils.parseEther("50");

    const Token = await ethers.getContractFactory("AragonERC20Token", executor)
    token = await Token.deploy(thousandTokens, timelockDelay, true)
    await token.deployed()

    const TimeLock = await ethers.getContractFactory("UndelegateTimelock", executor)
    timelock = await TimeLock.deploy(true, timelockDelay)
    await timelock.deployed();

    timestamp = 1662684302 + 100;

    const queued = await timelock.queue(token.address, 0, "autoUndelegate()", 0x00, timestamp)
    await queued.wait()

    await token.transfer(user1.address, fiftyTokens)
    await token.transfer(user2.address, fiftyTokens)
    await token.transfer(user3.address, fiftyTokens)

    const user1Delegate = await token.connect(user1).delegate(user2.address)
    await user1Delegate.wait()
    const user2Delegate = await token.connect(user2).delegate(user2.address)
    await user2Delegate.wait()
    const user3Delegate = await token.connect(user3).delegate(user2.address)
    await user3Delegate.wait()
  })

  it("delegates correctly", async () => {
    expect(await token.delegates(user1.address)).to.eq(user2.address)
    expect(await token.delegates(user2.address)).to.eq(user2.address)
    expect(await token.delegates(user3.address)).to.eq(user2.address)
  })

  it("send correct indexes", async () => {
    expect(await token.indexOf(user1.address)).to.eq(0)
    expect(await token.indexOf(user2.address)).to.eq(1)
    expect(await token.indexOf(user3.address)).to.eq(2)
  })

  it("correct added to delegators", async () => {
    const user1Index = await token.indexOf(user1.address)
    const user2Index = await token.indexOf(user2.address)
    const user3Index = await token.indexOf(user3.address)


    expect(await token.delegators(user1Index)).to.eq(user1.address)
    expect(await token.delegators(user2Index)).to.eq(user2.address)
    expect(await token.delegators(user3Index)).to.eq(user3.address)
  })

  it("undelegates", async () => {
    const user1Undelegate = await token.connect(user1).undelegate()
    await user1Undelegate.wait()

    const user3Undelegate = await token.connect(user3).undelegate()
    await user3Undelegate.wait()

    expect(await token.delegates(user1.address)).to.eq(user1.address)
    expect(await token.delegates(user3.address)).to.eq(user3.address)
  })
});