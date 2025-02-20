import { VerifyAuthChallengeResponseTriggerEvent, VerifyAuthChallengeResponseTriggerHandler } from 'aws-lambda';

export const handler: VerifyAuthChallengeResponseTriggerHandler = async (
  event: VerifyAuthChallengeResponseTriggerEvent
) => {
  const expectedAnswer = event.request.privateChallengeParameters.secretLoginCode;
  const providedAnswer = event.request.challengeAnswer;

  event.response.answerCorrect = expectedAnswer === providedAnswer;

  return event;
};