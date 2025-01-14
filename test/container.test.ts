/* eslint-disable @typescript-eslint/naming-convention */
import { Env, Stage } from '@krauters/structures'

import type { ConfigOptions, LoggerOptions } from '../src/structures'

import { container, getLogger } from '../src/container'
import { Logger } from '../src/logger'
import { LogLevel } from '../src/structures'

// Mock the Logger class
jest.mock('../src/logger')

// eslint-disable-next-line max-lines-per-function
describe('Logger Container', () => {
	let mockLoggerInstance: Partial<Logger>

	beforeEach(() => {
		// Clear the container and all mocks before each test
		container.clear()
		jest.clearAllMocks()

		// Create a mock Logger instance with necessary methods
		mockLoggerInstance = {
			debug: jest.fn(),
			info: jest.fn(),

			// Add other methods if they are used in container.ts
		}

		// Mock the Logger constructor to return the mock instance
		;(Logger as jest.Mock).mockImplementation(() => mockLoggerInstance)
	})

	it('initializes a new logger and stores it in the container', () => {
		const loggerName = 'testLogger'
		const loggerOptions: LoggerOptions = {
			configOptions: {
				CODENAME: 'test-codename',
				ENV: Env.Development,
				HOST: 'localhost',
				LOG_FORMAT: 'friendly',
				LOG_FRIENDLY_FIELDS_HIDE: ['password'],
				LOG_LEVEL: LogLevel.Info,
				LOG_PREFIX: '[test] ',
				LOG_SECTION_SEPARATOR: ' | ',
				LOG_STRUCTURED_FIELDS_HIDE: [],
				PACKAGE: 'test-package',
				SIMPLE_LOGS: false,
				STAGE: Stage.Beta,
				TIMESTAMP_FORMAT: 'YYYY-MM-DD HH:mm:ssZ',
				VERSION: '1.0.0',
			},
			transports: [],
		}

		const logger = getLogger(loggerName, loggerOptions)

		// Verify that Logger was instantiated with the correct options
		expect(Logger).toHaveBeenCalledWith(loggerOptions)

		// Verify that the logger is stored in the container
		expect(container.has(loggerName)).toBe(true)
		expect(container.get(loggerName)).toBe(logger)

		// Verify that the debug method was called with the initialization message
		expect(mockLoggerInstance.debug).toHaveBeenCalledWith(`Logger [${loggerName}] has been initialized.`, {
			options: loggerOptions,
		})
	})

	it('throws an error when initializing a logger with an existing name', () => {
		const loggerName = 'duplicateLogger'
		const loggerOptions: LoggerOptions = {
			configOptions: { ...baseConfig },
			transports: [],
		}

		// Initialize the first logger
		getLogger(loggerName, loggerOptions)

		// Attempt to initialize a second logger with the same name
		expect(() => getLogger(loggerName, loggerOptions)).toThrowError(
			`Logger [${loggerName}] has already been initialized.`,
		)

		// Verify that Logger was only instantiated once
		expect(Logger).toHaveBeenCalledTimes(1)
	})

	it('stores multiple loggers with different names', () => {
		const loggerName1 = 'loggerOne'
		const loggerName2 = 'loggerTwo'
		const loggerOptions1: LoggerOptions = {
			configOptions: { ...baseConfig, LOG_LEVEL: LogLevel.Debug },
			transports: [],
		}
		const loggerOptions2: LoggerOptions = {
			configOptions: { ...baseConfig, LOG_LEVEL: LogLevel.Error },
			transports: [],
		}

		const logger1 = getLogger(loggerName1, loggerOptions1)
		const logger2 = getLogger(loggerName2, loggerOptions2)

		// Verify that both loggers are stored in the container
		expect(container.has(loggerName1)).toBe(true)
		expect(container.has(loggerName2)).toBe(true)
		expect(container.get(loggerName1)).toBe(logger1)
		expect(container.get(loggerName2)).toBe(logger2)

		// Verify that Logger was instantiated twice with correct options
		expect(Logger).toHaveBeenCalledWith(loggerOptions1)
		expect(Logger).toHaveBeenCalledWith(loggerOptions2)
	})

	it('does not allow modifying the container from outside', () => {
		// Attempt to set a logger directly in the container
		const fakeLogger = { debug: jest.fn() } as unknown as Logger
		container.set('externalLogger', fakeLogger)

		// Retrieve the logger using getLogger
		const loggerName = 'externalLogger'
		const loggerOptions: LoggerOptions = {
			configOptions: { ...baseConfig },
			transports: [],
		}

		// Attempting to initialize a logger with an existing name should throw an error
		expect(() => getLogger(loggerName, loggerOptions)).toThrowError(
			`Logger [${loggerName}] has already been initialized.`,
		)
	})

	it('handles loggerOptions being undefined', () => {
		const loggerName = 'defaultLogger'

		const logger = getLogger(loggerName)

		// Verify that Logger was instantiated with undefined options
		expect(Logger).toHaveBeenCalledWith(undefined)

		// Verify that the logger is stored in the container
		expect(container.has(loggerName)).toBe(true)
		expect(container.get(loggerName)).toBe(logger)

		// Verify that the debug method was called with the initialization message
		expect(mockLoggerInstance.debug).toHaveBeenCalledWith(`Logger [${loggerName}] has been initialized.`, {
			options: undefined,
		})
	})
})

// Define a baseConfig to use in tests
const baseConfig: ConfigOptions = {
	CODENAME: 'test-codename',
	ENV: Env.Development,
	HOST: 'test-host',
	LOG_FORMAT: 'friendly',
	LOG_FRIENDLY_FIELDS_HIDE: ['password'],
	LOG_LEVEL: LogLevel.Info,
	LOG_PREFIX: '[test] ',
	LOG_SECTION_SEPARATOR: ' | ',
	LOG_STRUCTURED_FIELDS_HIDE: [] as string[],
	PACKAGE: 'test-package',
	SIMPLE_LOGS: false,
	STAGE: Stage.Beta,
	TIMESTAMP_FORMAT: 'YYYY-MM-DD HH:mm:ssZ',
	VERSION: '1.0.0',
}
