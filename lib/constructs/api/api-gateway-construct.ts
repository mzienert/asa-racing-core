import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

interface ApiGatewayConstructProps {
  lambdaFunctions: Map<string, lambda.Function>;
  cognitoUserPool: cognito.IUserPool;
}

export class ApiGatewayConstruct extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayConstructProps) {
    super(scope, id);

    // Create the API Gateway
    this.api = new apigateway.RestApi(this, 'AsaRacingApi', {
      restApiName: 'ASA Racing API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
    });

    // Create Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'AsaRacingAuthorizer', {
      cognitoUserPools: [props.cognitoUserPool],
    });

    // Create API routes
    props.lambdaFunctions.forEach((lambdaFunction, path) => {
      this.createApiRoute(path, lambdaFunction, authorizer);
    });
  }

  private createApiRoute(
    path: string,
    lambdaFunction: lambda.Function,
    authorizer: apigateway.CognitoUserPoolsAuthorizer
  ) {
    // Split the path into segments
    const segments = path.split('/').filter(Boolean);
    
    // Start with the root resource
    let resource: apigateway.IResource = this.api.root;
    
    // Create resources for each path segment
    segments.forEach(segment => {
      const existingResource = resource.getResource(segment);
      resource = existingResource || resource.addResource(segment);
    });

    // Default to POST for auth endpoints, GET for others
    const methodName = path.startsWith('auth/') ? 'POST' : 'GET';
    
    // Create integration
    const integration = new apigateway.LambdaIntegration(lambdaFunction);

    // Add method with authorization
    resource.addMethod(methodName, integration, {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
  }
}
