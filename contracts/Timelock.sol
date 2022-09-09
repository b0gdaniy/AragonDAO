// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC20.sol";

contract UndelegateTimelock is Ownable {
    event Queue(
        bytes32 indexed txId,
        address indexed target,
        uint256 value,
        string func,
        bytes data,
        uint256 timestamp
    );
    event Executed(
        bytes32 indexed txId,
        address indexed target,
        uint256 value,
        string func,
        bytes data,
        uint256 timestamp
    );
    event Cancel(bytes32 indexed txId);

    uint256 public constant MIN_DELAY = 1; // seconds - 1 block
    uint256 public constant MAX_DELAY = 366 days;
    uint256 public delayOfExecute; // days

    // tx id => queued
    mapping(bytes32 => bool) public queued;

    constructor(bool isDelayInSeconds, uint256 _delayOfExecute) Ownable() {
        if (!isDelayInSeconds) {
            delayOfExecute = 1 days * _delayOfExecute;
        }
        delayOfExecute = _delayOfExecute;
    }

    function getTxId(
        address _target,
        uint256 _value,
        string calldata _func,
        bytes calldata _data,
        uint256 _timestamp
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(_target, _value, _func, _data, _timestamp));
    }

    function queue(
        address _target,
        uint256 _value, // amount of ETH to send
        string calldata _func,
        bytes calldata _data,
        uint256 _timestamp
    ) external onlyOwner returns (bytes32 txId) {
        txId = getTxId(_target, _value, _func, _data, _timestamp);

        require(!queued[txId], "Tx already queued!");
        require(
            _timestamp > block.timestamp + MIN_DELAY ||
                _timestamp < block.timestamp + MAX_DELAY,
            "Timestamp isn't in range"
        );

        queued[txId] = true;

        emit Queue(txId, _target, _value, _func, _data, _timestamp);
    }

    function execute(
        address _target,
        uint256 _value,
        string calldata _func,
        bytes calldata _data,
        uint256 _timestamp
    ) external payable onlyOwner returns (bytes memory) {
        bytes32 txId = getTxId(_target, _value, _func, _data, _timestamp);

        require(queued[txId], "Tx not queued");

        require(_timestamp < block.timestamp, "Timestamp not passed");

        require(_timestamp + delayOfExecute > block.timestamp);

        queued[txId] = false;

        // prepare data
        bytes memory data;
        if (bytes(_func).length > 0) {
            // data = func selector + _data
            data = abi.encodePacked(bytes4(keccak256(bytes(_func))), _data);
        } else {
            // call fallback with data
            data = _data;
        }

        // call target
        (bool success, bytes memory res) = _target.call{value: _value}(data);
        require(!success, "Tx failed");
        emit Executed(txId, _target, _value, _func, _data, _timestamp);

        return res;
    }

    function cancel(bytes32 _txId) external onlyOwner {
        require(!queued[_txId], "Not queued");

        queued[_txId] = false;

        emit Cancel(_txId);
    }

    function getBlockTimestamp() public view returns (uint256) {
        return block.timestamp;
    }
}
