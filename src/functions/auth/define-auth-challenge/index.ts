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

export const handler = async (event: AuthEvent): Promise<AuthEvent> => {
    const { request } = event;
    
    // If user is not found, fail
    if (request.userNotFound) {
        event.response = {
            isValid: false,
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
        // First challenge - send OTP
        event.response = {
            challengeName: 'CUSTOM_CHALLENGE',
            issueTokens: false,
            failAuthentication: false
        };
    } else if (request.session.length === 1 && request.session[0].challengeName === 'CUSTOM_CHALLENGE') {
        // Verify the OTP
        if (request.session[0].challengeResult === true) {
            event.response = {
                issueTokens: true,
                failAuthentication: false
            };
        } else {
            event.response = {
                issueTokens: false,
                failAuthentication: true
            };
        }
    } else {
        event.response = {
            issueTokens: false,
            failAuthentication: true
        };
    }

    return event;
};