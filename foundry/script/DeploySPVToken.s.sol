// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/registries/KYCRegistry.sol";
import "../src/tokens/SPVToken.sol";

/**
 * @notice Example deployment script for local testing or Mumbai testnet.
 */
contract DeploySPVToken is Script {
    function run() external {
        // Load private key from environment variable
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address admin = vm.addr(deployerPrivateKey);
        vm.startBroadcast(deployerPrivateKey);

        // 1️⃣ Deploy KYC Registry
        KYCRegistry registry = new KYCRegistry(admin);

        // 2️⃣ Deploy SPVToken linked to KYC registry
        SPVToken token = new SPVToken(
            "GreenField SPV Token",
            "GFT",
            address(registry),
            admin
        );

        vm.stopBroadcast();

        console.log("KYCRegistry deployed at:", address(registry));
        console.log("SPVToken deployed at:", address(token));
    }
}
