// logger/test/logger.test.ts
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable max-lines-per-function */

import type { CloudWatchClient } from '@aws-sdk/client-cloudwatch'
import type { LogMethod } from 'winston'

import { PutMetricDataCommand } from '@aws-sdk/client-cloudwatch'
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { Env } from '@krauters/structures'

import { initializeLogger, Logger, LogLevel, MetricUnit } from '../src/index'

jest.mock('@aws-sdk/client-cloudwatch')

describe('Logger', () => {
	let logger: Logger
	let cloudWatchClientMock: jest.Mock
	let logSpy: jest.SpiedFunction<LogMethod>

	const attachLogSpy = () => {
		logSpy = jest.spyOn(logger.logger, 'log')
	}

	beforeEach(() => {
		// Reset the singleton instance
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		Logger.instance = undefined as any

		// Initialize logger with test-specific configuration
		logger = initializeLogger({
			configOptions: {
				CODENAME: 'TEST',
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

		// Mock CloudWatch's send method
		cloudWatchClientMock = jest.fn().mockResolvedValue({} as never)
		logger.cloudwatch = { send: cloudWatchClientMock } as unknown as CloudWatchClient

		attachLogSpy()
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('should be a singleton', () => {
		const anotherLogger = Logger.getInstance()
		expect(logger).toBe(anotherLogger)
	})

	it('should log a message at debug level', () => {
		logger.debug('Debug message', { key: 'value' })
		expect(logSpy).toHaveBeenCalledWith('debug', 'Debug message', expect.objectContaining({ key: 'value' }))
	})

	it('should format messages with timestamp, level, and message', () => {
		const formatLogMessageSpy = jest.spyOn(logger, 'formatLogMessage')
		logger.info('Info message', { exampleKey: 'exampleValue' })
		expect(formatLogMessageSpy).toHaveBeenCalled()
		expect(logSpy).toHaveBeenCalledWith(
			'info',
			'Info message',
			expect.objectContaining({ exampleKey: 'exampleValue' }),
		)
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
		logger.addToAllLogs('userId', 'user-123')
		logger.info('Message with user')
		expect(logSpy).toHaveBeenCalledWith(
			'info',
			'Message with user',
			expect.objectContaining({ userId: 'user-123' }),
		)
	})

	it('should remove a single metadata key from all subsequent logs', () => {
		logger.addToAllLogs('userId', 'user-123')
		logger.removeFromAllLogs('userId')

		expect(logger.metadata).not.toHaveProperty('userId')

		logger.info('Message without user')
		expect(logSpy).toHaveBeenCalledWith(
			'info',
			'Message without user',
			expect.not.objectContaining({ userId: 'user-123' }),
		)
	})

	it('should remove multiple metadata keys when passed separately', () => {
		logger.addToAllLogs('userId', 'user-123')
		logger.addToAllLogs('sessionId', 'session-abc')
		logger.removeFromAllLogs('userId', 'sessionId')
		logger.info('Message without user and session')
		expect(logSpy).toHaveBeenCalledWith(
			'info',
			'Message without user and session',
			expect.not.objectContaining({ sessionId: 'session-abc', userId: 'user-123' }),
		)
	})

	it('should remove multiple metadata keys when passed as an array', () => {
		logger.addToAllLogs('userId', 'user-123')
		logger.addToAllLogs('sessionId', 'session-abc')
		logger.addToAllLogs('codename', 'coden-xyz')
		logger.removeFromAllLogs(['userId', 'sessionId', 'codename'])
		logger.info('Message without user, session and codename')
		expect(logSpy).toHaveBeenCalledWith(
			'info',
			'Message without user, session and codename',
			expect.not.objectContaining({ codename: 'coden-xyz', sessionId: 'session-abc', userId: 'user-123' }),
		)
	})

	it('should format friendly logs correctly', () => {
		logger.addToAllLogs('userId', 'user-123')
		logger.info('Friendly log message')
		expect(logSpy).toHaveBeenCalledWith(
			'info',
			'Friendly log message',
			expect.objectContaining({ userId: 'user-123' }),
		)
	})

	it('should format structured logs correctly', () => {
		logger = initializeLogger({
			configOptions: {
				CODENAME: 'TEST',
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
		attachLogSpy()

		logger.addToAllLogs('userId', 'user-123')
		logger.info('Structured log message')

		expect(logSpy).toHaveBeenCalledWith(
			'info',
			'Structured log message',
			expect.objectContaining({ userId: 'user-123' }),
		)
	})

	it('should not include removed metadata in friendly logs', () => {
		logger.addToAllLogs('userId', 'user-123')
		logger.removeFromAllLogs('userId')
		logger.info('Friendly log without user')
		expect(logSpy).toHaveBeenCalledWith(
			'info',
			'Friendly log without user',
			expect.not.objectContaining({ userId: 'user-123' }),
		)
	})

	it('should not include removed metadata in structured logs', () => {
		logger = initializeLogger({
			configOptions: {
				CODENAME: 'TEST',
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
		attachLogSpy()

		logger.addToAllLogs('userId', 'user-123')
		logger.removeFromAllLogs('userId')
		logger.info('Structured log without user')

		expect(logSpy).toHaveBeenCalledWith(
			'info',
			'Structured log without user',
			expect.not.objectContaining({ userId: 'user-123' }),
		)
	})

	// **New Tests Start Here**

	it('should add a new log level and log at that level', () => {
		const newLevels = { fatal: 0 }
		const newColors = { fatal: 'red' }
		logger.updateLevels(newLevels, newColors)

		attachLogSpy()

		logger.log({ level: 'fatal' as LogLevel, message: 'Fatal error occurred', metadata: { errorCode: 500 } })
		expect(logSpy).toHaveBeenCalledWith(
			'fatal',
			'Fatal error occurred',
			expect.objectContaining({ errorCode: 500 }),
		)
	})

	it('should update the color of an existing log level and reflect in output', () => {
		const updatedColors = { info: 'green' }
		logger.updateLevels({}, updatedColors)

		attachLogSpy()

		logger.info('Info message with updated color')
		expect(logSpy).toHaveBeenCalledWith('info', 'Info message with updated color', expect.any(Object))
	})

	it('should preserve existing transports after updating levels and colors', () => {
		const initialTransports = logger.logger.transports.length

		const newLevels = { critical: -1 }
		const newColors = { critical: 'red' }
		logger.updateLevels(newLevels, newColors)

		attachLogSpy()

		expect(logger.logger.transports.length).toBe(initialTransports)

		logger.log({ level: 'critical' as LogLevel, message: 'Critical failure!', metadata: { system: 'Payment' } })
		expect(logSpy).toHaveBeenCalledWith(
			'critical',
			'Critical failure!',
			expect.objectContaining({ system: 'Payment' }),
		)
	})

	it('should log multiple new levels correctly', () => {
		const newLevels = { emergency: -2, notice: 1 }
		const newColors = { emergency: 'magenta', notice: 'blue' }
		logger.updateLevels(newLevels, newColors)

		attachLogSpy()

		logger.log({ level: 'emergency' as LogLevel, message: 'Emergency situation!', metadata: { code: 'EMG001' } })
		expect(logSpy).toHaveBeenCalledWith(
			'emergency',
			'Emergency situation!',
			expect.objectContaining({ code: 'EMG001' }),
		)

		logger.log({ level: 'notice' as LogLevel, message: 'Notice message.', metadata: { info: 'Important info' } })
		expect(logSpy).toHaveBeenCalledWith(
			'notice',
			'Notice message.',
			expect.objectContaining({ info: 'Important info' }),
		)
	})

	it('should not throw when updating with existing levels and colors', () => {
		const existingLevels = { info: 2 }
		const existingColors = { info: 'cyan' }
		expect(() => {
			logger.updateLevels(existingLevels, existingColors)
		}).not.toThrow()

		attachLogSpy()

		logger.info('Info message after re-updating levels and colors')
		expect(logSpy).toHaveBeenCalledWith(
			'info',
			'Info message after re-updating levels and colors',
			expect.any(Object),
		)
	})

	it('should handle invalid log levels gracefully', () => {
		expect(() => {
			logger.log({ level: 'invalidLevel' as LogLevel, message: 'This should fail' })
		}).toThrow()
	})

	it('should handle invalid color assignments by throwing', () => {
		const invalidColors = { info: 'invalidColor' }

		expect(() => {
			logger.updateLevels({}, invalidColors)
		}).toThrow()
	})
})
