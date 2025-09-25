# Contract Tests

This directory contains contract tests for API endpoints. Contract tests verify that API endpoints behave correctly at the interface level, testing the contract between the client and server.

## Files

### metrics.test.ts

Comprehensive contract tests for the `GET /api/admin/dashboard/metrics` endpoint.

**Test Coverage:**
- ✅ Authentication and authorization (401 responses for missing/invalid tokens)
- ✅ Successful metrics retrieval with valid session
- ✅ Date range filtering (startDate, endDate parameters)
- ✅ Default date range behavior (last 30 days)
- ✅ Response structure validation (TypeScript interface compliance)
- ✅ Error handling (500 responses for database failures)
- ✅ Edge cases (malformed dates, empty parameters)
- ✅ TDD approach documentation

**Technologies Used:**
- Jest for test framework
- TypeScript for type safety
- Mocked dependencies (Supabase, Next.js cookies, analytics functions)
- Direct API route handler testing (bypassing HTTP layer for better performance)

**Key Features:**
- Follows TDD (Test-Driven Development) principles
- Tests fail initially until proper implementation is complete
- Comprehensive mocking strategy for external dependencies
- Validates both successful and error scenarios
- Tests business logic constraints (e.g., active users ≤ total users)

## Running Tests

```bash
# Run all contract tests
npm test tests/contract/

# Run specific test file
npm test tests/contract/metrics.test.ts

# Run with verbose output
npm test tests/contract/metrics.test.ts -- --verbose
```

## Test Structure

Each contract test follows this pattern:

1. **Arrange** - Set up mocks and test data
2. **Act** - Call the API endpoint
3. **Assert** - Verify response structure, status codes, and data

## Mocking Strategy

- **Supabase Client**: Mocked to prevent actual database calls
- **Next.js Cookies**: Mocked to control authentication state
- **Analytics Functions**: Mocked to return predictable test data
- **Web APIs**: Response.json and other browser APIs mocked for Node.js compatibility