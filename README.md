<div align="center">

![Code Size](https://img.shields.io/github/languages/code-size/krauters/logger)
![Commits per Month](https://img.shields.io/github/commit-activity/m/krauters/logger)
![Contributors](https://img.shields.io/github/contributors/krauters/logger)
![Forks](https://img.shields.io/github/forks/krauters/logger)
![GitHub Stars](https://img.shields.io/github/stars/krauters/logger)
![Install Size](https://img.shields.io/npm/npm/dw/@krauters%2Flogger)
![GitHub Issues](https://img.shields.io/github/issues/krauters/logger)
![Last Commit](https://img.shields.io/github/last-commit/krauters/logger)
![License](https://img.shields.io/github/license/krauters/logger)
<a href="https://www.linkedin.com/in/coltenkrauter" target="_blank"><img src="https://img.shields.io/badge/LinkedIn-%230077B5.svg?&style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"></a>
[![npm version](https://img.shields.io/npm/v/@krauters%2Flogger.svg?style=flat-square)](https://www.npmjs.org/package/@krauters/logger)
![Open PRs](https://img.shields.io/github/issues-pr/krauters/logger)
![Repo Size](https://img.shields.io/github/repo-size/krauters/logger)
![Version](https://img.shields.io/github/v/release/krauters/logger)
![visitors](https://visitor-badge.laobi.icu/badge?page_id=krauters/logger)

</div>

# @krauters/logger

A TypeScript logging utility optimized for structured logging in AWS Lambda environments. It provides a customizable, structured logger with flexible output options, including support for local development-friendly colorized output.

---
## Features

- **Structured JSON Logging**: Ideal for Lambda and other cloud environments.
- **Colorized Output**: Configurable colorized output for easy local debugging.
- **Metric Publishing**: Integrates with CloudWatch for metric tracking.
- **Customizable Formats**: Switch between JSON and human-readable formats.
- **Singleton Pattern**: Ensures consistent configuration across the application.
- **Environment-Based Configurations**: Configure log formats, levels, and transports using environment variables.
- **Persistent Metadata**: Easily add or remove metadata fields from all subsequent logs via `addToAllLogs` and `removeFromAllLogs`.

## Installation

Install the package via npm:

```sh
npm install @krauters/logger
```

or with Yarn:

```sh
yarn add @krauters/logger
```

## Usage

```typescript
import { Logger, LogLevel } from '@krauters/logger'

// initialize the logger with options
const logger = Logger.getInstance({
    configOptions: { LOG_LEVEL: LogLevel.Debug },
})

// add persistent metadata
logger.addToAllLogs('userId', 'abc123')
logger.addToAllLogs('sessionId', 'xyz789')

// log messages at various levels
logger.info('info level log')
logger.debug('debug level log with metadata', { key: 'value' })
logger.error('an error occurred', { errorDetails: 'error details here' })

// remove metadata keys (single or multiple)
logger.removeFromAllLogs('userId', 'sessionId')

// publish metrics to cloudwatch
await logger.publishMetric({
    metricName: 'requestCount',
    unit: 'Count',
    value: 1,
})
```

## Configuration

The logger supports multiple configuration options to control logging format, levels, and transports. Some commonly used environment variables include:

- `LOG_LEVEL`: Set the log level (`debug`, `info`, `warn`, `error`).
- `LOG_FORMAT`: Choose between `structured` for json logging and `friendly` for colorized console output. (default: friendly)
- `REQUEST_ID`: Optionally set a request ID for tracing log entries.
- `SIMPLE_LOGS`: Optionally make log entries simpler (omit codename, version, use shorter requestId–useful for local development).

### DotEnv

This package supports [.env](https://www.npmjs.com/package/dotenv) configuration.

## Husky Integration

Husky helps manage Git hooks easily, automating tasks like running tests or linting before a commit. This ensures your code is in good shape before it’s pushed.

Pre-commit hooks in this project run scripts before a commit is finalized to catch issues or enforce standards. With Husky, setting up these hooks across your team becomes easy, keeping your codebase clean and consistent.

### Our Custom Pre-Commit Hook

This project uses a custom pre-commit hook to run `npm run bundle`. This ensures that our bundled assets are always up-to-date before any commit (particularly valuable for TypeScript-based GitHub Actions). Husky automates this to prevent commits without a fresh bundle, keeping everything streamlined.

### Using Logger as Pre-Commit Hooks

```sh
# ./husky/pre-commit
#!/bin/sh

MAIN_DIR=./node_modules/@krauters/logger/scripts/pre-commit
. $MAIN_DIR/index.sh
```

## Contributing

This project aims to continually evolve and improve its core features, making it more efficient and easier to use. Development happens openly here on GitHub, and we’re thankful to the community for contributing bug fixes, enhancements, and fresh ideas. Whether you're fixing a small bug or suggesting a major improvement, your input is invaluable.

## License

This project is licensed under the ISC License. Please see the [LICENSE](./LICENSE) file for more details.

## 🥂 Thanks, Contributors!

Thanks for your time and contributions.

<a href="https://github.com/krauters/logger/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=krauters/logger" />
</a>

## 🔗 Related Packages in the Family
Check out the rest of our `@krauters` collection on [npm/@krauters](https://www.npmjs.com/search?q=%40krauters) for more TypeScript utilities.

---
