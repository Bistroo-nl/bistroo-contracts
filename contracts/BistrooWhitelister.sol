pragma solidity ^0.5.17;

import "@openzeppelin/contracts/access/roles/WhitelistAdminRole.sol";

contract BistrooWhitelister is WhitelistAdminRole {
    mapping(address => bool) public whitelisted;

    function whitelist(address[] memory addresses) public onlyWhitelistAdmin {
        for (uint i = 0; i < addresses.length; i++) {
            whitelisted[addresses[i]] = true;
        }
    }

    function unwhitelist(address[] memory addresses) public onlyWhitelistAdmin {
        for (uint i = 0; i < addresses.length; i++) {
            whitelisted[addresses[i]] = false;
        }
    }
}
