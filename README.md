## How to Deploy

Before you start, make sure you have Docker installed and accessible. On Windows using Rancher Desktop in moby compatibility, you might need administrator privileges to build due to some limitations in the AwsNodejsLambda bundling process.

1. **Install dependencies:**
    ```bash
    npm ci
    ```

2. **Synthesize the CloudFormation template:**
    ```bash
    npx cdk synth
    ```

3. **Set the AWS region:**
    ```bash
    export AWS_REGION=xx-xxxx-x
    ```

4. **Set the AWS profile:**
    ```bash
    export AWS_PROFILE=your_profile_name
    ```

5. **Deploy the stack:**
    ```bash
    npx cdk deploy --all
    ```
