// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract AragonERC20Token is ERC20Votes {
    constructor(uint256 _initialSupply)
        ERC20("AragonERC20Token", "ARG")
        ERC20Permit("AragonERC20Token")
    {
        _mint(msg.sender, _initialSupply);
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

    function undelegate() public virtual {
        _undelegate(_msgSender());
    }

    function _undelegate(address delegator) internal virtual {
        _delegate(delegator, _msgSender());
    }
}
