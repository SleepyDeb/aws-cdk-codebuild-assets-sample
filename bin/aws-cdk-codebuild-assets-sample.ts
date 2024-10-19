#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SampleStage } from '../lib/sample.stage';

const app = new cdk.App();
new SampleStage(app, 'SampleStage', { });