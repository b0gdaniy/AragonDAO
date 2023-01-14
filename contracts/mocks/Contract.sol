// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Contract is Ownable {
    bool public isReleased;

    function release() public {
        isReleased = true;
    }

    function isConractReleased() public view returns (string memory) {
        if (isReleased) {
            return "Contract released";
        }
        return "Not released";
    }
}
