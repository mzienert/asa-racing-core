import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as sesActions from 'aws-cdk-lib/aws-ses-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

import { S3Construct } from './constructs/storage/s3-construct';
import { DynamoDBConstruct } from './constructs/database/dynamodb-construct';
import { asaRacingUIPipelineConstruct } from './constructs/pipeline/asa-racing-pipeline-construct';
import { IAMRolesConstruct } from './constructs/roles/iam-roles-construct';
import { CognitoPool } from '../cognito';
import { LambdaConstruct } from './constructs/lambda/lambda-construct';
import { ApiGatewayConstruct } from './constructs/api/api-gateway-construct';

export interface AsaRacingStackProps extends cdk.StackProps {
  stage: string;
  certificateArn: string;
  allowedOrigin: string;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  githubTokenSecretName: string;
}
console.log('Available SES Actions:', Object.keys(sesActions));
export class AsaRacingStack extends cdk.Stack {
  private readonly dynamoConstruct: DynamoDBConstruct;

  constructor(scope: Construct, id: string, props: AsaRacingStackProps) {
    super(scope, id, props);

    if (!props.certificateArn.startsWith('arn:aws:acm:')) {
      throw new Error('Invalid certificate ARN. Please deploy the certificate stack first and add the ARN to your .env file');
    }

    // Create S3 Bucket
    const s3Construct = new S3Construct(this, 'S3Construct');

    // Create DynamoDB Table
    this.dynamoConstruct = new DynamoDBConstruct(this, 'KlineTable', {
      tableName: 'asaRacingTable'
    });

    // Create IAM Roles
    const iamRoles = new IAMRolesConstruct(this, 'IAMRoles', {
      asaRacingAPIBucket: s3Construct.bucket,
      region: this.region,
      account: this.account,
      dynamoTableArn: this.dynamoConstruct.table.tableArn
    });

    // Add SES permissions to Lambda role
    iamRoles.lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*']
    }));

    // Create NextJS Pipeline
    const certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', props.certificateArn);
    const nextjsPipelineConstruct = new asaRacingUIPipelineConstruct(this, 'AsaRacingNextJSPipelineConstructV2', {
      githubOwner: props.githubOwner,
      githubRepo: props.githubRepo,
      githubBranch: props.githubBranch,
      githubTokenSecretName: props.githubTokenSecretName,
      certificate: certificate,
      domainNames: ['asaracing.live', 'www.asaracing.live'],
    });

    // Create Route53 Hosted Zone
    const zone = route53.HostedZone.fromLookup(this, 'AsaRacingZone', {
      domainName: 'asaracing.live'
    });

    // Create Route53 records
    new route53.ARecord(this, 'ARecord', {
      zone,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(nextjsPipelineConstruct.distribution)
      ),
    });

    new route53.ARecord(this, 'WWWARecord', {
      zone,
      recordName: 'www',
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(nextjsPipelineConstruct.distribution)
      ),
    });

    // Add Hosted Zone ID output
    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: zone.hostedZoneId,
      description: 'Hosted Zone ID',
      exportName: 'HostedZoneId'
    });

    // Create Lambda functions for Cognito triggers
    const defineAuthChallengeFn = new nodejs.NodejsFunction(this, 'DefineAuthChallenge', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: 'src/functions/auth/define-auth-challenge/index.ts',
      handler: 'handler',
    });

    const createAuthChallengeFn = new nodejs.NodejsFunction(this, 'CreateAuthChallenge', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: 'src/functions/auth/create-auth-challenge/index.ts',
      handler: 'handler',
    });

    const verifyAuthChallengeFn = new nodejs.NodejsFunction(this, 'VerifyAuthChallenge', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: 'src/functions/auth/verify-auth-challenge/index.ts',
      handler: 'handler',
    });

    // Add SES permissions to CreateAuthChallenge function
    const sesPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*']  // Or specify your SES ARN for better security
    });

    createAuthChallengeFn.addToRolePolicy(sesPolicy);

    // Create Cognito Pool with Lambda triggers
    const cognitoPool = new CognitoPool(this, 'CognitoPool', {
      stage: props.stage,
      lambdaTriggers: {
        defineAuthChallenge: defineAuthChallengeFn,
        createAuthChallenge: createAuthChallengeFn,
        verifyAuthChallengeResponse: verifyAuthChallengeFn
      }
    });

    // Create Lambda Functions for API
    const lambdaConstruct = new LambdaConstruct(this, 'ApiLambdas', {
      cognitoUserPoolArn: cognitoPool.userPool.userPoolArn,
      dynamoTableArn: this.dynamoConstruct.table.tableArn,
      iamRole: iamRoles.lambdaRole
    });

    // Create API Gateway
    const apiGateway = new ApiGatewayConstruct(this, 'AsaRacingApi', {
      lambdaFunctions: lambdaConstruct.functions,
      cognitoUserPool: cognitoPool.userPool,
      stage: props.stage
    });

    // Stack Outputs
    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: this.dynamoConstruct.table.tableName,
      description: 'Name of the DynamoDB table',
      exportName: 'asaRacingTableName'
    });

    new cdk.CfnOutput(this, 'asaRacingBucketName', {
      value: s3Construct.bucket.bucketName,
      description: 'Name of the S3 bucket for deployments',
    });

    new cdk.CfnOutput(this, 'NextJSWebsiteURL', {
      value: `https://${nextjsPipelineConstruct.distribution.distributionDomainName}`,
      description: 'Next.js Website URL',
    });
    
    new cdk.CfnOutput(this, 'NextJSPipelineArn', {
      value: nextjsPipelineConstruct.pipeline.pipelineArn,
      description: 'Next.js Pipeline ARN',
    });

    new cdk.CfnOutput(this, 'CognitoUserPoolId', {
      value: cognitoPool.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'CognitoUserPoolId'
    });

    new cdk.CfnOutput(this, 'CognitoClientId', {
      value: cognitoPool.client.userPoolClientId,
      description: 'Cognito Client ID',
      exportName: 'CognitoClientId'
    });

    // Add stack output for API Gateway URL
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: apiGateway.api.url,
      description: 'API Gateway URL'
    });

    // Create SES Email Identity
    const emailDomain = new ses.EmailIdentity(this, 'AsaRacingDomain', {
      identity: ses.Identity.domain('asaracing.live'),
      mailFromDomain: 'mail.asaracing.live',
      dkimSigning: true
    });

    // Create DKIM records
    emailDomain.dkimRecords.forEach((record, index) => {
      new route53.CnameRecord(this, `DkimRecord${index}`, {
        zone,
        recordName: record.name,
        domainName: record.value
      });
    });

    // Add domain verification TXT record
    new route53.TxtRecord(this, 'SesVerificationRecord', {
      zone,
      recordName: `_amazonses.asaracing.live`,
      values: ['hXuwSsyi8HQdjQ4ulftSUrRx0qXtMpYM9z8SNAni2kQ=']
    });

    // Add MX record for MAIL FROM domain
    new route53.MxRecord(this, 'SesMailFromMx', {
      zone,
      recordName: 'mail.asaracing.live',
      values: [{
        hostName: 'feedback-smtp.us-west-1.amazonses.com',
        priority: 10
      }]
    });

    // Add SPF record for MAIL FROM domain
    new route53.TxtRecord(this, 'SesMailFromSpf', {
      zone,
      recordName: 'mail.asaracing.live',
      values: ['v=spf1 include:amazonses.com ~all']
    });
  }
}
