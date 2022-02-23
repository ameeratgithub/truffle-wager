const Game1 = artifacts.require("Game1");

module.exports = function (deployer) {
  deployer.deploy(Game1, (0.01 * 1e18).toString());
};
