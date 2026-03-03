# AWS Serverless Ads API

A minimal serverless Ads API built with **Node.js + TypeScript** using AWS services.

### Table of Contents

- [Architecture Diagram](#architecture-diagram)
- [Architecture](#architecture)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Authentication (Cognito)](#authentication-cognito)
- [API Endpoint](#api-endpoint)
- [Image Upload](#image-upload)
- [Setup Instructions](#setup-instructions)
- [Deploy with AWS SAM](#deploy-with-aws-sam)
- [Run Tests](#run-tests)
- [Code Quality](#code-quality)
- [CI/CD](#cicd)
- [Postman Collection](#postman-collection)
- [Deployed API](#deployed-api)
- [Known Limitations](#known-limitations)

##  Architecture Diagram

![Architecture Diagram](./postman/diagram.png)

### Code-Level Request Flow

![Request Flow Diagram](./assets/request-flow.png)

Authenticated users can create ads. When an ad is created:

- The record is stored in DynamoDB
- An optional image is uploaded to S3 (base64 → S3)
- An SNS notification is published
- Structured logs include requestIds
- Unit tests are implemented with Jest
- CI/CD pipeline via GitHub Actions
- Code quality analysis with SonarCloud
- Infrastructure as Code using AWS SAM

---

## Architecture

API Gateway  
→ Lambda (Node.js + TypeScript)  
→ DynamoDB (AdsTable)  
→ S3 (image storage)  
→ SNS (Ad created event)  
→ Cognito (Authentication)

---

## Technologies Used

- Node.js 24
- TypeScript
- AWS Lambda
- API Gateway
- DynamoDB
- S3
- SNS
- Cognito User Pool
- AWS SAM (IaC)
- Jest (Unit testing)
- SonarCloud (Code Quality)
- GitHub Actions (CI/CD)

---

## Project Structure

```text
src/
├── handlers/       # Lambda entry points
├── services/       # Business logic
├── repositories/   # DynamoDB access layer
├── storage/        # S3 image upload logic
├── events/         # SNS publisher
├── domain/         # Types & mappers
├── utils/          # Shared utilities (errors, logging, validation)
└── models/         # Zod schemas

template.yaml       # AWS SAM infrastructure definition
```

## Authentication (Cognito)

The API is protected using **AWS Cognito User Pool Authorizer**.

### Obtain an ID Token

Use the following command to authenticate and retrieve an `IdToken`:

```bash
curl --location 'https://cognito-idp.<region>.amazonaws.com/' \
--header 'Content-Type: application/x-amz-json-1.1' \
--header 'X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth' \
--data-raw '{
  "AuthFlow": "USER_PASSWORD_AUTH",
  "ClientId": "<USER_POOL_CLIENT_ID>",
  "AuthParameters": {
    "USERNAME": "user",
    "PASSWORD": "Password123!"
  }
}'
```

Use the returned **IdToken** in your request header:

```text
Authorization: Bearer <ID_TOKEN>
```

---

## API Endpoint

### `POST /api/v1/ads`

### Request Body

```json
{
  "title": "Test Ad",
  "price": 100,
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSk..."
}
```

### Success Response

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "title": "Test Ad",
    "price": 100,
    "userId": "user-123",
    "createdAt": "2026-03-02T09:00:00Z",
    "image": {
      "key": "ads/uuid.jpg",
      "presignedUrl": "...",
      "expiresIn": 3600
    }
  },
  "requestId": "req-123"
}
```

---

## Image Upload

The API supports optional base64 image uploads.

### Supported Formats

```text
data:image/jpeg;base64,...
data:image/png;base64,...
```

### Configuration

Allowed MIME types are configured using environment variable:

```bash
ALLOWED_IMAGE_TYPES=image/jpeg,image/png
```

Maximum allowed image size:

```bash
IMAGE_MAX_SIZE=5242880
```

---

##  Setup Instructions

### 1️ Clone Repository

```bash
git clone <repo-url>
cd ads-api
```

### 2️ Install Dependencies

```bash
npm install
```

### 3️ Build Project

```bash
npm run build
```

---

##  Deploy with AWS SAM

### Build

```bash
sam build
```

### Deploy

```bash
sam deploy --guided
```

Or deploy automatically using the CI/CD pipeline.

---

##  Run Tests

Run tests with coverage:

```bash
npm run test:coverage
```

Coverage report will be generated at:

```text
coverage/lcov-report/index.html
```

---

##  Code Quality

This project integrates with **SonarCloud** for:

- Code Quality Analysis
- Code Coverage Reporting
- Quality Gate Enforcement
- Security & Maintainability Checks

🔗 SonarCloud Project:

https://sonarcloud.io/project/overview?id=leel-swivel_aws-serverless-ads-api


##  CI/CD

GitHub Actions workflow performs:

- Install dependencies
- Run tests with coverage
- Run SonarCloud analysis
- Deploy using AWS SAM (master branch)

---

## Postman Collection

A ready-to-use Postman setup is available:

### 🔹 Collection
[Download Collection](./postman/Ads%20API.postman_collection.json)

### 🔹 Environment
[Download Environment](./postman/Ads-Api.postman_environment.json)

### How to Use

1. Import the Collection file into Postman
2. Import the Environment file into Postman
3. Select the imported Environment (top-right dropdown)
4. Click **Login** (this automatically saves the IdToken)
5. Click **Create Ads**


Authentication is handled automatically via environment variable `ID_TOKEN`.

---

## Deployed API

Base URL:

https://mgcaffgwhb.execute-api.ap-southeast-1.amazonaws.com/dev

### Available Endpoint

<b>POST</b> /api/v1/ads

##  Known Limitations

- Only POST endpoint implemented
- No sign-up API implemented (users must exist in Cognito manually)
- No login endpoint implemented within this service
- No update/delete endpoints
- Basic validation implemented
- Single DynamoDB table design
- No rate limiting configured
- No caching layer implemented
- No dead-letter queue (DLQ) configured for SNS failures
- No retry mechanism for external service failures