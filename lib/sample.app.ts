import { App, AppProps } from "aws-cdk-lib";
import { CodebuildResourceProviderStack } from "./codebuild-resource-provider.stack";
import { CodebuildAssetsSampleStack } from "./codebuild-ecr-assets-sample.stack";
import { SampleLambdaStack } from "./sample-lambda.stack";

export class SampleApp extends App {
    constructor(props?: AppProps) {
        super(props);

        const { resourceProvider } = new CodebuildResourceProviderStack(this, `codebuild-resource-provider`, {});
        const {  ecrRepository, ecrDigest } = new CodebuildAssetsSampleStack(this, `codebuild-assets`, {
            serviceToken: resourceProvider.functionArn
        });

        new SampleLambdaStack(this, `codebuild-assets-sample-lambda`, {
            ecrRepository,
            ecrImageReference: ecrDigest,
            ecrImageReferenceType: 'DIGEST'
        });
    }
}