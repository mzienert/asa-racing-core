const crypto = require('crypto');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const sesClient = new SESClient();

exports.handler = async (event) => {
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
                        Data: `Your verification code is ${secretLoginCode}`
                    }
                },
                Subject: {
                    Data: 'Your login code'
                }
            },
            Source: 'your-verified-email@domain.com' // Replace with your SES verified email
        };

        try {
            await sesClient.send(new SendEmailCommand(params));
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