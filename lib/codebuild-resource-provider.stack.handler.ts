import { Callback, Context, CustomResource, Event, Logger } from 'aws-cloudformation-custom-resource';
import { strict as assert } from 'assert';
import * as codebuild from '@aws-sdk/client-codebuild';
import { promisify } from 'util'
import * as jp from 'jsonpath';

const sleep = promisify(setTimeout);
export interface ResourceProperties {
    codebuildProjectName: string;
    resultJsonPath: string
}

export function handler(event: Event<ResourceProperties>, context: Context, callback: Callback) {
    new CustomResource<ResourceProperties>(
        event,
        context,
        callback,
        createOrUpdateResource,
        createOrUpdateResource,
        deleteResource,
    );
};

async function createOrUpdateResource(resource: CustomResource<ResourceProperties>, log: Logger) {
    const codebuildProjectName = resource.properties.codebuildProjectName.value;
    assert(codebuildProjectName, `codebuildProjectName property must be defined`);

    const jsonPath = resource.properties.resultJsonPath.value ?? '$.artifacts.location';
    resource.setPhysicalResourceId(codebuildProjectName);

    const client = new codebuild.CodeBuildClient({});

    log.info(`Starting codebuild project: ${codebuildProjectName}`);
    const startBuildResult = await client.send(new codebuild.StartBuildCommand({
        projectName: codebuildProjectName
    }));
    const buildId = startBuildResult.build?.id;
    assert(buildId, `Codebuild startBuild returned an empty build.id`);

    log.info(`Returned buildId: ${buildId}, waiting the execution...`);
    do {
        await sleep(15000);
        log.info(`Getting build status...`);
        const status = await client.send(new codebuild.BatchGetBuildsCommand({
            ids: [ buildId ]
        }))

        const build = status.builds?.[0];
        if(!build) continue;

        if(build.buildStatus == 'IN_PROGRESS') {
            log.info(`Build still in progress, waiting...`);
            continue;
        }

        log.info(`Returned status: ${build.buildStatus}`);
        if(build.buildStatus != 'SUCCEEDED')
            throw new Error(`CodeBuild project build didn't succeed, status: ${build.buildStatus}`);

        const result = jp.query(build, jsonPath)?.[0];
        assert(result, `Codebuild build result didn't return anything for path: ${jsonPath}`);

        resource.addResponseValue(`result`, result as string);
        return result;
    } while(resource.context.getRemainingTimeInMillis() < 1000);

    throw new Error(`Lambda Timeout, CodeBuild didn't complete in time, try to increase the timeout on the function deployment.`);
}

async function deleteResource(_resource: CustomResource<ResourceProperties>, log: Logger) {
    return Promise.resolve();
}