import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { CorsOptions } from 'aws-cdk-lib/aws-apigateway';

interface ApiGatewayConstructProps {
  lambdaFunctions: Map<string, lambda.Function>;
  cognitoUserPool: cognito.IUserPool;
  stage: string;
}

export class ApiGatewayConstruct extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayConstructProps) {
    super(scope, id);

    this.api = new apigateway.RestApi(this, 'AsaRacingApi', {
      restApiName: 'ASA Racing API',
      defaultCorsPreflightOptions: {
        allowOrigins: ['https://www.asaracing.live'],
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'Cookie',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token'
        ],
        allowCredentials: true,
        maxAge: cdk.Duration.seconds(300),
      },
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true
      }
    });

    // Create all routes
    props.lambdaFunctions.forEach((lambdaFunction, path) => {
      this.createApiRoute(path, lambdaFunction);
    });
  }

  private createApiRoute(path: string, lambdaFunction: lambda.Function) {
    const segments = path.split('/').filter(Boolean);
    let resource: apigateway.IResource = this.api.root;
    
    segments.forEach(segment => {
      const existingResource = resource.getResource(segment);
      resource = existingResource || resource.addResource(segment);
    });

    const integration = new apigateway.LambdaIntegration(lambdaFunction, {
      proxy: true,
      integrationResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': "'https://www.asaracing.live'",
          'method.response.header.Access-Control-Allow-Credentials': "'true'",
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization,Cookie'",
          'method.response.header.Access-Control-Allow-Methods': "'GET,POST,OPTIONS'",
          'method.response.header.Access-Control-Expose-Headers': "'Set-Cookie'",
          'method.response.header.Set-Cookie': 'integration.response.header.Set-Cookie'
        }
      }]
    });

    const methodResponses = [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Allow-Credentials': true,
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Expose-Headers': true,
        'method.response.header.Set-Cookie': true
      }
    }];

    if (path === 'auth/manage-session') {
      resource.addMethod('POST', integration, { methodResponses });
      const verifyResource = resource.addResource('verify');
      verifyResource.addMethod('GET', integration, { methodResponses });
    } else {
      resource.addMethod('GET', integration, { methodResponses });
    }
  }
}