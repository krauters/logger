/* eslint-disable @typescript-eslint/naming-convention */
import type { CloudWatchClient } from '@aws-sdk/client-cloudwatch'

import { PutMetricDataCommand } from '@aws-sdk/client-cloudwatch'
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import stream from 'stream'
import winston from 'winston'

import { initializeLogger, Logger } from '../src/index'
import { LogLevel, MetricUnit } from '../src/structures'

jest.mock('@aws-sdk/client-cloudwatch')

function getCallMeta(callArgs: unknown[]): Record<string, unknown> {
	if (callArgs.length > 2 && typeof callArgs[2] === 'object' && callArgs[2] !== null) {
		const m = (callArgs[2] as { metadata?: Record<string, unknown> }).metadata

		return m ?? {}
	}

	return {}
}

// eslint-disable-next-line max-lines-per-function
describe('Logger', () => {
	let logger: Logger
	let cloudWatchClientMock: jest.Mock
	let output: string[]

	beforeEach(() => {
		logger = initializeLogger({
			configOptions: { LOG_LEVEL: LogLevel.Debug },
		})

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
		const meta = getCallMeta(logSpy.mock.calls[0])
		expect(meta).toMatchObject({ userId: 'user-123' })
	})

	it('should remove a single metadata key from all subsequent logs', () => {
		const logSpy = jest.spyOn(logger.logger, 'log')
		logger.addToAllLogs('userId', 'user-123')
		logger.removeFromAllLogs('userId')
		logger.info('Message without user')
		const meta = getCallMeta(logSpy.mock.calls.at(-1) as unknown[])
		expect(meta).not.toHaveProperty('userId')
	})

	it('should remove multiple metadata keys when passed separately', () => {
		const logSpy = jest.spyOn(logger.logger, 'log')
		logger.addToAllLogs('userId', 'user-123')
		logger.addToAllLogs('sessionId', 'session-abc')
		logger.removeFromAllLogs('userId', 'sessionId')
		logger.info('Message without user and session')
		const meta = getCallMeta(logSpy.mock.calls.at(-1) as unknown[])
		expect(meta).not.toHaveProperty('userId')
		expect(meta).not.toHaveProperty('sessionId')
	})

	it('should remove multiple metadata keys when passed as an array', () => {
		const logSpy = jest.spyOn(logger.logger, 'log')
		logger.addToAllLogs('userId', 'user-123')
		logger.addToAllLogs('sessionId', 'session-abc')
		logger.addToAllLogs('codename', 'coden-xyz')
		logger.removeFromAllLogs(['userId', 'sessionId', 'codename'])
		logger.info('Message without user, session and codename')
		const meta = getCallMeta(logSpy.mock.calls.at(-1) as unknown[])
		expect(meta).not.toHaveProperty('userId')
		expect(meta).not.toHaveProperty('sessionId')
		expect(meta).not.toHaveProperty('codename')
	})
})
