// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract Game2 is VRFConsumerBase {
    uint256 public randomResult;

    address private vrfCoordinatorRinkeby =
        0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B;
    address private linkTokenRinkeby =
        0x01BE23585060835E02B77ef475b0Cc51aA1e0709;

    mapping(address => uint256) public balances;
    bytes32 internal keyHashRinkeby;

    uint256 internal fee;

    enum GAME_STATE {
        CLOSED,
        OPEN,
        CALCULATING_WINNER
    }

    GAME_STATE public game_state;

    address payable[] public players;
    uint256 public gameId;
    // address public winner;
    // address public loser;
    uint256 private wageAmount;

    event GameResult(address winner, address loser);

    constructor(uint256 _wageAmount)
        VRFConsumerBase(vrfCoordinatorRinkeby, linkTokenRinkeby)
    {
        keyHashRinkeby = 0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311;
        fee = 0.1 * 10**18;

        gameId = 1;
        game_state = GAME_STATE.CLOSED;
        wageAmount = _wageAmount;
    }

    function getRandomNumber() public returns (bytes32 requestId) {
        require(
            LINK.balanceOf(address(this)) >= fee,
            "Not enough LINK - fill contract with faucet"
        );
        return requestRandomness(keyHashRinkeby, fee);
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness)
        internal
        override
    {
        require(
            game_state == GAME_STATE.CALCULATING_WINNER,
            "You aren't at that stage yet!"
        );
        require(randomness > 0, "Random number not found");

        randomResult = randomness;
        calculateResult(randomness);
    }

    function calculateResult(uint256 randomness) private {
        uint256 index = randomness % players.length;

        players[index].transfer(address(this).balance);
        // address winner;
        // address loser;

        if (index == 0) {
            // payable(players[0]).transfer(wageAmount * 2);
            emit GameResult(players[0], players[1]);
            // winner = players[0];
            // loser = players[1];
        } else if (index == 1) {
            // winner = players[1];
            // payable(players[1]).transfer(wageAmount * 2);
            emit GameResult(players[1], players[0]);

            // loser = players[0];
        }

        // payable(winner).transfer(wageAmount * 2);

        players = new address payable[](0);
        // balances[winner] = 0;
        // balances[loser] = 0;
        game_state = GAME_STATE.CLOSED;
    }

    function start_new_game() public {
        require(game_state == GAME_STATE.CLOSED, "can't start a new game yet");
        game_state = GAME_STATE.OPEN;
    }

    function enter() public payable {
        require(players.length < 2, "There are already 2 players in it");
        require(msg.value == wageAmount, "Please enter correct amount");
        require(game_state == GAME_STATE.OPEN, "You can't enter the game");
       
        if (players.length > 0) {
            require(
                players[0] != msg.sender,
                "You can't compete with yourself"
            );
        }

        players.push(payable(msg.sender));
        // balances[msg.sender] = msg.value;
        if (players.length == 2) {
            game_state = GAME_STATE.CALCULATING_WINNER;
            pickWinner();
        }
    }

    function pickWinner() private {
        require(
            game_state == GAME_STATE.CALCULATING_WINNER,
            "You aren't at that stage yet!"
        );
        getRandomNumber();
        // calculateResult(block.difficulty);
    }

    function canWithdraw() public view returns (bool) {
        return
            players.length != 0 &&
            players.length == 1 &&
            players[0] == msg.sender;
    }

    function withdrawFromGame() public {
        if (players.length == 1) {
            require(
                players[0] == msg.sender,
                "You aren't allowed to withdraw amount from game"
            );
            require(
                balances[msg.sender] == wageAmount,
                "You can't withdraw amount from game"
            );

            payable(msg.sender).transfer(balances[msg.sender]);
            players = new address payable[](0);
            game_state = GAME_STATE.CLOSED;

            delete balances[msg.sender];
        }
    }
}
