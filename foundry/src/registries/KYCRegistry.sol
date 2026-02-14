// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title KYCRegistry
 * @notice Maintains a whitelist of KYC-verified investor addresses.
 */
contract KYCRegistry is AccessControl {
    bytes32 public constant KYC_MANAGER_ROLE = keccak256("KYC_MANAGER_ROLE");

    mapping(address => bool) private _kycApproved;

    event KYCApproved(address indexed user);
    event KYCRevoked(address indexed user);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(KYC_MANAGER_ROLE, admin);
    }

    function approveKYC(address user) external onlyRole(KYC_MANAGER_ROLE) {
        _kycApproved[user] = true;
        emit KYCApproved(user);
    }

    function revokeKYC(address user) external onlyRole(KYC_MANAGER_ROLE) {
        _kycApproved[user] = false;
        emit KYCRevoked(user);
    }

    function isKYCApproved(address user) external view returns (bool) {
        return _kycApproved[user];
    }
}
