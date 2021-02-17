const {expectRevert, time} = require('@openzeppelin/test-helpers')
const BistrooToken = artifacts.require('BistrooToken')

const getBalance = async (address) => {
    return (await this.token.balanceOf(address)).toString()
}

const getTotalSupply = async () => {
    return (await this.token.totalSupply()).toString()
}

contract('BistrooToken', ([_, adminAddress, minterAddress, user1Address, user2Address, user3Address, user4Address, user5Address]) => {
    beforeEach(async () => {
        this.token = await BistrooToken.new({from: adminAddress})
        await this.token.addMinter(minterAddress, {from: adminAddress})
    })

    it('should have correct name and symbol and decimal', async () => {
        const name = await this.token.name()
        const symbol = await this.token.symbol()
        const decimals = await this.token.decimals()
        assert.equal(name.toString(), 'Bistroo Token')
        assert.equal(symbol.toString(), 'BIST')
        assert.equal(decimals.toString(), '18')
    })

    it('should only allow minter to mint token and users to burn', async () => {
        // Minting
        await this.token.mint(adminAddress, '100', {from: adminAddress})
        await this.token.mint(user1Address, '1000', {from: minterAddress})
        await expectRevert(
            this.token.mint(user2Address, '1000', {from: user1Address}),
            'MinterRole: caller does not have the Minter role',
        )
        assert.equal('1100', await getTotalSupply())
        assert.equal('100', await getBalance(adminAddress))
        assert.equal('1000', await getBalance(user1Address))
        assert.equal('0', await getBalance(user2Address))

        // Burning
        await this.token.burn('100', {from: adminAddress})
        await this.token.burn('100', {from: user1Address})
        await expectRevert(
            this.token.burn('100', {from: user2Address}),
            'ERC20: burn amount exceeds balance -- Reason given: ERC20: burn amount exceeds balance.',
        )
        assert.equal('900', await getTotalSupply())
        assert.equal('0', await getBalance(adminAddress))
        assert.equal('900', await getBalance(user1Address))
        assert.equal('0', await getBalance(user2Address))
    })

    it('should be pausible by admin', async () => {
        await this.token.pause({from: adminAddress})
        assert.equal(true, await this.token.paused())

        await this.token.unpause({from: adminAddress})
        assert.equal(false, await this.token.paused())

        await expectRevert(
            this.token.pause({from: user2Address}),
            'PauserRole: caller does not have the Pauser role',
        )

        await this.token.addPauser(user2Address, {from: adminAddress})
        await this.token.pause({from: user2Address})
        assert.equal(true, await this.token.paused())
    })
})
