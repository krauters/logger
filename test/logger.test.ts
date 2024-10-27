import type { CloudWatchClient } from '@aws-sdk/client-cloudwatch'

import { PutMetricDataCommand } from '@aws-sdk/client-cloudwatch'
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import stream from 'stream'
import winston from 'winston'

import { initializeLogger, Logger } from '../src/index'
import { LogLevel, MetricUnit } from '../src/structures'

jest.mock('@aws-sdk/client-cloudwatch')

describe('Logger', () => {
	let logger: Logger
	let cloudWatchClientMock: jest.Mock
	let output: string[]

	beforeEach(() => {
		// Initialize the logger with Debug level
		logger = initializeLogger({
			configOptions: { LOG_LEVEL: LogLevel.Debug },
		})

		// Mock CloudWatchClient's send method with a resolved promise
		cloudWatchClientMock = jest.fn().mockResolvedValue({} as never)
		logger.cloudwatch = { send: cloudWatchClientMock } as unknown as CloudWatchClient

		// Custom stream to capture logs
		output = []
		const logStream = new stream.Writable({
			write(chunk, _, callback) {
				// Remove 'encoding' parameter
				output.push(chunk.toString())
				callback()
			},
		})

		// Replace transports with custom stream-based transport
		logger.logger.clear()
		logger.logger.add(
			new winston.transports.Stream({
				level: 'debug', // Explicitly set to capture debug logs
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
		process.env.LOG_FORMAT = 'invalidFormat'
		expect(() => {
			logger.getFormatter()
		}).toThrowError(/Invalid LOG_FORMAT/)
		delete process.env.LOG_FORMAT
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
})
