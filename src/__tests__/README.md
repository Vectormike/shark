# Testing Guide

This directory contains all the tests for the Loan Shark App.

## Test Structure

```
src/__tests__/
├── controllers/          # Controller unit tests
├── services/            # Service layer unit tests
├── integration/         # Integration tests
├── setup.ts            # Test setup and configuration
└── README.md           # This file
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test webhookController.test.ts

# Run tests matching a pattern
pnpm test --testNamePattern="Webhook"
```

## Test Types

### Unit Tests
- **Controllers**: Test HTTP request/response handling
- **Services**: Test business logic and data processing
- **Repositories**: Test data access layer (if needed)

### Integration Tests
- **API Endpoints**: Test complete request flows
- **Database Operations**: Test with real database (test DB)
- **External Services**: Test webhook integrations

## Test Configuration

- **Framework**: Jest with TypeScript support
- **Environment**: Node.js test environment
- **Coverage**: HTML, LCOV, and text reports
- **Timeout**: 10 seconds per test

## Mocking Strategy

- **External APIs**: All external services are mocked
- **Database**: Use test database or in-memory alternatives
- **File System**: Mock file operations
- **Time**: Mock Date.now() for consistent test results

## Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **Single Responsibility**: One assertion per test
3. **Descriptive Names**: Test names should describe the behavior
4. **Mock External Dependencies**: Keep tests isolated and fast
5. **Clean Up**: Reset mocks and state between tests

## Webhook Testing

Webhook tests include:
- Signature verification
- Event handling
- Error scenarios
- Integration with payment gateways

## Environment Variables

Create a `.env.test` file for test-specific configuration:

```env
NODE_ENV=test
DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/loan_shark_test_db
REDIS_URL=redis://localhost:6379/1
PAYSTACK_SECRET_KEY=sk_test_test_key
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST_test_key
```
