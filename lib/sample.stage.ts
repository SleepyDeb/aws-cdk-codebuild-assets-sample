import { IConstruct } from "constructs";
import { Stage, StageProps } from "aws-cdk-lib";
import { CodebuildResourceProviderStack } from "./codebuild-resource-provider.stack";

export class SampleStage extends Stage {
    constructor(scope: IConstruct, id: string, props?: StageProps) {
        super(scope, id, props);

        const { resourceProvider } = new CodebuildResourceProviderStack(this, `codebuild-resource`, {});
        
    }
}