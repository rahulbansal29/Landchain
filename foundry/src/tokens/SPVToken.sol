// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IKYCRegistry {
    function isKYCApproved(address user) external view returns (bool);
}

/**
 * @title SPVToken
 * @notice ERC20 token representing fractional ownership in a specific SPV.
 */
contract SPVToken is ERC20, AccessControl, Pausable {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    IKYCRegistry public kycRegistry;

    constructor(
        string memory name_,
        string memory symbol_,
        address kycRegistryAddress,
        address admin
    ) ERC20(name_, symbol_) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MANAGER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        kycRegistry = IKYCRegistry(kycRegistryAddress);
    }

    modifier onlyManager() {
        require(hasRole(MANAGER_ROLE, msg.sender), "Not manager");
        _;
    }

    function mint(address to, uint256 amount) external onlyManager {
        require(kycRegistry.isKYCApproved(to), "KYC not approved");
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyManager {
        _burn(from, amount);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function setKYCRegistry(address registry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        kycRegistry = IKYCRegistry(registry);
    }

    /// @dev Restrict transfer between non-KYC addresses
    function _update(address from, address to, uint256 value)
        internal
        override
    {
        _requireNotPaused();
        if (from != address(0)) {
            require(kycRegistry.isKYCApproved(from), "Sender not KYC");
        }
        if (to != address(0)) {
            require(kycRegistry.isKYCApproved(to), "Receiver not KYC");
        }
        super._update(from, to, value);
    }
}

