import { Duration, aws_lambda_nodejs as lambdajs, aws_lambda as lambda, aws_iam as iam, BundlingFileAccess, Names, Stack } from "aws-cdk-lib";
import { IConstruct } from "constructs";
import { Statement } from 'cdk-iam-floyd';

export interface CodebuildResourceProviderProps {
    functionName?: string
    role?: iam.IRole,
    timeout?: Duration
}

export class CodebuildResourceProvider extends lambdajs.NodejsFunction {
    constructor(scope: IConstruct, id: string, props?: CodebuildResourceProviderProps) {
        super(scope, id,  {
            functionName: props?.functionName,
            timeout: props?.timeout ?? Duration.minutes(6),
            role: props?.role,
            runtime: lambda.Runtime.NODEJS_20_X,
            entry: `${__dirname}/codebuild-resource-provider.handler.ts`,
            bundling: {
                externalModules: [
                    "jsonpath"
                ],
                nodeModules: [
                    "jsonpath"
                ],
                bundlingFileAccess: BundlingFileAccess.VOLUME_COPY              
            },
            initialPolicy: [
                new Statement.Codebuild()
                    .toStartBuild()
                    .toBatchGetBuilds()
                    .toBatchGetProjects()
            ]
        });
    }

    public static getOrCreate(scope: IConstruct, props?: CodebuildResourceProviderProps) {
        const uid = `${Names.nodeUniqueId(scope.node)}-codebuild-resource-provider`;
        const stack = Stack.of(scope);

        let provider = stack.node.tryFindChild(uid) as CodebuildResourceProvider;
        if (!provider) {
          provider = new CodebuildResourceProvider(stack, uid, props);
        }
    
        return provider;
    }

    
    public static getOrCreateServiceToken(scope: IConstruct, props?: CodebuildResourceProviderProps) {
        return this.getOrCreate(scope, props).functionArn;
    }
}