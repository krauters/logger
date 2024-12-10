/* eslint-disable @typescript-eslint/naming-convention */

import type { CloudWatchClient } from '@aws-sdk/client-cloudwatch'

import { PutMetricDataCommand } from '@aws-sdk/client-cloudwatch'
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { Env } from '@krauters/structures'
import stream from 'stream'
import winston from 'winston'

import { initializeLogger, Logger, LogLevel, MetricUnit } from '../src/index'

jest.mock('@aws-sdk/client-cloudwatch')

// Function to strip ANSI color codes
// eslint-disable-next-line no-control-regex
const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, '')

// eslint-disable-next-line max-lines-per-function
describe('Logger', () => {
	let logger: Logger
	let cloudWatchClientMock: jest.Mock
	let output: string[]

	beforeEach(() => {
		// Reset the singleton instance
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		Logger.instance = undefined as any

		logger = initializeLogger({
			configOptions: {
				CODENAME: 'TEST',
				DRY_RUN: false,
				ENV: Env.Development,
				HOST: 'localhost',
				LOG_FORMAT: 'friendly',
				LOG_LEVEL: LogLevel.Debug,
				LOG_SECTION_SEPARATOR: ' | ',
				PACKAGE: 'logger-package',
				STAGE: Env.Beta,
				TIMESTAMP_FORMAT: 'YYYY-MM-DD HH:mm:ssZ',
				VERSION: '1.0.0',
			},
		})

		// Remove only test-specific metadata
		logger.removeFromAllLogs('userId', 'sessionId')

		cloudWatchClientMock = jest.fn().mockResolvedValue({} as never)
		logger.cloudwatch = { send: cloudWatchClientMock } as unknown as CloudWatchClient

		output = []
		const logStream = new stream.Writable({
			write(chunk, _, callback) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				output.push(chunk.toString())
				callback()
			},
		})

		logger.logger.clear()
		logger.logger.add(
			new winston.transports.Stream({
				level: 'debug',
				stream: logStream,
			}),
		)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('should be a singleton', () => {
		const anotherLogger = Logger.getInstance()
		expect(logger).toBe(anotherLogger)
	})

	it('should log a message at debug level', (done) => {
		logger.debug('Debug message', { key: 'value' })
		setImmediate(() => {
			expect(output).toEqual(expect.arrayContaining([expect.stringContaining('Debug message')]))
			done()
		})
	})

	it('should format messages with timestamp, level, and message', () => {
		const formatLogMessageSpy = jest.spyOn(logger, 'formatLogMessage')
		logger.info('Info message', { exampleKey: 'exampleValue' })
		expect(formatLogMessageSpy).toHaveBeenCalled()
		formatLogMessageSpy.mockRestore()
	})

	it('should verify timestamp format without color codes', () => {
		const info = {
			level: 'info',
			message: 'This is a test',
			timestamp: '2023-09-30 12:34:56',
		}
		const separator = ' | '
		const formattedMessage = logger.formatLogMessage(info, separator)
		expect(formattedMessage).toContain('2023-09-30 12:34:56')
	})

	it('should publish a metric to CloudWatch', async () => {
		await logger.publishMetric({
			metricName: 'TestMetric',
			unit: MetricUnit.Count,
			value: 1,
		})

		expect(cloudWatchClientMock).toHaveBeenCalledWith(expect.any(PutMetricDataCommand))
	})

	it('should throw error if invalid LOG_FORMAT is provided', () => {
		expect(() => {
			new Logger({ configOptions: { LOG_FORMAT: 'invalidFormat' } })
		}).toThrowError(/Invalid LOG_FORMAT/)
	})

	it('should initialize logger with default config when INIT_LOGGER is set to true', () => {
		process.env.INIT_LOGGER = 'true'
		const autoInitializedLogger = Logger.getInstance()
		expect(autoInitializedLogger).toBeDefined()
	})

	it('should verify logger is not auto-initialized if INIT_LOGGER is set to false', () => {
		process.env.INIT_LOGGER = 'false'
		const freshLogger = new Logger({ configOptions: { LOG_LEVEL: LogLevel.Info } })
		expect(freshLogger).toBeDefined()
	})

	it('should add metadata to all subsequent logs', () => {
		const logSpy = jest.spyOn(logger.logger, 'log')
		logger.addToAllLogs('userId', 'user-123')
		logger.info('Message with user')

		expect(logSpy).toHaveBeenCalledWith('info', 'Message with user', {
			codename: 'TEST',
			dryRun: false,
			env: Env.Development,
			host: 'localhost',
			package: 'logger-package',
			requestId: logger.metadata.requestId,
			stage: Env.Beta,
			userId: 'user-123',
			version: '1.0.0',
		})

		expect(output[0]).toContain('userId: user-123')
	})

	it('should remove a single metadata key from all subsequent logs', () => {
		const logSpy = jest.spyOn(logger.logger, 'log')
		logger.addToAllLogs('userId', 'user-123')
		logger.removeFromAllLogs('userId')

		expect(logger.metadata).not.toHaveProperty('userId')

		logger.info('Message without user')

		expect(logSpy).toHaveBeenCalledWith('info', 'Message without user', {
			codename: 'TEST',
			dryRun: false,
			env: Env.Development,
			host: 'localhost',
			package: 'logger-package',
			requestId: logger.metadata.requestId,
			stage: Env.Beta,
			version: '1.0.0',
		})

		expect(output[0]).not.toContain('userId: user-123')
	})

	it('should remove multiple metadata keys when passed separately', () => {
		const logSpy = jest.spyOn(logger.logger, 'log')
		logger.addToAllLogs('userId', 'user-123')
		logger.addToAllLogs('sessionId', 'session-abc')
		logger.removeFromAllLogs('userId', 'sessionId')
		logger.info('Message without user and session')

		expect(logSpy).toHaveBeenCalledWith('info', 'Message without user and session', {
			codename: 'TEST',
			dryRun: false,
			env: Env.Development,
			host: 'localhost',
			package: 'logger-package',
			requestId: logger.metadata.requestId,
			stage: Env.Beta,
			version: '1.0.0',
		})

		expect(output[0]).not.toContain('userId: user-123')
		expect(output[0]).not.toContain('sessionId: session-abc')
	})

	it('should remove multiple metadata keys when passed as an array', () => {
		const logSpy = jest.spyOn(logger.logger, 'log')
		logger.addToAllLogs('userId', 'user-123')
		logger.addToAllLogs('sessionId', 'session-abc')
		logger.addToAllLogs('codename', 'coden-xyz')
		logger.removeFromAllLogs(['userId', 'sessionId', 'codename'])
		logger.info('Message without user, session and codename')

		expect(logSpy).toHaveBeenCalledWith('info', 'Message without user, session and codename', {
			dryRun: false,
			env: Env.Development,
			host: 'localhost',
			package: 'logger-package',
			requestId: logger.metadata.requestId,
			stage: Env.Beta,
			version: '1.0.0',
		})

		expect(output[0]).not.toContain('userId: user-123')
		expect(output[0]).not.toContain('sessionId: session-abc')
		expect(output[0]).not.toContain('codename: coden-xyz')
	})

	it('should format friendly logs correctly', () => {
		logger.addToAllLogs('userId', 'user-123')
		logger.info('Friendly log message')

		const logLine = stripAnsi(output[0])
		const separator = ' | '
		const parts = logLine.split(separator).map((part) => part.trim())

		expect(parts.length).toBeGreaterThanOrEqual(4)
		const timestampRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}[-+]\d{2}:\d{2}$/
		expect(parts[0]).toMatch(timestampRegex)
		expect(parts[1].toLowerCase()).toBe('info')
		expect(parts[2]).toBe('Friendly log message')
		expect(parts).toEqual(
			expect.arrayContaining([
				expect.stringContaining('userId: user-123'),
				expect.stringContaining('codename: TEST'),
				expect.stringContaining('dryRun: false'),
				expect.stringContaining('host: localhost'),
				expect.stringContaining(`requestId: ${logger.metadata.requestId}`),
				expect.stringContaining('stage: Beta'),
				expect.stringContaining('version: 1.0.0'),
			]),
		)
	})

	it('should format structured logs correctly', () => {
		logger = initializeLogger({
			configOptions: {
				CODENAME: 'TEST',
				DRY_RUN: false,
				ENV: Env.Development,
				HOST: 'localhost',
				LOG_FORMAT: 'structured',
				LOG_LEVEL: LogLevel.Debug,
				LOG_SECTION_SEPARATOR: ' | ',
				PACKAGE: 'logger-package',
				STAGE: Env.Beta,
				TIMESTAMP_FORMAT: 'YYYY-MM-DD HH:mm:ssZ',
				VERSION: '1.0.0',
			},
		})

		logger.removeFromAllLogs('userId', 'sessionId')

		output = []
		const logStream = new stream.Writable({
			write(chunk, _, callback) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				output.push(chunk.toString())
				callback()
			},
		})

		logger.logger.clear()
		logger.logger.add(
			new winston.transports.Stream({
				level: 'debug',
				stream: logStream,
			}),
		)

		logger.addToAllLogs('userId', 'user-123')
		logger.info('Structured log message')

		const logLine = output[0]
		let logObject: Record<string, unknown>

		try {
			logObject = JSON.parse(logLine)
		} catch {
			throw new Error(`Failed to parse structured log as JSON: ${logLine}`)
		}

		expect(logObject).toMatchObject({
			codename: 'TEST',
			dryRun: false,
			env: Env.Development,
			host: 'localhost',
			level: 'info',
			message: 'Structured log message',
			package: 'logger-package',
			requestId: logger.metadata.requestId,
			stage: Env.Beta,
			userId: 'user-123',
			version: '1.0.0',
		})
	})

	it('should not include removed metadata in friendly logs', () => {
		logger.addToAllLogs('userId', 'user-123')
		logger.removeFromAllLogs('userId')
		logger.info('Friendly log without user')

		const logLine = stripAnsi(output[0])
		const separator = ' | '
		const parts = logLine.split(separator).map((part) => part.trim())

		expect(parts).not.toContainEqual(expect.stringContaining('userId: user-123'))
		expect(parts).toEqual(
			expect.arrayContaining([
				expect.stringContaining('codename: TEST'),
				expect.stringContaining('dryRun: false'),
				expect.stringContaining('host: localhost'),
				expect.stringContaining(`requestId: ${logger.metadata.requestId}`),
				expect.stringContaining('stage: Beta'),
				expect.stringContaining('version: 1.0.0'),
			]),
		)
	})

	it('should not include removed metadata in structured logs', () => {
		logger = initializeLogger({
			configOptions: {
				CODENAME: 'TEST',
				DRY_RUN: false,
				ENV: Env.Development,
				HOST: 'localhost',
				LOG_FORMAT: 'structured',
				LOG_LEVEL: LogLevel.Debug,
				LOG_SECTION_SEPARATOR: ' | ',
				PACKAGE: 'logger-package',
				STAGE: Env.Beta,
				TIMESTAMP_FORMAT: 'YYYY-MM-DD HH:mm:ssZ',
				VERSION: '1.0.0',
			},
		})

		logger.addToAllLogs('userId', 'user-123')
		logger.removeFromAllLogs('userId')
		logger.info('Structured log without user')

		const logLine = output.at(-1)
		let logObject: Record<string, unknown>

		try {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			logObject = JSON.parse(logLine!)
		} catch {
			throw new Error(`Failed to parse structured log as JSON: ${logLine}`)
		}

		expect(logObject).not.toHaveProperty('userId')
		expect(logObject).toMatchObject({
			codename: 'TEST',
			dryRun: false,
			env: Env.Development,
			host: 'localhost',
			level: 'info',
			message: 'Structured log without user',
			package: 'logger-package',
			requestId: logger.metadata.requestId,
			stage: Env.Beta,
			version: '1.0.0',
		})
	})
})
