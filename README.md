[![Version](https://img.shields.io/npm/v/@adobe/asset-compute-devtool.svg)](https://npmjs.org/package/@adobe/asset-compute-devtool)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0)
<!-- [![Travis](https://travis-ci.com/adobe/asset-compute-devtool.svg?branch=master)](https://travis-ci.com/adobe/asset-compute-devtool) -->

# Asset Compute Development Tool
Developer tool for exploring and testing the service.

## Prerequisites

### 1. S3 Bucket or Azure Blob Storage Credentials:
Access to at least one blob storage container is required for using the development tool. Currently, we only support AWS S3 and Azure Blob Storage.

_Note: This cloud storage can be shared across developers and custom workers projects. You do not need a separate cloud storage container per project._

#### Creating an Azure Blob Storage Container
1. If you do not already have an account, follow the steps [here](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blob-create-account-block-blob?tabs=azure-portal) to create a storage account.
2. If you do not already have a container, [create a new container](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-portal):
    1. Navigate to your storage account in the Azure portal.
    2. In the left menu for the storage account, scroll to the Blob service section, then select Containers.
    3. Select the `+` Container button and choose a name for the container.
    4. Select access level. (We reccomend private.)
    5. Select OK to create the container.
3. Retrieve Azure storage account key by following the steps [here](https://docs.microsoft.com/en-us/azure/storage/common/storage-account-keys-manage?tabs=azure-portal#view-account-access-keys).
4. Set the Azure Storage environment variables in you `.env` file:
```
AZURE_STORAGE_ACCOUNT=
AZURE_STORAGE_KEY=
AZURE_STORAGE_CONTAINER_NAME=
```

#### Creating an AWS S3 bucket
For complete information on setting up you AWS account and S3 bucket, see documentation [here](https://docs.aws.amazon.com/AmazonS3/latest/gsg/SigningUpforS3.html)
1. **Create a new bucket** under `Services > S3 > Create bucket`.
3. Ensure the user has access to the bucket
   * To check: go to `Services > S3` and search for the bucket (e.g. `my-bucket`).You should be able to see the bucket, click on it and upload a file.
   * The minimal permission someone needs to give your user is an S3 policy like below. Replace `BUCKET` with the name of your bucket:
     ```json
     {
         "Version": "2012-10-17",
         "Statement": [
             {
                 "Sid": "VisualEditor0",
                 "Effect": "Allow",
                 "Action": [
                     "s3:PutObject",
                     "s3:GetObject",
                     "s3:ListBucketByTags",
                     "s3:ListBucketMultipartUploads",
                     "s3:DeleteObjectVersion",
                     "s3:ListBucket",
                     "s3:DeleteObject",
                     "s3:GetObjectVersion",
                     "s3:ListMultipartUploadParts"
                 ],
                 "Resource": [
                     "arn:aws:s3:::BUCKET/*",
                     "arn:aws:s3:::BUCKET"
                 ]
             },
             {
                 "Sid": "VisualEditor1",
                 "Effect": "Allow",
                 "Action": "s3:HeadBucket",
                 "Resource": "*"
             }
         ]
     }
     ```

4. Retrieve the AWS keys for your user. You might have them stored locally somewhere. Otherwise, get new AWS keys for your user:
   * Go to `Services > IAM > Users`
   * Search for your username and click on the user
   * Go to the tab `Security credentials`
   * If you had previous keys, you see them, but you won't be able to get the secret key from AWS again, so if you've lost it, then you have to delete an old one first.
   * Click `Create access key`
   * Copy the access key and the secret key and store them safely (e.g. in your password manager)
5. Fill in the AWS S3 credentials to your `.env` file:
```
S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
```

### 2. Adobe I/O Console Technical Integration
<!-- link documentation here from custom worker documention once open sourced -->
1. Be granted System Admin or Developer Role access in the Experience Organization (This can be set by a System Admin in the [Admin Console](https://adminconsole.adobe.com/overview))
2. Log onto the [Adobe Developer Console](https://console.adobe.io/)
    - Make sure you are in the same Adobe Experience Cloud Organization as your AEM as a Cloud Service Integration
    - _For reference, here is the [Adobe Developer Console](https://www.adobe.io/apis/experienceplatform/console/docs.html) documentation_
4. Create a new project and subscribe to the services needed for Asset Compute:
    - Go back to the Organization main Project page
    - Click "Create new project" => "Empty project"
    - Go into your new project and add the following APIs and services to your project (_You must add each service one at a time_)
        - Click on `"Add to Project" => "API"` and add each of these services one at a time: `"Asset Compute"`, `"IO Events"`, `"IO Events Management"`
        - Click on `"Add to Project" => "Runtime"` to add Adobe IO Runtime to your project
6. Retrieve and format credentials for Asset Compute service development.

    Navigate to your Asset Compute project or workspace created in step 4, press the `"Download"` button to download your credentials. Add the necessary credentials to a YAML file based off of [template](template.yaml) and save it to a secure location on your machine. This file is needed to use the Asset Compute Development tool.

    #### YAML File details
    Below are a description of what each of the items in the YAML file maps to in the JSON downloaded from the Developer Console:

    | Name | Description | Maps to in Downloaded JSON |
    | ---- | ----------- | -------------------------- |
    | `metascopes` | Metascopes for Asset Compute Service | `project.workspace.details.credentials[0].jwt.meta_scopes` |
    | `technicalAccount.id` | Technical account ID | `project.workspace.details.credentials[0].jwt.techacct` |
    | `technicalAccount.org` | Adobe Experience Cloud Organization ID | `project.org.ims_org_id` |
    | `technicalAccount.clientId` | API Key (Client ID)| `project.workspace.details.credentials[0].jwt.client_id` |
    | `technicalAccount.clientSecret`| Client Secret | `project.workspace.details.credentials[0].jwt.client_secret` |
    | `publicKey` and `privateKey`| Created and downloaded to a safe location on your machine when you added the APIs | none |



## Environment Variables

Please set the following credentials in a `.env` file in the root of the `/server` folder.

For more information on setting up credentials, see [Cloud Storage Container](#1-s3-bucket-or-azure-blob-storage-credentials) and [Adobe I/O Console Techinical Integrations](#2-adobe-io-console-technical-integration) below.

```bash
# Defaults to Asset Compute Production endpoint
ASSET_COMPUTE_URL=

# Path to AIO Integration yaml
ASSET_COMPUTE_INTEGRATION_FILE_PATH=

# S3 credentials
S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=

# Azure Storage credentials
AZURE_STORAGE_ACCOUNT=
AZURE_STORAGE_KEY=
AZURE_STORAGE_CONTAINER_NAME=

# Optional (can be used during development)
# ASSET_COMPUTE_DEV_PORT=
```

## Usage

### Production (build and use static UI):
1. cd into `/server`
2. Make sure to do a clean `npm install` in both `/server` and `/client`
3. if this is your first time using the dev tool or there were changes to the UI since you used it last, run  `npm run build`
4. run `npm start`

### Development
1. Make sure to set environment variable:  `ASSET_COMPUTE_DEV_TOOL_ENV='development'`
2. If it is your first time using the dev tool or you made changes to the UI, cd into `/client` and run `npm install` <br/>
3. cd into the `/server` directory. (remember to do an `npm install`) <br/>
4. run `npm run development` <br />

Note: The **backend port** will default to 9000. If you already have something running on that port or would like to change it, set the `ASSET_COMPUTE_DEV_PORT` environment variable. **WARNING: this updates the package.json in /client**


### Releasing
1. Make sure to do a clean `npm install` in both `/server` and `/client`
2. cd into `/server`
3. Run  `npm run build`
4. Create the git tag for the release
5. Run `npm publish --access public --dry-run` then `npm publish --access public` script to release to npm



![](files/meahana-screenshot-2.png)


### Contributing
Contributions are welcomed! Read the [Contributing Guide](./.github/CONTRIBUTING.md) for more information.

### Licensing
This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
