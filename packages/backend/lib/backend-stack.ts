import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { join } from 'path';

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    dotenv.config({ path: `${__dirname}/../.env` });

    const queue = new sqs.Queue(this, 'MyQueue', {
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    const api = new cdk.aws_apigateway.RestApi(this, 'RestApi', {});

    const frontendOrigin =
      process.env.FRONTEND_ORIGIN || 'https://shouldntve.com';

    const users = api.root.addResource('users');
    users.addCorsPreflight({
      allowOrigins: cdk.aws_apigateway.Cors.ALL_ORIGINS,
      allowMethods: cdk.aws_apigateway.Cors.ALL_METHODS,
      allowHeaders: cdk.aws_apigateway.Cors.DEFAULT_HEADERS,
    });

    const table = new cdk.aws_dynamodb.Table(this, 'UsersTable', {
      partitionKey: {
        name: 'PK',
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const otpTable = new cdk.aws_dynamodb.Table(this, 'AuthOtpsTable', {
      partitionKey: { name: 'PK', type: cdk.aws_dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: cdk.aws_dynamodb.AttributeType.STRING },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'expiresAt',
    });

    const otpSecret = new cdk.aws_secretsmanager.Secret(this, 'OtpSecret', {
      description: 'OTP secret for HMAC hashing of one-time codes',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: 'otp',
        passwordLength: 40,
      },
    });

    const jwtSecret = new cdk.aws_secretsmanager.Secret(this, 'JwtSecret', {
      description: 'JWT signing secret for auth tokens',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: 'jwt',
        passwordLength: 64,
      },
    });

    const listUsers = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      'ListUsers',
      {
        entry: join(__dirname, 'functions', 'listUsers.ts'),
        handler: 'handler',
        environment: {
          TABLE_NAME: table.tableName,
        },
        bundling: {
          minify: true,
          externalModules: ['@aws-sdk/client-dynamodb'],
        },
        runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      }
    );
    table.grantReadData(listUsers);
    users.addMethod('GET', new cdk.aws_apigateway.LambdaIntegration(listUsers));

    const protectedHandler = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      'ProtectedHandler',
      {
        entry: join(__dirname, 'functions', 'protectedHandler.ts'),
        handler: 'handler',
        environment: {
          JWT_SECRET_ARN: jwtSecret.secretArn,
          FRONTEND_ORIGIN: frontendOrigin,
        },
        bundling: {
          minify: true,
          externalModules: ['@aws-sdk/client-secrets-manager'],
        },
        runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      }
    );
    jwtSecret.grantRead(protectedHandler);

    const protectedRes = api.root.addResource('protected');
    protectedRes.addCorsPreflight({
      allowOrigins: [frontendOrigin],
      allowMethods: cdk.aws_apigateway.Cors.ALL_METHODS,
      allowHeaders: cdk.aws_apigateway.Cors.DEFAULT_HEADERS,
      allowCredentials: true,
    });
    protectedRes.addMethod(
      'GET',
      new cdk.aws_apigateway.LambdaIntegration(protectedHandler, {
        proxy: true,
      })
    );

    const createUser = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      'CreateUser',
      {
        entry: join(__dirname, 'functions', 'createUser.ts'),
        handler: 'handler',
        environment: {
          TABLE_NAME: table.tableName,
        },
        bundling: {
          minify: true,
          externalModules: ['@aws-sdk/client-dynamodb'],
        },
        runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      }
    );
    table.grantWriteData(createUser);
    users.addMethod(
      'POST',
      new cdk.aws_apigateway.LambdaIntegration(createUser)
    );

    const updateUser = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      'UpdateUser',
      {
        entry: join(__dirname, 'functions', 'updateUser.ts'),
        handler: 'handler',
        environment: {
          TABLE_NAME: table.tableName,
          JWT_SECRET_ARN: jwtSecret.secretArn,
          FRONTEND_ORIGIN: frontendOrigin,
        },
        bundling: {
          minify: true,
          externalModules: ['@aws-sdk/client-dynamodb'],
        },
        runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      }
    );
    table.grantReadWriteData(updateUser);
    jwtSecret.grantRead(updateUser);
    users.addMethod(
      'PUT',
      new cdk.aws_apigateway.LambdaIntegration(updateUser, { proxy: true })
    );

    const requestOtp = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      'RequestOtp',
      {
        entry: join(__dirname, 'functions', 'requestOtp.ts'),
        handler: 'handler',
        environment: {
          TABLE_NAME_OTPS: otpTable.tableName,
          OTP_SECRET_ARN: otpSecret.secretArn,
          SES_FROM_ADDRESS: process.env.SES_FROM_ADDRESS || '',
          FRONTEND_ORIGIN: frontendOrigin,
        },
        bundling: {
          minify: true,
          externalModules: ['@aws-sdk/client-dynamodb', '@aws-sdk/client-sns'],
        },
        runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      }
    );
    otpTable.grantWriteData(requestOtp);
    otpTable.grantReadData(requestOtp);
    requestOtp.addToRolePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ['sns:Publish'],
        resources: ['*'],
      })
    );
    requestOtp.addToRolePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'],
      })
    );

    const verifyOtp = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      'VerifyOtp',
      {
        entry: join(__dirname, 'functions', 'verifyOtp.ts'),
        handler: 'handler',
        environment: {
          TABLE_NAME_OTPS: otpTable.tableName,
          USERS_TABLE: table.tableName,
          OTP_SECRET_ARN: otpSecret.secretArn,
          JWT_SECRET_ARN: jwtSecret.secretArn,
          MAX_AUTHS_PER_DAY: process.env.MAX_AUTHS_PER_DAY || '4',
          SES_FROM_ADDRESS: process.env.SES_FROM_ADDRESS || '',
          FRONTEND_ORIGIN: frontendOrigin,
        },
        bundling: {
          minify: true,
          externalModules: ['@aws-sdk/client-dynamodb'],
        },
        runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      }
    );
    otpTable.grantReadWriteData(verifyOtp);
    table.grantReadWriteData(verifyOtp);
    otpSecret.grantRead(requestOtp);
    otpSecret.grantRead(verifyOtp);
    jwtSecret.grantRead(verifyOtp);

    const auth = api.root.addResource('auth');
    const requestOtpRes = auth.addResource('request-otp');
    requestOtpRes.addCorsPreflight({
      allowOrigins: [frontendOrigin],
      allowMethods: cdk.aws_apigateway.Cors.ALL_METHODS,
      allowHeaders: cdk.aws_apigateway.Cors.DEFAULT_HEADERS,
      allowCredentials: true,
    });
    requestOtpRes.addMethod(
      'POST',
      new cdk.aws_apigateway.LambdaIntegration(requestOtp, { proxy: true })
    );
    const verifyOtpRes = auth.addResource('verify-otp');
    verifyOtpRes.addCorsPreflight({
      allowOrigins: [frontendOrigin],
      allowMethods: cdk.aws_apigateway.Cors.ALL_METHODS,
      allowHeaders: cdk.aws_apigateway.Cors.DEFAULT_HEADERS,
      allowCredentials: true,
    });
    verifyOtpRes.addMethod(
      'POST',
      new cdk.aws_apigateway.LambdaIntegration(verifyOtp, { proxy: true })
    );

    const logout = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'Logout', {
      entry: join(__dirname, 'functions', 'logout.ts'),
      handler: 'handler',
      environment: {
        FRONTEND_ORIGIN: frontendOrigin,
      },
      bundling: {
        minify: true,
      },
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
    });

    const logoutRes = auth.addResource('logout');
    logoutRes.addCorsPreflight({
      allowOrigins: [frontendOrigin],
      allowMethods: cdk.aws_apigateway.Cors.ALL_METHODS,
      allowHeaders: cdk.aws_apigateway.Cors.DEFAULT_HEADERS,
      allowCredentials: true,
    });
    logoutRes.addMethod(
      'POST',
      new cdk.aws_apigateway.LambdaIntegration(logout, { proxy: true })
    );

    new cdk.CfnOutput(this, 'QueueArn', {
      value: queue.queueArn,
      description: 'ARN of the SQS Queue',
      exportName: `${id}-QueueArn`,
    });

    new cdk.CfnOutput(this, 'RestApiUrl', {
      value: api.url,
      description: 'URL of the API Gateway',
      exportName: `${id}-RestApiUrl`,
    });
  }
}
