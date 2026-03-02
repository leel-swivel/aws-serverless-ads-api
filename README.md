# ads-api

Minimal AWS Serverless **Ads API** built with **Node.js + TypeScript**, **API Gateway**, **Lambda**, **DynamoDB**, **S3**, **SNS**, and **Cognito**.

Authenticated users can create an ad via `POST /api/v1/ads`. The service:

- Validates the request payload.
- Stores the ad in DynamoDB.
- Optionally uploads an image (base64 → S3) and returns a presigned URL.
- Publishes an `AD_CREATED` event to SNS.
- Emits structured JSON logs including `requestId`.

The project is packaged and deployed using **AWS SAM** (`template.yaml`) and validated in CI using **GitHub Actions** and **Jest** with high test coverage.

SonarCloud dashboard: [`leel-swivel_aws-serverless-ads-api`](https://sonarcloud.io/project/overview?id=leel-swivel_aws-serverless-ads-api).

---

## Architecture and Tech Stack

- **Runtime**: Node.js 24.x (SAM `Globals.Function.Runtime: nodejs24.x`)
- **Language**: TypeScript (compiled with `tsc`)
- **API**: API Gateway REST API  
  - `POST /api/v1/ads` (protected by Cognito User Pool authorizer)
- **Lambda**:  
  - `AdsFunction` → `src/handlers/createAd.handler`
- **Persistence**:  
  - DynamoDB table `AdsTable` (primary key: `id`)
- **Storage**:  
  - S3 bucket `AdsBucket` for ad images
- **Events**:  
  - SNS topic `AdsTopic` (publishes `AD_CREATED` events)
- **Auth**:  
  - Cognito User Pool `AdsUserPool` and Client `AdsUserPoolClient`
- **IaC**:  
  - `template.yaml` (AWS SAM)
- **Testing**:  
  - Jest unit tests (100% statements/lines/functions at time of writing)
- **CI/CD**:  
  - `.github/workflows/ci.yml`  
    - Install dependencies  
    - Run Jest with coverage  
    - SonarCloud analysis  
    - Build TypeScript  
    - Optional SAM deploy on `master`

---

## Project Layout

- `src/handlers` – Lambda handlers (entrypoint: `createAd.ts`)
- `src/services` – Business logic (`createAd` service)
- `src/domain` – Types and mappers (`ad.types.ts`, `ad.mapper.ts`)
- `src/repositories` – DynamoDB access (`ad.repository.ts`)
- `src/storage` – S3 image upload & presigned URLs (`image.storage.ts`)
- `src/events` – SNS publishers (`ad.publisher.ts`)
- `src/utils` – Validation, error types, logging, handler wrapper, responses
- `src/models` – Request/response schemas (`ad.schema.ts`)
- `template.yaml` – SAM template describing API, Lambda, DynamoDB, S3, SNS, Cognito
- `.github/workflows/ci.yml` – CI workflow

---

## Prerequisites

- **Node.js**: v20+ (CI uses Node 24)
- **npm**
- **AWS CLI** configured with credentials
- **AWS SAM CLI** installed
- (Optional, for local API emulation) **Docker** for `sam local`

AWS resources (User Pool, DynamoDB, S3, SNS, API Gateway, Lambda) are created by `template.yaml` during `sam deploy`.

---

## Local Setup

1. **Clone the repository**

   ```bash
   git clone <your-repo-url> ads-api
   cd ads-api
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run unit tests**

   ```bash
   npm test               # run all tests
   npm run test:coverage  # run tests with coverage report
   ```

4. **Build the project**

   ```bash
   npm run build
   ```

This will compile TypeScript into `dist/` and is also used by the CI workflow.

---

## Deploying with AWS SAM

Make sure your AWS CLI is configured (`aws configure`) with an IAM user/role that has permissions to create and update:

- Lambda
- API Gateway
- DynamoDB
- S3
- SNS
- Cognito
- CloudFormation stacks

Minimal policies for the CI/deploy user (high level):

- `AWSCloudFormationFullAccess` (or equivalent limited set to create/update stacks)
- `AmazonAPIGatewayAdministrator` or fine-grained API Gateway permissions
- `AWSLambda_FullAccess` or equivalent for Lambda functions/log groups
- `AmazonDynamoDBFullAccess` for DynamoDB tables used in this stack
- `AmazonS3FullAccess` (or bucket-scoped) for `AdsBucket`
- `AmazonSNSFullAccess` (or topic-scoped) for `AdsTopic`
- `AmazonCognitoPowerUser` (or limited user-pool/client management permissions)

> In a real production setup, these should be scoped to only the specific resources and actions required by this stack.

### Build

```bash
sam build
```

### Deploy (first time)

```bash
sam deploy --guided
```

During `--guided`, you will be prompted for:

- **Stack Name** (e.g. `ads-api`)
- **AWS Region** (e.g. `ap-southeast-1`)
- Whether to allow IAM role creation (`CAPABILITY_IAM`)
- Whether to save configuration to `samconfig.toml`

On success, CloudFormation outputs will include:

- `ApiEndpoint` – full URL for `POST /api/v1/ads`
- `UserPoolId` – Cognito User Pool ID
- `UserPoolClientId` – Cognito App Client ID

Example API endpoint from a deployment:

```text
https://mgcaffgwbh.execute-api.ap-southeast-1.amazonaws.com/dev/api/v1/ads
```

---

## Authentication with Cognito (Real User)

The Ads API is protected by a **Cognito User Pool authorizer**. You must send a valid **ID token** in the `Authorization` header to call `POST /api/v1/ads`.

### 1. Generate an ID Token via Cognito `InitiateAuth`

Use the Cognito `InitiateAuth` API with the `USER_PASSWORD_AUTH` flow:

```bash
curl --location 'https://cognito-idp.ap-southeast-1.amazonaws.com/' \
  --header 'Content-Type: application/x-amz-json-1.1' \
  --header 'X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth' \
  --data-raw '{
    "AuthFlow": "USER_PASSWORD_AUTH",
    "ClientId": "1cionhn1prl2vkd9dfs2n94uga",
    "AuthParameters": {
      "USERNAME": "user",
      "PASSWORD": "Abc1234@"
    }
  }'
```

Response (truncated for brevity) will look like:

```json
{
  "AuthenticationResult": {
    "AccessToken": "...",
    "IdToken": "eyJraWQiOiJaYnpLQ0hS...",
    "RefreshToken": "...",
    "ExpiresIn": 3600,
    "TokenType": "Bearer"
  },
  "ChallengeParameters": {}
}
```

Take the **`IdToken`** value from `AuthenticationResult.IdToken`. This is what you use as the bearer token for the Ads API.

> Note: The `ClientId` shown above (`1cionhn1prl2vkd9dfs2n94uga`) must match the deployed `AdsUserPoolClient`. If you re-deploy in a new account/region, your `ClientId` will be different.

### 2. Call `POST /api/v1/ads` with the ID Token

Once you have the `IdToken`, call the Ads API like this:

```bash
curl --location 'https://mgcaffgwbh.execute-api.ap-southeast-1.amazonaws.com/dev/api/v1/ads' \
  --header 'Authorization: Bearer <ID_TOKEN_FROM_COGNITO>' \
  --header 'Content-Type: application/json' \
  --data '{
    "title": "50% Off",
    "price": 150
  }'
```

Example with a real token (truncated here for readability):

```bash
curl --location 'https://mgcaffgwbh.execute-api.ap-southeast-1.amazonaws.com/dev/api/v1/ads' \
  --header 'Authorization: Bearer eyJraWQiOiJaYnpLQ0hSdFFud2JPeGN1eWxxMzJCRVlBbEhNUGxYcjAyV2g0akRIK08wPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJkOWJhYjUzYy00MDgxLTcwOGYtOGIxZS05MTk2MjU4YWY2MGQiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmFwLXNvdXRoZWFzdC0xLmFtYXpvbmF3cy5jb21cL2FwLXNvdXRoZWFzdC0xX1p6VE5LbHBGVyIsImNvZ25pdG86dXNlcm5hbWUiOiJ1c2VyIiwib3JpZ2luX2p0aSI6IjQyYzNmYzkzLWMxMzYtNDdmOS05MDY2LTc3ZjBiOWFlNTNkMSIsImF1ZCI6IjFjaW9uaG4xcHJsMnZrZDlkZnMybjk0dWdhIiwiZXZlbnRfaWQiOiIzZWI5MmE4Ni0zMDA3LTQ0N2YtOTQyNi00NjlmNmFiOWE2MDIiLCJ0b2tlbl91c2UiOiJpZCIsImF1dGhfdGltZSI6MTc3MjQzODczMCwiZXhwIjoxNzcyNDQyMzMwLCJpYXQiOjE3NzI0Mzg3MzAsImp0aSI6IjE3NjFmMDc1LTRjZGItNDIyMC04ZGQ3LWNkOWIzNGZjYjYwNSIsImVtYWlsIjoidXNlckBzd2l2ZWwuY29tLmF1In0.T6ViLzl3jBEASEUAOB49Y6CirQbYugl8APprbWJpTgqsCEUpkiUgTY5yblK1UZR6c-JULJlT8WY5bAPXwVsumwnuyRx4uslRb0F31RMT8E-i19htYoge_WGJ7raXe3fo9DMgKdRP8sU79XpPaCLnXG4kq8K5kAG_CMWI-_JYj0XPXawnoQxJMWaHxqInm0FZCjYoEHDfDrp6jcc9KFOswdV6g-uWCzWOEZSf6PBs11R_vw0AmhTTaJ8bh5BvV4_kKHEqEBqxcx1trRvUBgB5EW-NUxGBuniO5hejjpXthkU73HdywVktRrGcZeOFBupsjFBSPt9WJxrf4v-A4x0WIg' \
  --header 'Content-Type: application/json' \
  --data '{
    "title": "50% Off",
    "price": 150
  }'
```

If the token is valid and the payload passes validation, the API returns a `201 Created` response with the created ad (including optional image info if provided).

### Request Body

```json
{
  "title": "string",
  "price": 123.45,
  "imageBase64": "data:image/jpeg;base64,..." // optional
}
```

Validation is implemented with Zod (`createAdSchema`) and enforced in the handler via the `validate` utility.

---

## Local Development Notes

### Running unit tests (no AWS required)

Unit tests mock AWS SDK clients (S3, SNS, DynamoDB) and Cognito context, so you can run them without any AWS account:

```bash
npm test
npm run test:coverage
```

Tests cover:

- Handler (`createAd`) success and major error paths (unauthorized, validation failure)
- Service layer (`createAd` → DynamoDB + S3 + SNS + mapping)
- S3 image upload (format, type, size checks, presigned URL)
- DynamoDB repository behavior
- SNS publisher
- Validation utilities, error types, response helpers, and handler wrapper

### `sam local` (optional)

If you have Docker installed, you can emulate the API locally:

```bash
sam build
sam local start-api
```

By default SAM does not automatically emulate Cognito authorizers; for local-only testing you can:

- Use `sam local invoke` with a custom event file that includes `requestContext.authorizer.claims.sub`, or
- Temporarily disable the authorizer in a local-only template variant (not recommended for production templates).

For this project, end-to-end auth is demonstrated against a real deployed stack using the Cognito flows above, and local behavior is primarily verified via unit tests.

---

## CI/CD (GitHub Actions)

The workflow in `.github/workflows/ci.yml` performs:

1. **Build & Test** (`build-and-test` job)
   - Checkout repository
   - Setup Node.js 24
   - `npm ci`
   - `npm run test:coverage`
   - SonarCloud scan (using `SONAR_TOKEN` secret, publishing `coverage/lcov.info`)
   - `npm run build`

2. **Deploy** (`deploy` job, optional)
   - Runs only when `github.ref == 'refs/heads/master'`
   - Checkout repo
   - Setup Node.js 20
   - `npm ci`
   - Install `esbuild` globally
   - Configure AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` secrets)
   - `sam build`
   - `sam deploy` with:
     - `--stack-name ads-api`
     - `--capabilities CAPABILITY_IAM`
     - `--no-confirm-changeset`
     - `--no-fail-on-empty-changeset`
     - `--resolve-s3`

Make sure the following GitHub repository secrets are configured for deploy to work:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `SONAR_TOKEN`

---

## Known Limitations

- Only a single `POST /api/v1/ads` endpoint is implemented (no listing/updating/deleting ads).
- Image upload currently supports only types configured via `ALLOWED_IMAGE_TYPES` (by default `image/jpeg,image/png`).
- Authentication and Cognito integration are designed for the assessment scenario; user management flows (sign-up, confirmation, password reset) are not included.

---

## Cleanup

To delete the deployed stack and all associated resources:

```bash
sam delete --stack-name ads-api
```

Confirm the deletion when prompted in the terminal.

