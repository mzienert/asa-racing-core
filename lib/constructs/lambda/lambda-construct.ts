import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';
import * as fs from 'fs';

interface LambdaConstructProps {
  cognitoUserPoolArn: string;
  dynamoTableArn: string;
  iamRole: iam.Role;
}

export class LambdaConstruct extends Construct {
  public readonly functions: Map<string, lambda.Function> = new Map();

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    // Discover and create functions from the src/functions directory
    this.discoverAndCreateFunctions(props);
  }

  private discoverAndCreateFunctions(props: LambdaConstructProps) {
    // Let's add some logging to debug the path and found files
    const basePath = path.resolve(__dirname, '../../../src/functions');
    console.log('Base path for function discovery:', basePath);
    this.walkDirectory(basePath, '', props);
  }

  private walkDirectory(currentPath: string, routePath: string, props: LambdaConstructProps) {
    console.log('Walking directory:', currentPath);
    const items = fs.readdirSync(currentPath);
    console.log('Found items:', items);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        this.walkDirectory(
          fullPath,
          routePath ? `${routePath}/${item}` : item,
          props
        );
      } else if (item === 'index.ts') {
        console.log('Found Lambda function:', routePath);
        const functionName = routePath.replace(/\//g, '-') || 'root';
        const lambda = this.createLambdaFunction(fullPath, functionName, props);
        this.functions.set(routePath, lambda);
      }
    }
  }

  private createLambdaFunction(
    filePath: string,
    functionName: string,
    props: LambdaConstructProps
  ): lambda.Function {
    // Create explicit role with required permissions
    const lambdaRole = new iam.Role(this, `${functionName}-Role`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    });

    // Add explicit CloudWatch permissions
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents'
      ],
      resources: ['*']
    }));

    return new nodejs.NodejsFunction(this, `Lambda-${functionName}`, {
      entry: filePath,
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      role: lambdaRole,  // Use our new role instead of props.iamRole
      environment: {
        COGNITO_USER_POOL_ARN: props.cognitoUserPoolArn,
        DYNAMO_TABLE_ARN: props.dynamoTableArn,
      },
      bundling: {
        minify: true,
        sourceMap: true,
      },
      logRetention: cdk.aws_logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE
    });
  }
}