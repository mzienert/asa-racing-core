#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AsaRacingStack } from '../lib/asa-racing-stack';
import { CertificateStack } from '../lib/certificate-stack';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.AWS_ACCOUNT_ID) {
  throw new Error('AWS_ACCOUNT_ID environment variable is required');
}

const app = new cdk.App();

// Check which stack to deploy based on command line argument
const stackName = process.argv[2];

console.log('CERTIFICATE_ARN:', process.env.CERTIFICATE_ARN);

if (stackName === 'cert') {
  // Deploy only certificate stack
  new CertificateStack(app, 'AsaRacingCertStack', {
    env: { 
      account: process.env.AWS_ACCOUNT_ID,
      region: 'us-east-1'
    },
    tags: {
      Environment: 'production',
      Project: 'AsaRacing'
    }
  });
} else {
  // Deploy main stack
  if (!process.env.CERTIFICATE_ARN?.startsWith('arn:aws:acm:')) {
    throw new Error('Valid CERTIFICATE_ARN environment variable is required');
  }

  new AsaRacingStack(app, 'AsaRacingStack', {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
    stage: 'beta',
    githubOwner: 'mzienert',
    githubRepo: 'asa-racing-ui',
    githubBranch: 'main',
    githubTokenSecretName: 'github-token-secret-name',
    certificateArn: process.env.CERTIFICATE_ARN,
    tags: {
      Environment: 'production',
      Project: 'AsaRacing'
    }
  });
}

app.synth();