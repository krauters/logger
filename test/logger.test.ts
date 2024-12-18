// test/logger.test.ts
/* eslint-disable @typescript-eslint/naming-convention */
import type { TransformableInfo } from 'logform'

import { Env, Stage } from '@krauters/structures'
import { mocked } from 'jest-mock'
import { v4 as uuidv4 } from 'uuid'
import Transport from 'winston-transport'

import type { LoggerOptions } from '../src/structures'

import { type ConfigOptions, getConfig } from '../src/config'
import { Logger } from '../src/logger'
import { LogLevel } from '../src/structures'

jest.mock('uuid', () => ({ v4: jest.fn() }))
jest.mock('../src/config', () => ({ getConfig: jest.fn() }))

class TestTransport extends Transport {
	logs: string[] = []

	log(info: TransformableInfo, callback: () => void): void {
		const finalMessage = info[Symbol.for('message')] as string
		this.logs.push(finalMessage)
		callback()
	}
}

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

	// REQUEST_ID is optional and omitted here
}

// Define a variable to hold the current configuration
let currentConfig: ConfigOptions = { ...baseConfig }

// Correctly mock getConfig to handle Partial<ConfigOptions>
const mockedGetConfig = mocked(getConfig) as jest.MockedFunction<typeof getConfig>

mockedGetConfig.mockImplementation((options?: Partial<ConfigOptions>) => ({
	...currentConfig,
	...options,
}))

// eslint-disable-next-line max-lines-per-function
describe('logger', () => {
	let testTransport: TestTransport
	let logger: Logger

	beforeEach(() => {
		// Reset all mocks before each test
		jest.clearAllMocks()
		;(mocked(uuidv4) as unknown as jest.Mock).mockReturnValue('generated-uuid')

		// Reset currentConfig to baseConfig before each test
		currentConfig = { ...baseConfig }

		// Initialize TestTransport
		testTransport = new TestTransport()

		// Initialize Logger with TestTransport
		const loggerOptions: LoggerOptions = {
			configOptions: baseConfig,
			transports: [testTransport],
		}

		logger = new Logger(loggerOptions)
	})

	it('initializes with default configuration', () => {
		expect(logger.config).toMatchObject(baseConfig)
		expect(logger.metadata).toMatchObject({
			codename: 'test-codename',
			env: Env.Development,
			host: 'test-host',
			package: 'test-package',
			requestId: 'generated-uuid',
			stage: Stage.Beta,
			version: '1.0.0',
		})
	})

	it('logs info messages', () => {
		logger.info('hello-world', { foo: 'bar' })
		const output = testTransport.logs.join('\n')
		expect(output).toContain('hello-world')
		expect(output).toContain('foo: bar')
	})

	it('hides specified friendly fields', () => {
		// Password should be hidden
		logger.info('secret-test', { password: 'my-secret', user: 'alice' })
		const output = testTransport.logs.join('\n')
		expect(output).toContain('secret-test')
		expect(output).toContain('user: alice')
		expect(output).not.toContain('password:')
	})

	it('adjusts log level dynamically', async () => {
		// Initially INFO, so DEBUG logs won't appear
		logger.debug('not-visible')
		let output = testTransport.logs.join('\n')
		expect(output).not.toContain('not-visible')

		// Change level to DEBUG
		logger.updateInstance({ configOptions: { LOG_LEVEL: LogLevel.Debug } })

		// Verify that the config has been updated
		expect(logger.logger.level).toBe(LogLevel.Debug)

		// Now DEBUG logs should appear
		logger.debug('now-visible')

		// Give Winston a tick to process logs
		await new Promise((resolve) => setImmediate(resolve))

		output = testTransport.logs.join('\n')
		expect(output).toContain('now-visible')
	})

	it('adds fields to all logs', () => {
		logger.addToAllLogs('transactionId', '12345')
		logger.info('with-transaction')
		const output = testTransport.logs.join('\n')
		expect(output).toContain('with-transaction')
		expect(output).toContain('transactionId: 12345')
	})

	it('removes fields from all logs', () => {
		logger.addToAllLogs('sessionId', 'abc')
		logger.removeFromAllLogs('sessionId')
		logger.info('no-session')
		const output = testTransport.logs.join('\n')
		expect(output).toContain('no-session')
		expect(output).not.toContain('sessionId:')
	})

	it('switches to structured format', () => {
		// Update the currentConfig to set LOG_FORMAT to 'structured' and remove REQUEST_ID
		currentConfig = {
			...currentConfig,
			LOG_FORMAT: 'structured',
			REQUEST_ID: undefined,
		}

		// Update Logger instance with new config
		logger.updateInstance({ configOptions: { LOG_FORMAT: 'structured', REQUEST_ID: undefined } })

		// Clear old logs before structured test
		testTransport.logs = []

		logger.info('structured-test', { hello: 'world' })
		const output = testTransport.logs[0]

		// Ensure output is valid JSON
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		expect(() => JSON.parse(output)).not.toThrow()
		const parsed: { hello: string; message: string; requestId: string } = JSON.parse(output)
		expect(parsed.hello).toBe('world')
		expect(parsed.message).toBe('structured-test')
		expect(parsed.requestId).toBeDefined()
	})

	it('handles SIMPLE_LOGS and shorter request ids', () => {
		// Mock uuidv4 to return a short string
		;(mocked(uuidv4) as unknown as jest.Mock).mockReturnValue('short')

		// Update the currentConfig to set SIMPLE_LOGS to true and remove REQUEST_ID
		currentConfig = {
			...currentConfig,
			REQUEST_ID: undefined,
			SIMPLE_LOGS: true,
		}

		// Update Logger instance with new config
		logger.updateInstance({ configOptions: { REQUEST_ID: undefined, SIMPLE_LOGS: true } })

		expect(logger.metadata.requestId?.length).toBeLessThan(10)
	})

	it('publishes metrics to cloudwatch', async () => {
		const { CloudWatchClient, PutMetricDataCommand } = jest.requireActual('@aws-sdk/client-cloudwatch')
		const sendSpy = jest.spyOn(CloudWatchClient.prototype, 'send').mockResolvedValue({})
		await logger.publishMetric({ metricName: 'TestMetric', value: 10 })
		const output = testTransport.logs.join('\n')
		expect(sendSpy).toHaveBeenCalledWith(expect.any(PutMetricDataCommand))
		expect(output).toContain('Metric published [TestMetric]')
		sendSpy.mockRestore()
	})

	it('handles metric publish errors', async () => {
		const { CloudWatchClient, PutMetricDataCommand } = jest.requireActual('@aws-sdk/client-cloudwatch')
		const sendSpy = jest.spyOn(CloudWatchClient.prototype, 'send').mockRejectedValue(new Error('publish-error'))
		await logger.publishMetric({ metricName: 'FailMetric', value: 1 })
		const output = testTransport.logs.join('\n')
		expect(sendSpy).toHaveBeenCalledWith(expect.any(PutMetricDataCommand))
		expect(output).toContain('Failed to publish metric [FailMetric]')
		sendSpy.mockRestore()
	})
})
