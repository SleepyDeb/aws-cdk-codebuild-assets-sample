import { Callback, Context, CustomResource, Event, Logger } from 'aws-cloudformation-custom-resource';
import { strict as assert } from 'assert';
import { promisify } from 'util'
import * as codebuild from '@aws-sdk/client-codebuild';
import * as jp from 'jsonpath';
import * as crypto from 'crypto';

const sleep = promisify(setTimeout);
export interface ResourceProperties {
    codebuildProjectName: string;
    resultJsonPaths?: string[],
    initialDelaySeconds?: string
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

async function waitForProjectToBeReady(projectName: string, initialDelaySeconds: number, log: Logger) {
    const client = new codebuild.CodeBuildClient({});
    const result = await client.send(new codebuild.BatchGetProjectsCommand({
        names: [ projectName ]
    }));
    const project = result.projects?.[0];
    assert(project, `Can't find project: ${projectName}`);

    const createdOn = project.created ?? new Date();
    const now = new Date();

    const initialDelayMillis = initialDelaySeconds * 1000;
    const elapsedMillis = now.getTime() - createdOn.getTime();

    if(elapsedMillis < initialDelayMillis) {
        const millisToWait = initialDelayMillis - elapsedMillis;
        await sleep(millisToWait);
    }
}

async function loadParameters(resource: CustomResource<ResourceProperties>, log: Logger) {
    const codebuildProjectName = resource.properties.codebuildProjectName.value;
    assert(codebuildProjectName, `codebuildProjectName property must be defined`);

    const jsonPaths =  resource.properties.resultJsonPaths?.value ?? [ '$.artifacts.location' ];

    const initialDelaySecondsStr = resource.properties.initialDelaySeconds?.value ?? '60';
    const initialDelaySeconds = Number.parseInt(initialDelaySecondsStr);
    assert(!Number.isNaN(initialDelaySeconds) && initialDelaySeconds > -1, `initialDelaySeconds must be a valid positive integer number`);

    log.info(`Loaded parameters, codebuildProjectName: ${codebuildProjectName}, jsonPath: ${JSON.stringify(jsonPaths)}, initialDelaySeconds: ${initialDelaySeconds}`)
    return {
        codebuildProjectName,
        jsonPaths,
        initialDelaySeconds
    }
}

function sha256(str: string) {
    const hash = crypto.createHash('sha256')
    return hash.update(str).digest('hex')
}

function generateResourceId(projectName: string, jsonPaths: string[]) {
    const hashMaterial = `${projectName}:${JSON.stringify(jsonPaths)}`;
    const hash = sha256(hashMaterial);
    return `${projectName}:${hash}`;
}

async function startCodebuildProject(projectName: string, log: Logger) {
    const client = new codebuild.CodeBuildClient({});
    log.info(`Starting codebuild project: ${projectName}`);
    const startBuildResult = await client.send(new codebuild.StartBuildCommand({
        projectName
    }));
    const buildId = startBuildResult.build?.id;
    assert(buildId, `Codebuild startBuild returned an empty build.id`);
    return buildId;
}

async function getBuildStatus(buildId: string, log: Logger) {
    log.info(`Getting build status...`);
    const client = new codebuild.CodeBuildClient({});
    const status = await client.send(new codebuild.BatchGetBuildsCommand({
        ids: [ buildId ]
    }))
    
    const build = status.builds?.[0];
    assert(build, `BatchGetBuildsCommand didn't return the build status.`)

    return build;
}

function extractJsonPathProperty(build: codebuild.Build, jsonPath: string, log: Logger) {
    const result = jp.query(build, jsonPath)?.[0];
    assert(result, `Codebuild build result didn't return anything for path: ${jsonPath}`);

    if(typeof result != "string") {
        log.warn(`The returned jsonPath expression is not a string, serializing the value using JSON.stringify()`);
        return JSON.stringify(result);
    }

    return result;
}

async function waitCodebuildExecutionCompletion(buildId: string, context: Context, log: Logger, delayBetweenChecksMs = 5000, timeoutRemainingMs = 1000) {
    log.info(`Returned buildId: ${buildId}, waiting the execution...`);
    do {
        await sleep(delayBetweenChecksMs);

        const build = await getBuildStatus(buildId, log);
        if(build.buildStatus == 'IN_PROGRESS') {
            log.info(`Build still in progress, waiting...`);
            continue;
        }

        log.info(`Returned status: ${build.buildStatus}`);
        if(build.buildStatus != 'SUCCEEDED') {
            console.error(`CodeBuild buildStatus: ${build.buildStatus}, build: ${JSON.stringify(build)}`);
            throw new Error(`CodeBuild project build didn't succeed, status: ${build.buildStatus}, logs: ${build.logs?.deepLink}`);
        }

        return build;
    } while(canContinueExecution(context, timeoutRemainingMs));

    throw new Error(`Lambda Timeout, CodeBuild didn't complete in time, try to increase the timeout on the function deployment.`);
}

function canContinueExecution(context: Context, timeoutRemainingMs: number) {
    return context.getRemainingTimeInMillis() > timeoutRemainingMs;
}

async function createOrUpdateResource(resource: CustomResource<ResourceProperties>, log: Logger) {
    const {
        codebuildProjectName,
        jsonPaths,
        initialDelaySeconds
    } = await loadParameters(resource, log);

    const resourceId = generateResourceId(codebuildProjectName, jsonPaths);
    resource.setPhysicalResourceId(resourceId);

    await waitForProjectToBeReady(codebuildProjectName, initialDelaySeconds, log);
    
    const buildId = await startCodebuildProject(codebuildProjectName, log);

    const build = await waitCodebuildExecutionCompletion(buildId, resource.context, log);

    for(const [index, jsonPath] of Object.entries(jsonPaths)) {
        const result = extractJsonPathProperty(build, jsonPath, log);
        resource.addResponseValue(`results[${index}]`, result);
    }
}

async function deleteResource(_resource: CustomResource<ResourceProperties>, log: Logger) {
    return Promise.resolve();
}