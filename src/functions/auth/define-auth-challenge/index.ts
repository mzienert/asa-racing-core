import { DefineAuthChallengeTriggerHandler } from 'aws-lambda';

interface ChallengeSession {
    challengeName: string;
    challengeResult: boolean;
}

interface AuthEvent {
    request: {
        userNotFound?: boolean;
        session: ChallengeSession[];
    };
    response: AuthResponse;
}

interface AuthResponse {
    isValid?: boolean;
    challengeName?: string;
    issueTokens: boolean;
    failAuthentication: boolean;
}

export const handler: DefineAuthChallengeTriggerHandler = async (event) => {
    const { request } = event;
    
    // If user is not found, fail
    if (request.userNotFound) {
        event.response = {
            failAuthentication: true,
            issueTokens: false
        };
        return event;
    }

    // Initialize session if undefined
    if (!request.session) {
        request.session = [];
    }

    if (request.session.length === 0) {
        // First challenge
        event.response.challengeName = 'CUSTOM_CHALLENGE';
        event.response.issueTokens = false;
        event.response.failAuthentication = false;
    } else if (request.session.length === 1 && request.session[0].challengeName === 'CUSTOM_CHALLENGE') {
        // Verify the OTP
        if (request.session[0].challengeResult === true) {
            event.response.issueTokens = true;
            event.response.failAuthentication = false;
        } else {
            event.response.issueTokens = false;
            event.response.failAuthentication = true;
        }
    } else {
        // Fail auth for all other cases
        event.response.issueTokens = false;
        event.response.failAuthentication = true;
    }

    return event;
};