// lib/constructs/pipeline/nextjs-pipeline-construct.ts
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';

export interface asaRacingUIPipelineConstructProps {
  readonly githubOwner: string;
  readonly githubRepo: string;
  readonly githubBranch: string;
  readonly githubTokenSecretName: string;
}

export class asaRacingUIPipelineConstruct extends Construct {
  public readonly pipeline: codepipeline.Pipeline;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: asaRacingUIPipelineConstructProps) {
    super(scope, id);

    // Create artifact bucket
    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // Create hosting bucket
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    });

    // Create single OAI
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'WebsiteOAI');
    
    // Grant read access to bucket
    websiteBucket.grantRead(originAccessIdentity);

    // Create CloudFront distribution using the same OAI
    this.distribution = new cloudfront.Distribution(this, 'WebsiteDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, {
          originAccessIdentity  // Reuse the same OAI
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        edgeLambdas: [{
          functionVersion: props.edgeFunction.currentVersion,
          eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
        }],
      },
    });

    // Create build project
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true,
      },
      environmentVariables: {
        WEBSITE_BUCKET_NAME: { 
          value: websiteBucket.bucketName,
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT 
        },
        DISTRIBUTION_ID: { 
          value: this.distribution.distributionId,
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT 
        }
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'npm ci'
            ],
          },
          build: {
            commands: [
              'npm run build',
            ],
          },
          post_build: {
            commands: [
              // Copy the entire .next directory
              'aws s3 sync .next s3://${WEBSITE_BUCKET_NAME}/.next --delete',
              // Copy public directory
              'aws s3 sync public s3://${WEBSITE_BUCKET_NAME}/public --delete',
              // Copy package.json and server.js
              'aws s3 cp package.json s3://${WEBSITE_BUCKET_NAME}/package.json',
              'aws s3 cp .next/standalone/server.js s3://${WEBSITE_BUCKET_NAME}/server.js',
              // Create CloudFront invalidation
              'aws cloudfront create-invalidation --distribution-id ${DISTRIBUTION_ID} --paths "/*"',
              // Debug output
              'echo "Contents of S3 bucket:"',
              'aws s3 ls s3://${WEBSITE_BUCKET_NAME}/ --recursive'
            ],
          },
        },
        artifacts: {
          files: [
            '**/*'
          ],
        },
      }),
    });

    // Grant permissions
    websiteBucket.grantReadWrite(buildProject.role!);
    this.distribution.grantCreateInvalidation(buildProject.role!);

    // Fix pipeline artifacts
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    this.pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      artifactBucket: artifactBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.GitHubSourceAction({
              actionName: 'GitHub_Source',
              owner: props.githubOwner,
              repo: props.githubRepo,
              branch: props.githubBranch,
              oauthToken: cdk.SecretValue.secretsManager(props.githubTokenSecretName),
              output: sourceOutput,
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Build',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
            }),
          ],
        },
      ],
    });
  }
}