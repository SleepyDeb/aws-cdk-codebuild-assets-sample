#!/usr/bin/env node
import 'source-map-support/register';
import { SampleStack } from '../lib/sample.stack';
import { App } from 'aws-cdk-lib';

const app = new App();
new SampleStack(app, `codebuild-assets-sample`, { });
