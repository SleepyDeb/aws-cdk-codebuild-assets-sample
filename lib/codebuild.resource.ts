import { CustomResource } from "aws-cdk-lib";
import { IConstruct } from "constructs";
import { CodebuildResourceProvider } from "./codebuild-resource-provider.resource";

export interface CodebuildResourceProps {
    serviceToken?: string,
    projectName: string,
    resultJsonPaths: string[],
    forceRebuild?: boolean
}

export class CodebuildResource extends CustomResource {
    public readonly results: string[];

    constructor(scope: IConstruct, id: string, props: CodebuildResourceProps) {
        super(scope, id, {
            serviceToken: props.serviceToken ?? CodebuildResourceProvider.getOrCreateServiceToken(scope),
            resourceType: `Custom::Codebuild-Asset`,
            properties: {
                codebuildProjectName: props.projectName,
                resultJsonPaths: props.resultJsonPaths,
                rebuildProperty: props.forceRebuild ? new Date().toISOString() : ''
            }
        });

        this.results = Object.keys(props.resultJsonPaths)
            .map(index => this.getAttString(`results[${index}]`));
    }
}