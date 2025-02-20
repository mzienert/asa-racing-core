import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Stack } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export interface CognitoPoolProps {
  readonly stage: string;
  readonly snsRole?: iam.IRole;
  readonly lambdaTriggers?: {
    defineAuthChallenge: lambda.IFunction;
    createAuthChallenge: lambda.IFunction;
    verifyAuthChallengeResponse: lambda.IFunction;
  };
}

export class CognitoPool extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly client: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: CognitoPoolProps) {
    super(scope, id);

    this.userPool = new cognito.UserPool(this, 'CognitoPool', {
      userPoolName: `${props.stage}-asa-racing-user-pool`,
      selfSignUpEnabled: false,
      signInCaseSensitive: false,
      signInAliases: {
        email: true,
        phone: false,
      },
      standardAttributes: {
        givenName: {
          required: true,
          mutable: true,
        },
        email: {
          required: true,
          mutable: true,
        }
      },
      passwordPolicy: {
        minLength: 6,
        requireLowercase: false,
        requireDigits: false,
        requireSymbols: false,
        requireUppercase: false,
      },
      removalPolicy: RemovalPolicy.RETAIN,
      userVerification: {
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      email: cognito.UserPoolEmail.withCognito(),
      lambdaTriggers: props.lambdaTriggers,
    });

    if (props.snsRole) {
      const cfnUserPool = this.userPool.node.defaultChild as cognito.CfnUserPool;
      cfnUserPool.smsConfiguration = {
        externalId: Stack.of(this).stackName,
        snsCallerArn: props.snsRole.roleArn
      };
    }

    this.client = this.userPool.addClient('MyAppClient', {
      userPoolClientName: `${props.stage}-asa-racing-client`,
      authFlows: {
        userPassword: false,
        custom: true,
        userSrp: true,
        adminUserPassword: false
      },
      refreshTokenValidity: Duration.minutes(60),
      accessTokenValidity: Duration.minutes(30),
      idTokenValidity: Duration.minutes(30),
      preventUserExistenceErrors: true
    });
  }
}