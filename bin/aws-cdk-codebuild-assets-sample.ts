#!/usr/bin/env node
import 'source-map-support/register';
import { CodebuildSampleStack } from '../lib/codebuild-sample.stack';
import { App } from 'aws-cdk-lib';

const app = new App();
new CodebuildSampleStack(app, `codebuild-assets-sample`, { });
