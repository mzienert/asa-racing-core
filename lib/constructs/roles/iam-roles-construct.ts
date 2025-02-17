// lib/constructs/roles/iam-roles-construct.ts
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface IAMRolesConstructProps {
  asaRacingAPIBucket: s3.IBucket;
  region: string;
  account: string;
  dynamoTableArn: string;
}

export class IAMRolesConstruct extends Construct {
  public readonly buildRole: iam.Role;
  public readonly codeDeployServiceRole: iam.Role;

  constructor(scope: Construct, id: string, props: IAMRolesConstructProps) {
    super(scope, id);

    // Build Role for NextJS Pipeline
    this.buildRole = new iam.Role(this, 'BuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodeBuildAdminAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
      ],
    });

    // S3 permissions for build role
    props.asaRacingAPIBucket.grantReadWrite(this.buildRole);

    // CodeDeploy Service Role
    this.codeDeployServiceRole = new iam.Role(this, 'CodeDeployServiceRole', {
      assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSCodeDeployRole'),
      ],
    });

    // CloudWatch Logs permissions for all roles
    const cloudwatchPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogStreams',
        'logs:DescribeLogGroups'
      ],
      resources: [`arn:aws:logs:${props.region}:${props.account}:log-group:*`]
    });

    this.buildRole.addToPolicy(cloudwatchPolicy);
    this.codeDeployServiceRole.addToPolicy(cloudwatchPolicy);

    // Add security headers
    this.addSecurityHeaders();
  }

  private addSecurityHeaders() {
    const securityHeadersPolicy = new iam.PolicyStatement({
      effect: iam.Effect.DENY,
      actions: ['*'],
      resources: ['*'],
      conditions: {
        'Bool': {
          'aws:SecureTransport': false
        }
      }
    });

    this.buildRole.addToPolicy(securityHeadersPolicy);
    this.codeDeployServiceRole.addToPolicy(securityHeadersPolicy);
  }
}