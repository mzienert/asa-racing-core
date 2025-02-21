// lib/constructs/pipeline/nextjs-pipeline-construct.ts
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

export interface asaRacingUIPipelineConstructProps {
  readonly githubOwner: string;
  readonly githubRepo: string;
  readonly githubBranch: string;
  readonly githubTokenSecretName: string;
  readonly certificate: acm.ICertificate;
  readonly domainNames: string[];
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
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
    });

    // Create OAI
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: 'OAI for asaracing.live'
    });

    // Grant read permissions to CloudFront
    websiteBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [websiteBucket.arnForObjects('*')],
      principals: [new iam.CanonicalUserPrincipal(originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
    }));

    // Create CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, 'WebsiteDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, {
          originAccessIdentity: originAccessIdentity
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(0)
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(0)
        }
      ],
      enableLogging: true,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      domainNames: props.domainNames,
      certificate: props.certificate,
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
        },
        NEXT_PUBLIC_COGNITO_USER_POOL_ID: {
          value: cdk.Fn.importValue('CognitoUserPoolId'),
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT
        },
        NEXT_PUBLIC_COGNITO_CLIENT_ID: {
          value: cdk.Fn.importValue('CognitoClientId'),
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT
        },
        NEXT_PUBLIC_STAGE: {
          value: 'prod',
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
              'echo "Build output directory contents:"',
              'ls -la out',
              'echo "Checking for index.html:"',
              'ls -la out/index.html || echo "index.html not found!"'
            ],
          },
          post_build: {
            commands: [
              'aws s3 sync out/ s3://${WEBSITE_BUCKET_NAME} --delete',
              'echo "Verifying index.html in S3:"',
              'aws s3 ls s3://${WEBSITE_BUCKET_NAME}/index.html || echo "index.html not found in S3!"',
              'aws cloudfront create-invalidation --distribution-id ${DISTRIBUTION_ID} --paths "/*"',
              'echo "Contents of S3 bucket:"',
              'aws s3 ls s3://${WEBSITE_BUCKET_NAME}/ --recursive'
            ],
          },
        },
        artifacts: {
          'base-directory': 'out',
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

    // Add this before creating the pipeline
    const pipelineRole = new iam.Role(this, 'PipelineRole', {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodePipeline_FullAccess')
      ]
    });

    this.pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      artifactBucket: artifactBucket,
      role: pipelineRole,
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
              trigger: codepipeline_actions.GitHubTrigger.WEBHOOK
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