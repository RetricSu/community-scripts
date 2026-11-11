# CKB SDK Validation Tool

A comprehensive tool for actively testing CKB SDKs against deployment configurations. This tool discovers SDKs on npm, installs them dynamically, and validates their script information against known-good deployment data.

## Features

- 🔍 **Dynamic SDK Discovery** - Automatically finds CKB SDK packages on npm
- 🧪 **Runtime Testing** - Installs and tests SDKs at runtime
- 📊 **Comprehensive Validation** - Tests against all known script deployments
- 📈 **Detailed Reporting** - Generates detailed test reports and summaries
- 🤖 **CI/CD Ready** - GitHub Actions integration for daily testing
- 🔄 **Automated Workflow** - Runs daily to catch SDK issues early

## Installation

```bash
npm install
npm run build
```

## Usage

### Command Line Interface

```bash
# Discover available SDKs
npm start discover

# Test a specific SDK
npm start test ckb-sdk-js

# Run full daily validation
npm start daily

# Show help
npm start help
```

### Programmatic Usage

```typescript
import { DailyTestRunner } from './src/ci/daily-test-runner';
import { NPMSDKDiscoverer } from './src/discovery/npm-sdk-discoverer';
import { DynamicSDKTester } from './src/testing/dynamic-sdk-tester';

// Run daily tests
const runner = new DailyTestRunner();
await runner.runDailyTests();

// Discover SDKs
const discoverer = new NPMSDKDiscoverer();
const sdkNames = await discoverer.discoverSDKs();

// Test specific SDKs
const tester = new DynamicSDKTester();
const reports = await tester.testAllSDKs(['ckb-sdk-js', 'another-sdk']);
```

## Security monitoring

The repository also implements the CKB core-contract anti-tampering and upgrade
monitor described in [`docs/SECURITY_MONITORING_PLAN.md`](docs/SECURITY_MONITORING_PLAN.md).
See [`docs/SECURITY_MONITORING.md`](docs/SECURITY_MONITORING.md) for the full
configuration and alert-channel reference.

```bash
pnpm run build
# One pass over mainnet + testnet, all sources
pnpm run monitor -- --no-notify
# Trace upgrades and apply only whitelisted changes to the working tree
pnpm run monitor:upgrade -- --network mainnet --apply --no-notify
# Offline unit tests
pnpm test
```

The monitor cross-checks canonical `src/deployments/*.json` records against
live CKB RPC cells, docs.nervos.org, Nervos RFCs, CKB Explorer and CCC. It
reports P0/P1/P2/P3 findings, traces Type ID upgrades through the CKB indexer,
and can send Telegram, Feishu, Discord, generic webhook and deduplicated
GitHub Issue alerts.


### 1. SDK Discovery
The tool searches npm for packages matching patterns like:
- `ckb-sdk`
- `nervos-sdk`
- `ckb-js`
- `ckb`

### 2. Dynamic Installation
For each discovered SDK:
- Installs the latest version: `npm install sdk-name@latest`
- Loads the SDK module dynamically
- Attempts to extract script information

### 3. Script Information Extraction
The tool tries multiple patterns to extract script info:
```typescript
// Pattern 1
sdk.getScriptInfo(scriptName, network)

// Pattern 2
sdk.scripts.get(scriptName, network)

// Pattern 3
sdk.getScript(scriptName, network)

// Pattern 4
sdk.scriptInfo(scriptName, network)

// Pattern 5
sdk.Scripts.get(scriptName, network)
```

### 4. Validation
Compares SDK-provided script info against deployment configurations:
- **codeHash** - Script hash validation
- **hashType** - Hash type validation
- **cellDeps** - Cell dependencies validation

### 5. Reporting
Generates comprehensive reports:
- Individual SDK test results
- Overall validation summary
- Detailed error reporting
- Success/failure statistics

## Output

### Console Output
```
🚀 Starting daily SDK validation...
==================================================
🔍 Discovering CKB SDK packages on npm...
Found 5 packages matching "ckb-sdk"
📦 Total unique SDK packages found: 8

🧪 Testing 8 SDK packages...

📦 Testing SDK: ckb-sdk-js
  📥 Installing ckb-sdk-js@latest...
  🔧 Loading SDK module...
  🧪 Testing against 25 known scripts...
✅ ckb-sdk-js: 48/50 tests passed

📊 Validation Summary
==================================================
Total SDKs tested: 8
Successful: 6
Failed: 2
Success rate: 75.0%
Total tests: 400
Passed tests: 380
Failed tests: 20
Duration: 45.2s
```

### File Output
Results are saved to the `results/` directory:
- `validation-results-2024-01-15T10-30-00-000Z.json` - Detailed results
- `validation-summary-2024-01-15T10-30-00-000Z.json` - Summary
- `latest-results.json` - Latest detailed results
- `latest-summary.json` - Latest summary

## GitHub Actions Integration

The tool includes a GitHub Actions workflow that runs daily:

```yaml
name: Daily SDK Validation
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Manual trigger
```

### Workflow Features
- **Scheduled Execution** - Runs daily at 2 AM UTC
- **Manual Trigger** - Can be triggered manually
- **PR Integration** - Comments on PRs with validation results
- **Artifact Upload** - Saves results as GitHub artifacts
- **Caching** - Uses npm cache for faster builds

## Configuration

### Environment Variables
- `PORT` - API server port (default: 3000)
- `RESULTS_DIR` - Results directory (default: ./results)

### Customization
You can customize the tool by modifying:
- **Search Patterns** - Add more npm search patterns
- **Test Scripts** - Add more script names to test
- **Validation Rules** - Add custom validation logic
- **Notification** - Add custom notification handlers

## Architecture

```
src/
├── discovery/
│   └── npm-sdk-discoverer.ts    # NPM package discovery
├── testing/
│   └── dynamic-sdk-tester.ts    # SDK testing logic
├── validate/
│   └── ccc.ts                   # Validation engine
├── ci/
│   └── daily-test-runner.ts     # CI/CD orchestration
└── index.ts                     # CLI interface
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License

## Support

For issues and questions:
1. Check the existing issues
2. Create a new issue with detailed information
3. Include SDK names and error messages
