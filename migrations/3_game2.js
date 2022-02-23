const Game2 = artifacts.require("Game2");

module.exports = function (deployer) {
  deployer.deploy(Game2, (0.03 * 1e18).toString());
};
