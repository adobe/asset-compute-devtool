[![Version](https://img.shields.io/npm/v/@adobe/asset-compute-devtool.svg)](https://npmjs.org/package/@adobe/asset-compute-devtool)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0)
[![Travis](https://travis-ci.com/adobe/asset-compute-devtool.svg?branch=master)](https://travis-ci.com/adobe/asset-compute-devtool)

# Asset Compute Development Tool
Developer tool for exploring and testing the service.


## Environment Variables

Please set the following credentials in a `.env` file in the root of the `/server` folder.

For more information on setting up credentials, see [Cloud Storage Container](#1-s3-bucket-or-azure-blob-storage-credentials) and [Adobe I/O Console Techinical Integrations](#2-adobe-io-console-technical-integration) below.

```bash
# Defaults to Asset Compute Production endpoint
ASSET_COMPUTE_URL=

# Path to AIO Integration yaml
AIO_INTEGRATION_FILE_PATH=

# S3 credentials
S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=

# Azure Storage credentials
AZURE_STORAGE_ACCOUNT=
AZURE_STORAGE_KEY=
AZURE_STORAGE_CONTAINER_NAME=

# Optional (used for development)
# NODE_ENV=

# Optional (can be used during development)
# ASSET_COMPUTE_DEV_PORT=
```

## Usage

### Production (build and use static UI):
1. cd into `/server`
2. Make sure to do a clean `npm install` in both `/server` and `/client`
3. if this is your first time using the dev tool or there were changes to the UI since you used it last, run  `npm run build`
4. run `npm run server`

### Development
1. Make sure to set environment variable:  `NODE_ENV='development'`
2. If it is your first time using the dev tool or you made changes to the UI, cd into `/client` and run `npm install` <br/>
3. cd into the `/server` directory. (remember to do an `npm install`) <br/>
4. run `npm start` <br />

Note: The **backend port** will default to 9000. If you already have something running on that port or would like to change it, set the `ASSET_COMPUTE_DEV_PORT` environment variable. **WARNING: this updates the package.json in /client**


### Releasing
1. Make sure to do a clean `npm install` in both `/server` and `/client`
2. cd into `/server`
3. Run  `npm run build`
4. Create the git tag for the release
5. Run `npm publish --access public --dry-run` then `npm publish --access public` script to release to npm



![](files/meahana-screenshot-2.png)

## Prerequisites

### 1. S3 Bucket or Azure Blob Storage Credentials:
Access to at least one blob storage container is required for using the development tool. Currently, we only support S3 and Azure.

#### Creating an Azure Blob Storage Container
Follow the steps [here](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blob-create-account-block-blob?tabs=azure-portal) to create a storage container.

#### Creating an S3 bucket
1. **Create a new bucket** under `Services > S3 > Create bucket`.
3. Ensure the user has access to the bucket
   * To check: go to `Services > S3` and search for the bucket (e.g. `my-bucket`). If you can see it, click on it and are able to Upload a file, then things should be good.
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
   * These two keys have to be set in the `.env` file to be used in the development tool

### 2. Adobe I/O Console Technical Integration
<!-- link documentation here from custom worker documention once open sourced -->


### Contributing
Contributions are welcomed! Read the [Contributing Guide](./.github/CONTRIBUTING.md) for more information.

### Licensing
This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
