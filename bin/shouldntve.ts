#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ShouldntveStack } from "../lib/shouldntve-stack";

const app = new cdk.App();
new ShouldntveStack(app, "ShouldntveStack", {
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */

  env: { account: "765868434033", region: "us-east-1" },
});
