import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { S3Construct } from './constructs/storage/s3-construct';
import { DynamoDBConstruct } from './constructs/database/dynamodb-construct';
import { asaRacingUIPipelineConstruct } from './constructs/pipeline/asa-racing-pipeline-construct';
import { IAMRolesConstruct } from './constructs/roles/iam-roles-construct';
import { CognitoPool } from '../cognito';

export interface AsaRacingStackProps extends cdk.StackProps {
  readonly githubOwner: string;
  readonly githubRepo: string;
  readonly githubBranch: string;
  readonly githubTokenSecretName: string;
}

export class AsaRacingStack extends cdk.Stack {
  private readonly dynamoConstruct: DynamoDBConstruct;

  constructor(scope: Construct, id: string, props: AsaRacingStackProps) {
    super(scope, id, props);

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

    // Create NextJS Pipeline
    const nextjsPipelineConstruct = new asaRacingUIPipelineConstruct(this, 'AsaRacingNextJSPipelineConstructV2', {
      githubOwner: props.githubOwner,
      githubRepo: props.githubRepo,
      githubBranch: props.githubBranch,
      githubTokenSecretName: props.githubTokenSecretName,
    });

    // Create Cognito Pool
    const cognitoPool = new CognitoPool(this, 'MyCognitoPool', {
      stage: 'Beta'
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
  }
}
