pragma solidity ^0.5.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/roles/WhitelistAdminRole.sol";

contract BistrooToken is
ERC20,
ERC20Detailed("Bistroo Token", "BIST", 18),
ERC20Burnable,
ERC20Mintable,
ERC20Pausable,
WhitelistAdminRole
{}
