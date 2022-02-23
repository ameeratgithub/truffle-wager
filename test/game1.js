const Game1 = artifacts.require("Game1");
const { expect } = require("chai").use(require("chai-as-promised"));
const Moralis = require("moralis");

const GameState = {
  CLOSED: "0",
  OPEN: "1",
  CALCULATING_WINNER: "2",
};
contract("Game1", ([owner, third, second]) => {
  let game1;
  beforeEach(async () => {
    await Moralis.enableWeb3();
    game1 = await Game1.new((0.01 * 1e18).toString());
    await game1.start_new_game({ from: owner });
    console.log("Contract address", game1.address);
    const options = {
      type: "erc20",
      amount: Moralis.Units.Token("0.1", "18"),
      receiver: game1.address,
      contractAddress: "0x01BE23585060835E02B77ef475b0Cc51aA1e0709",
    };
    let result = await Moralis.transfer(options);
    console.log("Result:", result);

    const options2 = { chain: "rinkeby", address: game1.address };
    const balances = await Moralis.Web3API.account.getTokenBalances(options2);
    console.log("Balances:", balances);
  });
  describe("success", () => {
    xit("starts the game", async () => {
      result = await game1.game_state.call();
      expect(result.toString()).to.equal(GameState.OPEN);
    });
    xit("enters user in game", async () => {
      await game1.enter({
        value: (0.01 * 1e18).toString(),
        from: owner,
      });

      player = await game1.players.call(0);
      expect(player).to.equal(owner);
    });
    xit("changes game status to calculating winner", async () => {
      await game1.enter({
        value: (0.01 * 1e18).toString(),
        from: owner,
      });

      await game1.enter({
        value: (0.01 * 1e18).toString(),
        from: second,
      });

      const result = await game1.game_state.call();
      const player1 = await game1.players.call(0);
      const player2 = await game1.players.call(1);

      expect(result.toString()).to.equal(GameState.CALCULATING_WINNER);
      expect(player1).to.equal(owner);
      expect(player2).to.equal(second);
    });
    it("changes game status to calculating winner", async () => {
      await game1.enter({
        value: (0.01 * 1e18).toString(),
        from: owner,
      });

      await game1.enter({
        value: (0.01 * 1e18).toString(),
        from: second,
      });

      await game1.pickWinner();
    });
    xit("sends balance back in case of failure", async () => {
      await expect(
        game1.enter({
          value: (0.009 * 1e18).toString(),
          from: owner,
        })
      ).to.be.revertedWith("Please enter correct amount");
      const balance = await game1.balances.call(owner);
      expect(balance.toString()).to.equal("0");
    });
    xit("withdraw from game", async () => {
      await game1.enter({
        value: (0.01 * 1e18).toString(),
        from: owner,
      });
      const balanceAfterEnterance = await game1.balances.call(owner);
      const walletAfterEnterance = await web3.eth.getBalance(owner);
      await game1.withdrawFromGame({ from: owner });
      const balanceAfterWithdraw = await game1.balances.call(owner);
      const walletAfterWithdraw = await web3.eth.getBalance(owner);

      console.log(walletAfterWithdraw, walletAfterEnterance);
      expect(balanceAfterEnterance.toString()).to.be.equal(
        (0.01 * 1e18).toString()
      );
      expect(balanceAfterWithdraw.toString()).to.be.equal("0");
      expect(
        web3.utils
          .toBN(walletAfterWithdraw)
          .gt(web3.utils.toBN(walletAfterEnterance))
      ).to.be.true;
    });
  });
  xdescribe("Failure", () => {
    it("it rejects 3rd player", async () => {
      await game1.enter({
        value: (0.01 * 1e18).toString(),
        from: owner,
      });

      await game1.enter({
        value: (0.01 * 1e18).toString(),
        from: second,
      });
      await expect(
        game1.enter({
          value: (0.01 * 1e18).toString(),
          from: third,
        })
      ).to.be.rejected;
    });
    it("it rejects incorrect amount", async () => {
      await expect(
        game1.enter({
          value: (0.009 * 1e18).toString(),
          from: owner,
        })
      ).to.be.rejected;
    });
    xit("it won't enter the game", async () => {
      await expect(
        game1.enter({
          value: (0.01 * 1e18).toString(),
          from: owner,
        })
      ).to.be.rejected;
    });
    it("it won't allow to compete the player himself", async () => {
      await game1.enter({
        value: (0.01 * 1e18).toString(),
        from: owner,
      });

      await expect(
        game1.enter({
          value: (0.01 * 1e18).toString(),
          from: owner,
        })
      ).to.be.rejected;
    });
  });
});
