import { IConstruct } from "constructs";
import { Stage, StageProps } from "aws-cdk-lib";
import { CodebuildResourceProviderStack } from "./codebuild-resource-provider.stack";
import { CodebuildAssetsSampleStack } from "./codebuild-ecr-assets-sample.stack";
import { SampleLambdaStack } from "./sample-lambda.stack";

export class SampleStage extends Stage {
    constructor(scope: IConstruct, id: string, props?: StageProps) {
        super(scope, id, props);

        const { resourceProvider } = new CodebuildResourceProviderStack(this, `codebuild-resource-provider`, {});
        const { ecrRepositoryArn, ecrImageDigest } = new CodebuildAssetsSampleStack(this, `codebuild-`, {
            serviceToken: resourceProvider.functionArn
        });
        
        new SampleLambdaStack(this, `sample-lambda`, {
            ecrRepositoryArn,
            ecrTagOrDigest: ecrImageDigest
        })
    }
}