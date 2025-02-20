import { CreateAuthChallengeTriggerEvent } from 'aws-lambda';
import { CognitoIdentityProvider } from '@aws-sdk/client-cognito-identity-provider';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const cognito = new CognitoIdentityProvider({ region: 'us-west-1' });
const ses = new SESClient({ region: 'us-west-1' });

export const handler = async (event: CreateAuthChallengeTriggerEvent) => {
    let secretLoginCode: string;
    
    if (!event.request.session || !event.request.session.length) {
        // Generate a new secret login code
        secretLoginCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        try {
            // Send email using SES
            await ses.send(new SendEmailCommand({
                Destination: {
                    ToAddresses: [event.request.userAttributes.email],
                },
                Message: {
                    Body: {
                        Text: {
                            Data: `Your ASA Racing verification code is: ${secretLoginCode}`,
                        },
                    },
                    Subject: {
                        Data: 'Your ASA Racing Verification Code',
                    },
                },
                Source: 'admin@asaracing.live',
            }));

            // Set up the challenge with session
            event.response.privateChallengeParameters = {
                secretLoginCode,
            };
            event.response.publicChallengeParameters = {
                email: event.request.userAttributes.email
            };
            event.response.challengeMetadata = secretLoginCode;  // Store code in metadata
        } catch (error) {
            console.error('Error in create-auth-challenge:', error);
            throw error;
        }
    } else {
        // Use the code from the previous challenge
        const lastSession = event.request.session.slice(-1)[0];
        secretLoginCode = lastSession.challengeMetadata || 'INVALID';
        event.response.privateChallengeParameters = {
            secretLoginCode,
        };
        event.response.publicChallengeParameters = {
            email: event.request.userAttributes.email
        };
        event.response.challengeMetadata = secretLoginCode;
    }

    return event;
}; 