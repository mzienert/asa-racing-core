import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

interface CertificateStackProps extends cdk.StackProps {
  env: {
    account: string;
    region: string;
  };
}

export class CertificateStack extends cdk.Stack {
  public readonly certificateArn: string;

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    super(scope, id, {
      ...props,
      env: { 
        account: props.env.account,
        region: 'us-east-1'
      }
    });

    // Import the existing certificate
    const certificate = acm.Certificate.fromCertificateArn(
      this, 
      'Certificate',
      'arn:aws:acm:us-east-1:619326977873:certificate/8a0ae5ae-7a92-4c22-a236-877c03d78559'
    );

    this.certificateArn = certificate.certificateArn;

    new cdk.CfnOutput(this, 'CertificateArn', {
      value: certificate.certificateArn,
      exportName: 'AsaRacingCertificateArn'
    });
  }
}