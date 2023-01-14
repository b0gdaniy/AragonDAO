// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

import "./GovernorCountingSimpleUpdated.sol";

contract AragonDAO is
    Governor,
    GovernorCountingSimpleUpdated,
    GovernorVotes,
    GovernorVotesQuorumFraction
{
    uint256 private _votingDelay;
    uint256 private _votingPeriod;

    constructor(
        IVotes _token,
        uint256 delayInBlocks,
        uint256 periodInBlocks,
        uint256 _quorum
    )
        Governor("AragonDAO")
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(_quorum)
    {
        _votingDelay = delayInBlocks;
        _votingPeriod = periodInBlocks;
    }

    function votingDelay() public view override returns (uint256) {
        return _votingDelay; // 1 block
    }

    function votingPeriod() public view override returns (uint256) {
        return _votingPeriod; // 1 week
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }
}
