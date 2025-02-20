exports.handler = async (event) => {
    const expectedAnswer = event.request.privateChallengeParameters.secretLoginCode;
    const givenAnswer = event.request.challengeAnswer;
    
    return {
        answerCorrect: expectedAnswer === givenAnswer
    };
};