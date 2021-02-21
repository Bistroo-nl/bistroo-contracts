pragma solidity ^0.5.17;

import "@openzeppelin/contracts/crowdsale/Crowdsale.sol";
import "@openzeppelin/contracts/crowdsale/distribution/PostDeliveryCrowdsale.sol";
import "@openzeppelin/contracts/crowdsale/emission/AllowanceCrowdsale.sol";
import "@openzeppelin/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "@openzeppelin/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "./crowdsale/WhitelistCrowdsale.sol";
import "./crowdsale/IndividuallyCappedCrowdsale.sol";

contract BistrooCrowdsale is
Crowdsale,
AllowanceCrowdsale,
WhitelistCrowdsale,
CappedCrowdsale,
TimedCrowdsale,
PostDeliveryCrowdsale,
IndividuallyCappedCrowdsale
{
    uint256 private _rate = 2000;
    uint256 private _individualCap = 10e18;
    uint256 private _totalCap = 20e18;

    constructor(
        address payable crowdsaleWallet,
        IERC20 token,
        address tokenWallet,
        uint256 openingTime,
        uint256 closingTime,
        address whitelister
    )

    WhitelistCrowdsale(whitelister)
    TimedCrowdsale(openingTime, closingTime)
    CappedCrowdsale(_totalCap)
    IndividuallyCappedCrowdsale(_individualCap)
    AllowanceCrowdsale(tokenWallet)
    Crowdsale(_rate, crowdsaleWallet, token)

    public
    {}
}
