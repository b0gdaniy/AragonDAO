// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AragonERC20Token is Ownable, ERC20Votes {
    uint256 public timelockDelay;
    address[] private _delegators;
    uint256[] private _indexOfRemoved;
    mapping(address => uint256) private _indexOf;
    mapping(address => uint256) private _delegatedToSuch;

    constructor(
        uint256 _initialSupply,
        uint256 _timelockDelay,
        bool isDelayInSeconds
    )
        Ownable()
        ERC20("AragonERC20Token", "ARG")
        ERC20Permit("AragonERC20Token")
    {
        _mint(msg.sender, _initialSupply);
        if (!isDelayInSeconds) {
            timelockDelay = _timelockDelay * 1 days;
        }
        timelockDelay = _timelockDelay;
    }

    function delegatedToSuch(address account) public view returns (uint256) {
        return _delegatedToSuch[account];
    }

    function indexOf(address account) public view returns (uint256) {
        return _indexOf[account];
    }

    function delegators(uint256 index) public view returns (address) {
        return _delegators[index];
    }

    function _delegate(address delegator, address delegatee) internal override {
        for (uint256 i = 0; i < _indexOfRemoved.length; ++i) {
            if (_indexOfRemoved[i] != 0) {
                _delegators[i] = delegator;
                break;
            }
        }
        _delegators.push(delegator);
        _indexOf[delegator] = _delegators.length - 1;
        _delegatedToSuch[delegator] = block.timestamp + timelockDelay;
        super._delegate(delegator, delegatee);
    }

    function autoUndelegate() external {
        require(
            owner() == msg.sender || msg.sender.code.length > 0,
            "You dont have permissions"
        );
        for (uint256 i = 0; i < _delegators.length; ++i) {
            if (_delegatedToSuch[_delegators[i]] >= block.timestamp) {
                _undelegate(_delegators[i]);
            }
        }
    }

    function undelegate() public {
        _undelegate(_msgSender());
    }

    function _undelegate(address delegator) internal {
        removeDelegator(delegator);
        _delegate(delegator, delegator);
        removeDelegator(delegator);
    }

    function removeDelegator(address _delegator) private {
        _indexOfRemoved.push(indexOf(_delegator));
        _delegators[indexOf(_delegator)] = _delegators[_delegators.length - 1];
        _indexOf[_delegator] = 0;
        delete _delegators[_delegators.length - 1];
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount) internal override(ERC20Votes) {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20Votes)
    {
        super._burn(account, amount);
    }
}
