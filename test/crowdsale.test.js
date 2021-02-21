const {web3} = require("@openzeppelin/test-helpers/src/setup");
const {expectRevert, time} = require('@openzeppelin/test-helpers')
const BistrooCrowdsale = artifacts.require('BistrooCrowdsale')
const BistrooToken = artifacts.require('BistrooToken')
const BistrooWhitelister = artifacts.require('BistrooWhitelister')

const DAY = 60 * 60 * 24

const getBalance = async (address) => {
    return (await this.token.balanceOf(address)).toString()
}

const getTotalSupply = async () => {
    return (await this.token.totalSupply()).toString()
}

const getContribution = async (address) => {
    return (await this.sale.getContribution(address)).toString()
}

const getCrowdsaleBalance = async (address) => {
    return (await this.sale.balanceOf(address)).toString()
}

const buyToRandomAddresses = async (addressCount = 0) => {
    while (addressCount--) {
        const address = getRandomAddress()
        await this.whitelister.whitelist([address], {from: this.deployerAddress})
        await this.sale.buyTokens(address, {value: 3e18})
    }
}

const getRandomAddress = () => {
    const chars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 'a', 'b', 'c', 'd', 'e', 'f']
    let address = '0x'
    while (address.length < 42) {
        address += chars[Math.floor(chars.length * Math.random())]
    }
    return address
}

contract('BistrooCrowdsale', ([_, deployerAddress, crowdsaleWallet, tokenAddress, user1Address, user2Address, user3Address, user4Address, user5Address, user6Address]) => {
    beforeEach(async () => {
        this.deployerAddress = deployerAddress

        // Deploy whitelister
        this.whitelister = await BistrooWhitelister.new({from: deployerAddress})

        // Deploy token, mint 1M crowdsale tokens to address, give allowance to crowdsale contract
        this.token = await BistrooToken.new({from: deployerAddress})

        // Deploy crowdsale
        this.startTime = Number((await time.latest()).toString()) + 60
        this.endTime = this.startTime + (60 * 60 * 24 * 5)
        this.sale = await BistrooCrowdsale.new(
            crowdsaleWallet,
            this.token.address,
            tokenAddress,
            this.startTime,
            this.endTime,
            this.whitelister.address,
            {from: deployerAddress}
        )

        // Mint & approve 1M tokens for crowdsale
        await this.token.mint(tokenAddress, '10000000000000000000000000', {from: deployerAddress})
        await this.token.approve(this.sale.address, '10000000000000000000000000', {from: tokenAddress})
    })

    it('whitelister', async () => {
        assert.equal(false, await this.whitelister.whitelisted(user1Address))
        assert.equal(false, await this.whitelister.whitelisted(user2Address))
        assert.equal(false, await this.whitelister.whitelisted(user3Address))
        await expectRevert(
            this.whitelister.whitelist([user1Address, user2Address, user3Address], {from: user1Address}),
            'WhitelistAdminRole: caller does not have the WhitelistAdmin role'
        )
        await this.whitelister.whitelist([user1Address, user2Address, user3Address], {from: deployerAddress})
        assert.equal(true, await this.whitelister.whitelisted(user1Address))
        assert.equal(true, await this.whitelister.whitelisted(user2Address))
        assert.equal(true, await this.whitelister.whitelisted(user3Address))

        await expectRevert(
            this.whitelister.unwhitelist([user2Address, user3Address], {from: user1Address}),
            'WhitelistAdminRole: caller does not have the WhitelistAdmin role'
        )
        await this.whitelister.unwhitelist([user2Address, user3Address], {from: deployerAddress})
        assert.equal(true, await this.whitelister.whitelisted(user1Address))
        assert.equal(false, await this.whitelister.whitelisted(user2Address))
        assert.equal(false, await this.whitelister.whitelisted(user3Address))

        // test helper method
        assert.equal(true, await this.sale.isWhitelisted(user1Address))
        assert.equal(false, await this.sale.isWhitelisted(user2Address))
    })

    it('send', async () => {
        // not started yet
        await expectRevert(
            this.sale.send(1e18, {from: user1Address}),
            'TimedCrowdsale: not open'
        )
        await time.increaseTo(this.startTime)

        // not whitelisted
        await expectRevert(
            this.sale.send(1e18, {from: user1Address}),
            'WhitelistCrowdsale: beneficiary not whitelisted'
        )
        await this.whitelister.whitelist([user1Address, user2Address, user3Address, user4Address], {from: deployerAddress})

        // exceeds cap
        await expectRevert(
            this.sale.send(20e18, {from: user1Address}),
            `IndividuallyCappedCrowdsale: beneficiary's cap exceeded`
        )

        await this.sale.send(1e18, {from: user1Address})
        await this.sale.send(1e18, {from: user1Address})
        await this.sale.send(1e18, {from: user1Address})
        assert.equal(await getBalance(user1Address), 0)

        await expectRevert(
            this.sale.send(9e18, {from: user1Address}),
            `IndividuallyCappedCrowdsale: beneficiary's cap exceeded`
        )

        await this.sale.send(10e18, {from: user2Address})
        assert.equal(await getBalance(user2Address), 0)

        // Sale total cap exceeded
        await expectRevert(
            this.sale.send(10e18, {from: user3Address}),
            `CappedCrowdsale: cap exceeded`
        )

        // cannot withdraw before sale is over
        await expectRevert(
            this.sale.withdrawTokens(user1Address),
            `PostDeliveryCrowdsale: not closed`
        )

        // sale ended
        await time.increaseTo(this.endTime + 60)
        await expectRevert(
            this.sale.send(3e18, {from: user3Address}),
            `TimedCrowdsale: not open`
        )

        // can withdraw after sale has ended
        await this.sale.withdrawTokens(user1Address)
        assert.notEqual(await getBalance(user1Address), 0)
        await this.sale.withdrawTokens(user2Address)
        assert.notEqual(await getBalance(user2Address), 0)
    })

    it('buyTokens', async () => {
        // not started yet
        await expectRevert(
            this.sale.buyTokens(user1Address, {value: 1e18, from: user1Address}),
            'TimedCrowdsale: not open'
        )
        await time.increaseTo(this.startTime)

        // not whitelisted
        await expectRevert(
            this.sale.buyTokens(user1Address, {value: 1e18, from: user1Address}),
            'WhitelistCrowdsale: beneficiary not whitelisted'
        )
        await this.whitelister.whitelist([user1Address, user2Address, user3Address, user4Address], {from: deployerAddress})

        // exceeds cap
        await expectRevert(
            this.sale.buyTokens(user1Address, {value: 15e18, from: user1Address}),
            `IndividuallyCappedCrowdsale: beneficiary's cap exceeded`
        )
        await this.sale.buyTokens(user1Address, {value: 1e18, from: user1Address})
        await this.sale.buyTokens(user1Address, {value: 1e18, from: user1Address})
        await this.sale.buyTokens(user1Address, {value: 1e18, from: user1Address})
        assert.equal(await getBalance(user1Address), 0)
        await expectRevert(
            this.sale.buyTokens(user1Address, {value: 8e18, from: user1Address}),
            `IndividuallyCappedCrowdsale: beneficiary's cap exceeded`
        )
        await this.sale.buyTokens(user2Address, {value: 3e18, from: user2Address})
        assert.equal(await getBalance(user2Address), 0)

        // Sale total cap exceeded
        await this.sale.buyTokens(user4Address, {value: 5e18, from: user4Address})
        await expectRevert(
            this.sale.send(10e18, {from: user3Address}),
            `CappedCrowdsale: cap exceeded`
        )
        await this.sale.buyTokens(user3Address, {value: 9e18, from: user3Address})

        // cannot withdraw before sale is over
        await expectRevert(
            this.sale.withdrawTokens(user1Address),
            `PostDeliveryCrowdsale: not closed`
        )

        // sale ended
        await time.increaseTo(this.endTime + 60)
        await expectRevert(
            this.sale.buyTokens(user1Address, {value: 3e18, from: user3Address}),
            `TimedCrowdsale: not open`
        )

        // funds in multisig (100 initial + 13 prev test + 20 this test)
        assert.equal(await web3.eth.getBalance(crowdsaleWallet), 133e18)

        // can withdraw after sale has ended
        await this.sale.withdrawTokens(user1Address)
        assert.notEqual(await getBalance(user1Address), 0)
        await this.sale.withdrawTokens(user2Address)
        assert.notEqual(await getBalance(user2Address), 0)
    })
})
