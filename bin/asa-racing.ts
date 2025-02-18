#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AsaRacingStack } from '../lib/asa-racing-stack';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.AWS_ACCOUNT_ID) {
  throw new Error('AWS_ACCOUNT_ID environment variable is required');
}

const app = new cdk.App();

new AsaRacingStack(app, 'AsaRacingStack', {
  env: { 
    account: process.env.AWS_ACCOUNT_ID,
    region: 'us-west-1'
  },
  githubOwner: 'mzienert',
  githubRepo: 'asa-racing-core',
  githubBranch: 'main',
  githubTokenSecretName: 'github-token-secret-name',
  tags: {
    Environment: 'production',
    Project: 'AsaRacing'
  }
});

app.synth();