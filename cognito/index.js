"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CognitoPool = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const cognito = require("aws-cdk-lib/aws-cognito");
const constructs_1 = require("constructs");
class CognitoPool extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        const cognitoPool = new cognito.UserPool(this, 'CognitoPool', {
            userPoolName: `${props.stage}-CognitoPool`,
            selfSignUpEnabled: true,
            signInCaseSensitive: false,
            signInAliases: {
                email: true,
                phone: true,
            },
            autoVerify: {
                email: true,
            },
            userVerification: {
                emailSubject: 'Hello from My Cool App!',
                emailBody: 'Hello, Thanks for registering in My cool app! Verification code is {####}.',
                emailStyle: cognito.VerificationEmailStyle.CODE
            },
            standardAttributes: {
                fullname: {
                    required: true,
                    mutable: true,
                },
                email: {
                    required: true,
                    mutable: true,
                }
            },
            customAttributes: {
                company: new cognito.StringAttribute({ mutable: true }),
            },
            passwordPolicy: {
                minLength: 8,
                requireLowercase: true,
                requireDigits: true,
                requireSymbols: true,
            },
            accountRecovery: cognito.AccountRecovery.EMAIL_AND_PHONE_WITHOUT_MFA,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.RETAIN,
        });
        const client = cognitoPool.addClient('MyAppClient', {
            userPoolClientName: 'MyAppClient',
            oAuth: {
                flows: { authorizationCodeGrant: true },
                scopes: [cognito.OAuthScope.OPENID],
                callbackUrls: ["https://bellerustica.com"]
            },
            supportedIdentityProviders: [
                cognito.UserPoolClientIdentityProvider.COGNITO,
            ],
            refreshTokenValidity: aws_cdk_lib_1.Duration.minutes(60),
            idTokenValidity: aws_cdk_lib_1.Duration.minutes(30),
            accessTokenValidity: aws_cdk_lib_1.Duration.minutes(30),
        });
    }
}
exports.CognitoPool = CognitoPool;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBc0Q7QUFDdEQsbURBQW1EO0FBQ25ELDJDQUF1QztBQU12QyxNQUFhLFdBQVksU0FBUSxzQkFBUztJQUN4QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXVCO1FBQy9ELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFZixNQUFNLFdBQVcsR0FBRyxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUM5RCxZQUFZLEVBQUUsR0FBRyxLQUFLLENBQUMsS0FBSyxjQUFjO1lBQzFDLGlCQUFpQixFQUFFLElBQUk7WUFDdkIsbUJBQW1CLEVBQUUsS0FBSztZQUMxQixhQUFhLEVBQUU7Z0JBQ2IsS0FBSyxFQUFFLElBQUk7Z0JBQ1gsS0FBSyxFQUFFLElBQUk7YUFDWjtZQUNELFVBQVUsRUFBRTtnQkFDVixLQUFLLEVBQUUsSUFBSTthQUNaO1lBQ0QsZ0JBQWdCLEVBQUU7Z0JBQ2hCLFlBQVksRUFBRSx5QkFBeUI7Z0JBQ3ZDLFNBQVMsRUFBRSw0RUFBNEU7Z0JBQ3ZGLFVBQVUsRUFBRSxPQUFPLENBQUMsc0JBQXNCLENBQUMsSUFBSTthQUNoRDtZQUNELGtCQUFrQixFQUFFO2dCQUNsQixRQUFRLEVBQUU7b0JBQ1IsUUFBUSxFQUFFLElBQUk7b0JBQ2QsT0FBTyxFQUFFLElBQUk7aUJBQ2Q7Z0JBQ0QsS0FBSyxFQUFFO29CQUNMLFFBQVEsRUFBRSxJQUFJO29CQUNkLE9BQU8sRUFBRSxJQUFJO2lCQUNkO2FBQ0Y7WUFDRCxnQkFBZ0IsRUFBRTtnQkFDaEIsT0FBTyxFQUFFLElBQUksT0FBTyxDQUFDLGVBQWUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQzthQUN4RDtZQUNELGNBQWMsRUFBRTtnQkFDZCxTQUFTLEVBQUUsQ0FBQztnQkFDWixnQkFBZ0IsRUFBRSxJQUFJO2dCQUN0QixhQUFhLEVBQUUsSUFBSTtnQkFDbkIsY0FBYyxFQUFFLElBQUk7YUFDckI7WUFDRCxlQUFlLEVBQUUsT0FBTyxDQUFDLGVBQWUsQ0FBQywyQkFBMkI7WUFDcEUsYUFBYSxFQUFFLDJCQUFhLENBQUMsTUFBTTtTQUNwQyxDQUFDLENBQUM7UUFFSCxNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRTtZQUNoRCxrQkFBa0IsRUFBRSxhQUFhO1lBQ2pDLEtBQUssRUFBRTtnQkFDTCxLQUFLLEVBQUUsRUFBRSxzQkFBc0IsRUFBRSxJQUFJLEVBQUU7Z0JBQ3ZDLE1BQU0sRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDO2dCQUNuQyxZQUFZLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQzthQUMzQztZQUNELDBCQUEwQixFQUFFO2dCQUMxQixPQUFPLENBQUMsOEJBQThCLENBQUMsT0FBTzthQUMvQztZQUNELG9CQUFvQixFQUFFLHNCQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUMxQyxlQUFlLEVBQUUsc0JBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ3JDLG1CQUFtQixFQUFFLHNCQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztTQUM1QyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUExREQsa0NBMERDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRHVyYXRpb24sIFJlbW92YWxQb2xpY3kgfSBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2duaXRvJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIENvZ25pdG9Qb29sUHJvcHMge1xuICByZWFkb25seSBzdGFnZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgQ29nbml0b1Bvb2wgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogQ29nbml0b1Bvb2xQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICAgIGNvbnN0IGNvZ25pdG9Qb29sID0gbmV3IGNvZ25pdG8uVXNlclBvb2wodGhpcywgJ0NvZ25pdG9Qb29sJywge1xuICAgICAgdXNlclBvb2xOYW1lOiBgJHtwcm9wcy5zdGFnZX0tQ29nbml0b1Bvb2xgLFxuICAgICAgc2VsZlNpZ25VcEVuYWJsZWQ6IHRydWUsXG4gICAgICBzaWduSW5DYXNlU2Vuc2l0aXZlOiBmYWxzZSxcbiAgICAgIHNpZ25JbkFsaWFzZXM6IHtcbiAgICAgICAgZW1haWw6IHRydWUsXG4gICAgICAgIHBob25lOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIGF1dG9WZXJpZnk6IHtcbiAgICAgICAgZW1haWw6IHRydWUsXG4gICAgICB9LFxuICAgICAgdXNlclZlcmlmaWNhdGlvbjoge1xuICAgICAgICBlbWFpbFN1YmplY3Q6ICdIZWxsbyBmcm9tIE15IENvb2wgQXBwIScsXG4gICAgICAgIGVtYWlsQm9keTogJ0hlbGxvLCBUaGFua3MgZm9yIHJlZ2lzdGVyaW5nIGluIE15IGNvb2wgYXBwISBWZXJpZmljYXRpb24gY29kZSBpcyB7IyMjI30uJyxcbiAgICAgICAgZW1haWxTdHlsZTogY29nbml0by5WZXJpZmljYXRpb25FbWFpbFN0eWxlLkNPREVcbiAgICAgIH0sXG4gICAgICBzdGFuZGFyZEF0dHJpYnV0ZXM6IHtcbiAgICAgICAgZnVsbG5hbWU6IHtcbiAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICBtdXRhYmxlOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBlbWFpbDoge1xuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIG11dGFibGU6IHRydWUsXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBjdXN0b21BdHRyaWJ1dGVzOiB7XG4gICAgICAgIGNvbXBhbnk6IG5ldyBjb2duaXRvLlN0cmluZ0F0dHJpYnV0ZSh7IG11dGFibGU6IHRydWUgfSksXG4gICAgICB9LFxuICAgICAgcGFzc3dvcmRQb2xpY3k6IHtcbiAgICAgICAgbWluTGVuZ3RoOiA4LFxuICAgICAgICByZXF1aXJlTG93ZXJjYXNlOiB0cnVlLFxuICAgICAgICByZXF1aXJlRGlnaXRzOiB0cnVlLFxuICAgICAgICByZXF1aXJlU3ltYm9sczogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBhY2NvdW50UmVjb3Zlcnk6IGNvZ25pdG8uQWNjb3VudFJlY292ZXJ5LkVNQUlMX0FORF9QSE9ORV9XSVRIT1VUX01GQSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IFJlbW92YWxQb2xpY3kuUkVUQUlOLFxuICAgIH0pO1xuXG4gICAgY29uc3QgY2xpZW50ID0gY29nbml0b1Bvb2wuYWRkQ2xpZW50KCdNeUFwcENsaWVudCcsIHtcbiAgICAgICAgdXNlclBvb2xDbGllbnROYW1lOiAnTXlBcHBDbGllbnQnLFxuICAgICAgICBvQXV0aDoge1xuICAgICAgICAgIGZsb3dzOiB7IGF1dGhvcml6YXRpb25Db2RlR3JhbnQ6IHRydWUgfSxcbiAgICAgICAgICBzY29wZXM6IFtjb2duaXRvLk9BdXRoU2NvcGUuT1BFTklEXSxcbiAgICAgICAgICBjYWxsYmFja1VybHM6IFtcImh0dHBzOi8vYmVsbGVydXN0aWNhLmNvbVwiXVxuICAgICAgICB9LFxuICAgICAgICBzdXBwb3J0ZWRJZGVudGl0eVByb3ZpZGVyczogW1xuICAgICAgICAgIGNvZ25pdG8uVXNlclBvb2xDbGllbnRJZGVudGl0eVByb3ZpZGVyLkNPR05JVE8sXG4gICAgICAgIF0sXG4gICAgICAgIHJlZnJlc2hUb2tlblZhbGlkaXR5OiBEdXJhdGlvbi5taW51dGVzKDYwKSxcbiAgICAgICAgaWRUb2tlblZhbGlkaXR5OiBEdXJhdGlvbi5taW51dGVzKDMwKSxcbiAgICAgICAgYWNjZXNzVG9rZW5WYWxpZGl0eTogRHVyYXRpb24ubWludXRlcygzMCksXG4gICAgfSk7XG4gIH1cbn0iXX0=