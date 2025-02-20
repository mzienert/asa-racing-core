import * as crypto from 'crypto';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({ region: 'us-west-1' });

export const handler = async (event) => {
    let secretLoginCode;
    if (!event.request.session || !event.request.session.length) {
        // Generate a new 6 digit code
        secretLoginCode = crypto.randomInt(100000, 999999).toString();
        
        // Send email with the code
        const params = {
            Destination: {
                ToAddresses: [event.request.userAttributes.email]
            },
            Message: {
                Body: {
                    Text: {
                        Data: `Your ASA Racing verification code is: ${secretLoginCode}\n\nThis code will expire in 5 minutes.`
                    }
                },
                Subject: {
                    Data: 'ASA Racing Verification Code'
                }
            },
            Source: 'noreply@asaracing.live'
        };

        try {
            await sesClient.send(new SendEmailCommand(params));
            console.log('OTP email sent successfully to:', event.request.userAttributes.email);
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    } else {
        // Use existing code
        secretLoginCode = event.request.session.slice(-1)[0].challengeMetadata;
    }

    return {
        publicChallengeParameters: {
            email: event.request.userAttributes.email
        },
        privateChallengeParameters: {
            secretLoginCode
        },
        challengeMetadata: secretLoginCode
    };
};