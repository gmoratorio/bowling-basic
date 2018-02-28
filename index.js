const ROUND_BONUS = {
    SPARE: 'Spare',
    STRIKE: 'Strike'
};

class Frame {
    constructor(frameNumber) {
        this.number = frameNumber;
        this.frameStillInPlay = true;
        this.frameBonus = null;
        this.attempt = 1;
        this.hasExtraAttempt = frameNumber === 10;
        this.playerStillWantsToPlayFrame = true;
        this.firstAttempt = {
            score: 0
        };
        this.secondAttempt = {
            score: 0
        };
        this.thirdAttempt = {
            score: 0
        };
    }

    totalScore() {
        return this.firstAttempt.score + this.secondAttempt.score + this.thirdAttempt.score;
    }

    scoreIsValidAndWasUpdated(enteredScore) {
        const score = Number.parseInt(enteredScore);

        if (score > 10) {
            return false;
        }

        if (this.attempt === 1) {
            if (score < 10) {
                this.firstAttempt.score = score;
                return true;
            } else if (score === 10) {
                this.firstAttempt.score = score;
                if (!this.hasExtraAttempt) {
                    this.frameStillInPlay = false;
                    this.frameBonus = ROUND_BONUS.STRIKE;
                } else {
                    this.frameBonus = ROUND_BONUS.FINAL;
                    this.firstAttempt.finalBonus = ROUND_BONUS.STRIKE;
                }

                return true;
            } else {
                return false;
            }
        } else if (this.attempt == 2) {
            const totalScore = this.firstAttempt.score + score;

            if (totalScore < 10) {
                this.secondAttempt.score = score;
                this.frameStillInPlay = false;

                return true;
            } else if (totalScore === 10) {
                if (this.firstAttempt.score === 10) {
                    // it's the last frame, you got a strike on the first attempt
                    // and you got a gutter on this attempt
                    this.secondAttempt.score = score;
                    this.frameStillInPlay = false;
                    return true;
                } else {
                    // you got a spare
                    this.secondAttempt.score = score;

                    if (!this.hasExtraAttempt) {
                        this.frameStillInPlay = false;
                        this.frameBonus = ROUND_BONUS.SPARE;
                    } else {
                        this.frameBonus = ROUND_BONUS.FINAL;
                        this.secondAttempt.finalBonus = ROUND_BONUS.SPARE;
                    }

                    return true;
                }
            } else if (totalScore < 20) {
                if (this.firstAttempt.score === 10) {
                    // it's the last frame, you got a strike on the first attempt
                    // and you got some points on this attempt
                    // attempt stays open since it's the last frame
                    this.secondAttempt.score = score;

                    return true;
                } else {
                    // no mathematical way to get 10 < score < 20 without a strike on the first attempt
                    return false;
                }
            } else if (totalScore === 20) {
                // it's the last frame, you got a strike on the first attempt
                // and you got another strike on this attempt
                this.secondAttempt.score = score;
                this.frameBonus = ROUND_BONUS.FINAL;
                this.secondAttempt.finalBonus = ROUND_BONUS.STRIKE;
                return true;
            } else {
                return false;
            }

        } else if (this.attempt === 3) {
            this.thirdAttempt.score = score;
            this.thirdAttempt.finalBonus = ROUND_BONUS.STRIKE;
            this.frameStillInPlay = false;
            return true;
        }
    }

    playFrame(playerName) {

        while (this.frameStillInPlay && this.playerStillWantsToPlayFrame) {
            let scoreIsValid = false;

            while (!scoreIsValid && this.playerStillWantsToPlayFrame) {
                const score = prompt(`Ok ${playerName}... Frame ${this.number}, attempt ${this.attempt}. What do you bowl?`);

                if (score === null) {
                    this.playerStillWantsToPlayFrame = false;
                    return this.playerStillWantsToPlayFrame;
                }
                scoreIsValid = this.scoreIsValidAndWasUpdated(score);

                if (scoreIsValid) {
                    this.attempt = this.attempt + 1;
                } else {
                    this.playerStillWantsToPlayFrame = confirm(`Sorry, that was an invalid bowl. Try again.`);
                }
            }
        }

        if (this.playerStillWantsToPlayFrame) {
            const bonusText = this.frameBonus ? ` with a ${this.frameBonus}; nicely done!` : '';
            alert(`${playerName}'s score this frame: ${this.totalScore()} pins${bonusText}`);
        }

        return this.playerStillWantsToPlayFrame;
    }

}

class Player {
    constructor(playerName) {
        this.name = playerName;
        this.results = [];
    }

    getFrameScoreWithBonus(frame, index, originatingIndex) {
        const thisFrameScore = frame.totalScore();
        let bonusScores = 0;

        if (frame.number === 10 || !frame.frameBonus) {
            return thisFrameScore;
        } else if (frame.frameBonus === ROUND_BONUS.SPARE) {
            const nextFrameFirstAttempt = this.results[index + 1].firstAttempt.score;
            return thisFrameScore + nextFrameFirstAttempt;
        } else if (frame.frameBonus === ROUND_BONUS.STRIKE) {
            const firstBonusIndex = index + 1;
            const firstBonusFrame = this.results[firstBonusIndex];

            if (frame.number === 9) {
                bonusScores = firstBonusFrame.firstAttempt.score + firstBonusFrame.secondAttempt.score;
            } else {

                if (firstBonusFrame.frameBonus === ROUND_BONUS.STRIKE) {
                    const secondBonusIndex = firstBonusIndex + 1;
                    let secondBonusFrame = this.results[secondBonusIndex];

                    bonusScores = firstBonusFrame.totalScore() + secondBonusFrame.firstAttempt.score;
                } else {
                    bonusScores = firstBonusFrame.totalScore();
                }
            }


            return thisFrameScore + bonusScores;
        }
    }

    getFinalScore() {
        return this.results.reduce((acc, frame, index) => {
            return acc + this.getFrameScoreWithBonus(frame, index);
        }, 0);
    }
}


class Game {
    constructor() {
        this.frame = 1;
        this.playerTurn = 1;
        this.totalFrames = 10;
        this.players = [];
        this.playerStillWantsToPlayGame = true;
    }

    getTotalPlayerCount() {
        return this.players.length;
    }

    displayInvalidEntryPrompt() {
        this.playerStillWantsToPlayGame = confirm("Sorry, that was an invalid entry. Please try again.");
    }

    setUpPlayers() {
        let playerCountIsValid = false;

        while (!playerCountIsValid && this.playerStillWantsToPlayGame) {
            const enteredPlayerCount = prompt('How many people will be playing today? Please enter 1 or 2.');
            const playerCount = Number.parseInt(enteredPlayerCount);

            if (playerCount === 1 || playerCount === 2) {
                playerCountIsValid = true;
                let playersHaveValidNames = false;
                let currentPlayerIndex = 0;

                while (!playersHaveValidNames && this.playerStillWantsToPlayGame) {
                    let playerName = '';

                    if (currentPlayerIndex === 0) {
                        playerName = playerCount === 1 ? prompt(`What is the player's name?`) : prompt(`What is the first player's name?`);

                    } else if (currentPlayerIndex === 1) {
                        playerName = prompt(`What is the second player's name?`);
                    }

                    const userEnteredAString = Number.isNaN(Number.parseInt(playerName));

                    if (playerName === null) {
                        this.playerStillWantsToPlayGame = false;
                    } else if (userEnteredAString && playerName !== '') {
                        const thisPlayer = new Player(playerName);
                        this.players[currentPlayerIndex] = thisPlayer;

                        if (currentPlayerIndex === 0 && playerCount === 1) {
                            playersHaveValidNames = true;
                        } else if (currentPlayerIndex === 1) {
                            playersHaveValidNames = true;
                        }

                        currentPlayerIndex = currentPlayerIndex + 1;
                    } else {
                        this.displayInvalidEntryPrompt();
                    }
                }


            } else if (enteredPlayerCount === null) {
                this.playerStillWantsToPlayGame = false;
            } else {
                this.displayInvalidEntryPrompt();
            }
        }
    }

    playGame() {
        let gameInPlay = true;

        this.playerStillWantsToPlayGame = confirm('Welcome to Bowling Basic! Exit the game at any time by clicking the "Cancel" button.');

        if (this.playerStillWantsToPlayGame) {
            this.setUpPlayers();
        }


        while (gameInPlay && this.playerStillWantsToPlayGame) {
            const playerIndex = this.playerTurn - 1;
            const frameIndex = this.frame - 1;
            const currentPlayer = this.players[playerIndex];

            let thisFrame = new Frame(this.frame);
            this.playerStillWantsToPlayGame = thisFrame.playFrame(currentPlayer.name);

            if (this.playerStillWantsToPlayGame) {
                currentPlayer.results[frameIndex] = thisFrame;


                if (this.getTotalPlayerCount() > 1) {
                    if (this.playerTurn === 2) {
                        this.frame = this.frame + 1;
                    }
                    this.playerTurn = this.playerTurn === 1 ? 2 : 1;
                } else {
                    this.frame = this.frame + 1;
                }

                if (this.frame > this.totalFrames) {
                    gameInPlay = false;
                }
            }

        }

        if (!this.playerStillWantsToPlayGame) {
            alert('Sorry to see you go. Play again by refreshing the page!');
            return;
        } else {
            const playerOneFinalScore = this.players[0].getFinalScore();

            if (this.getTotalPlayerCount() === 1) {
                alert(`Thanks for playing! Your final score is ${playerOneFinalScore}! Play again by refreshing the page.`);
            } else {
                const playerOneName = this.players[0].name;
                alert(`Thanks for playing! ${playerOneName}'s final score is ${playerOneFinalScore}.`);

                const playerTwoFinalScore = this.players[1].getFinalScore();
                const playerTwoName = this.players[1].name;
                alert(`Thanks for playing! ${playerTwoName}'s final score is ${playerTwoFinalScore}.`);

                if (playerOneFinalScore > playerTwoFinalScore) {
                    alert(`The winner is ${playerOneName}! Play again by refreshing the page.`);
                } else if (playerTwoFinalScore > playerOneFinalScore) {
                    alert(`The winner is ${playerTwoName}! Play again by refreshing the page.`);
                } else {
                    alert(`It's a tie! Everybody wins! Play again by refreshing the page.`);
                }
            }
        }


    }

}


let thisGame = new Game();
thisGame.playGame();