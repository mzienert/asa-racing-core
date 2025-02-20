exports.handler = async (event) => {
    const { session, request } = event;
    
    // If user is not found, fail
    if (request.userNotFound) {
        return {
            isValid: false,
            failAuthentication: true
        };
    }

    if (session.length === 0) {
        // First challenge - send OTP
        return {
            challengeName: 'CUSTOM_CHALLENGE',
            issueTokens: false,
            failAuthentication: false
        };
    } else if (session.length === 1 && session[0].challengeName === 'CUSTOM_CHALLENGE') {
        // Verify the OTP
        if (session[0].challengeResult === true) {
            return {
                issueTokens: true,
                failAuthentication: false
            };
        } else {
            return {
                issueTokens: false,
                failAuthentication: true
            };
        }
    }

    return {
        issueTokens: false,
        failAuthentication: true
    };
};