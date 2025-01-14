/* eslint-disable @typescript-eslint/naming-convention */
import type { TransformableInfo } from 'logform'

import { Env, Stage } from '@krauters/structures'
import { mocked } from 'jest-mock'
import { v4 as uuidv4 } from 'uuid'
import Transport from 'winston-transport'

import type { ConfigOptions, LoggerOptions } from '../src/structures'

import { getConfig } from '../src/config'
import { Logger } from '../src/logger'
import { LogLevel } from '../src/structures'

jest.mock('uuid', () => ({ v4: jest.fn() }))
jest.mock('../src/config', () => ({ getConfig: jest.fn() }))

class TestTransport extends Transport {
	logs: string[] = []

	// Updated to accept additional arguments to prevent TypeScript errors
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
		jest.clearAllMocks()
		;(mocked(uuidv4) as unknown as jest.Mock).mockReturnValue('generated-uuid')

		currentConfig = { ...baseConfig }

		testTransport = new TestTransport()

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
		const parsed: { hello: string; message: string; requestId?: string } = JSON.parse(output)
		expect(parsed.hello).toBe('world')
		expect(parsed.message).toBe('structured-test')

		// Adjusted expectation: requestId should still be present
		expect(parsed.requestId).toBe('generated-uuid')
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

	// === Additional Test Cases Below ===

	describe('Additional Logging Methods', () => {
		it('logs debug messages when level is set to debug', async () => {
			logger.updateInstance({ configOptions: { LOG_LEVEL: LogLevel.Debug } })

			logger.debug('debug-message', { debugKey: 'debugValue' })

			await new Promise((resolve) => setImmediate(resolve))
			const output = testTransport.logs.join('\n')
			expect(output).toContain('debug-message')
			expect(output).toContain('debugKey: debugValue')
		})

		it('logs error messages', () => {
			logger.error('error-message', { errorKey: 'errorValue' })
			const output = testTransport.logs.join('\n')
			expect(output).toContain('error-message')
			expect(output).toContain('errorKey: errorValue')
		})

		it('logs trace messages when level is set to trace', async () => {
			logger.updateLevels({ trace: 8 }, { trace: 'magenta' })
			logger.updateInstance({ configOptions: { LOG_LEVEL: LogLevel.Trace } })

			logger.trace('trace-message', { traceKey: 'traceValue' })

			await new Promise((resolve) => setImmediate(resolve))
			const output = testTransport.logs.join('\n')
			expect(output).toContain('trace-message')
			expect(output).toContain('traceKey: traceValue')
		})

		it('logs warn messages', () => {
			logger.warn('warn-message', { warnKey: 'warnValue' })
			const output = testTransport.logs.join('\n')
			expect(output).toContain('warn-message')
			expect(output).toContain('warnKey: warnValue')
		})
	})

	describe('Obfuscation Functionality', () => {
		beforeEach(() => {
			// Enable obfuscation and set patterns to match entire field values where necessary
			currentConfig = {
				...currentConfig,
				OBFUSCATION_ENABLED: true,
				OBFUSCATION_PATTERNS: [/^mypassword$/i, /secret/i, /token:\s*\w+/],
			}
			logger.updateInstance({
				configOptions: {
					OBFUSCATION_ENABLED: true,
					OBFUSCATION_PATTERNS: [/^mypassword$/i, /secret/i, /token:\s*\w+/],
				},
			})
		})

		it('obfuscates specified fields in friendly format', () => {
			logger.info('obfuscate-test', { normalField: 'visible', password: 'mypassword', secretInfo: 'topsecret' })
			const output = testTransport.logs.join('\n')
			expect(output).toContain('password: ****MASKED****')
			expect(output).toContain('secretInfo: top****MASKED****')
			expect(output).toContain('normalField: visible')
		})

		it('obfuscates specified fields in structured format', () => {
			// Switch to structured format
			currentConfig = {
				...currentConfig,
				LOG_FORMAT: 'structured',
			}
			logger.updateInstance({ configOptions: { LOG_FORMAT: 'structured' } })

			logger.info('structured-obfuscate-test', {
				normalField: 'visible',
				password: 'mypassword',
				secretInfo: 'topsecret',
			})
			const output = testTransport.logs[0]
			const parsed = JSON.parse(output)
			expect(parsed.password).toBe('****MASKED****')
			expect(parsed.secretInfo).toBe('top****MASKED****')
			expect(parsed.normalField).toBe('visible')
		})
	})

	describe('Dynamic Level and Color Updates', () => {
		it('updates logging levels and colors correctly', () => {
			// Add a new custom level
			const newLevels = { verbose: 9 }
			const newColors = { verbose: 'cyan' }
			logger.updateLevels(newLevels, newColors)
			logger.log({
				level: 'verbose' as LogLevel,
				message: 'verbose-message',
				metadata: { verboseKey: 'verboseValue' },
			})

			const output = testTransport.logs.join('\n')
			expect(output).toContain('verbose-message')
			expect(output).toContain('verboseKey: verboseValue')
		})

		it('logs message indicating levels and colors update', () => {
			const newLevels = { verbose: 9 }
			const newColors = { verbose: 'cyan' }
			logger.updateLevels(newLevels, newColors)

			const output = testTransport.logs.join('\n')
			expect(output).toContain('Logger levels and colors have been updated.')
		})
	})

	describe('Formatter Behaviors', () => {
		it('formats log messages correctly in friendly format', () => {
			logger.info('friendly-format-test', { key1: 'value1', key2: 'value2' })
			const output = testTransport.logs.join('\n')

			// Adjusted regex to accommodate timezone offsets like -07:00
			expect(output).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}/)
			expect(output).toContain('info')
			expect(output).toContain('[test] friendly-format-test')
			expect(output).toContain('key1: value1')
			expect(output).toContain('key2: value2')
		})

		it('formats log messages correctly in structured format', () => {
			// Switch to structured format
			currentConfig = {
				...currentConfig,
				LOG_FORMAT: 'structured',
			}
			logger.updateInstance({ configOptions: { LOG_FORMAT: 'structured' } })

			logger.info('structured-format-test', { key1: 'value1', key2: 'value2' })
			const output = testTransport.logs[0]
			const parsed = JSON.parse(output)
			expect(parsed.message).toBe('structured-format-test')
			expect(parsed.key1).toBe('value1')
			expect(parsed.key2).toBe('value2')
			expect(parsed.requestId).toBe('generated-uuid')
		})
	})

	describe('Metadata Management', () => {
		it('adds multiple fields to all logs', () => {
			logger.addToAllLogs('field1', 'value1')
			logger.addToAllLogs('field2', 'value2')
			logger.info('multiple-fields-test')
			const output = testTransport.logs.join('\n')
			expect(output).toContain('multiple-fields-test')
			expect(output).toContain('field1: value1')
			expect(output).toContain('field2: value2')
		})

		it('removes multiple fields from all logs', () => {
			logger.addToAllLogs('field1', 'value1')
			logger.addToAllLogs('field2', 'value2')
			logger.removeFromAllLogs('field1', 'field2')
			logger.info('remove-multiple-fields-test')
			const output = testTransport.logs.join('\n')
			expect(output).toContain('remove-multiple-fields-test')
			expect(output).not.toContain('field1:')
			expect(output).not.toContain('field2:')
		})

		it('handles removal of non-existent fields gracefully', () => {
			logger.removeFromAllLogs('nonExistentField')
			logger.info('no-error-on-remove')
			const output = testTransport.logs.join('\n')
			expect(output).toContain('no-error-on-remove')
		})
	})

	describe('Utility Methods', () => {
		it('generates a request ID when none is provided', () => {
			// Reset REQUEST_ID and SIMPLE_LOGS
			currentConfig = {
				...currentConfig,
				REQUEST_ID: undefined,
				SIMPLE_LOGS: false,
			}
			logger.updateInstance({ configOptions: { REQUEST_ID: undefined, SIMPLE_LOGS: false } })

			logger.info('request-id-test')
			const output = testTransport.logs.join('\n')
			expect(output).toContain('requestId: generated-uuid')
		})

		it('uses provided REQUEST_ID from config', () => {
			currentConfig = {
				...currentConfig,
				REQUEST_ID: 'fixed-request-id',
			}
			logger.updateInstance({ configOptions: { REQUEST_ID: 'fixed-request-id' } })

			logger.info('fixed-request-id-test')
			const output = testTransport.logs.join('\n')
			expect(output).toContain('requestId: fixed-request-id')
		})
	})

	describe('Error Handling in Logging', () => {
		it('handles logging with undefined metadata gracefully', () => {
			expect(() => logger.info('undefined-metadata-test')).not.toThrow()
			const output = testTransport.logs.join('\n')
			expect(output).toContain('undefined-metadata-test')
		})

		it('handles logging with null metadata gracefully', () => {
			expect(() => logger.info('null-metadata-test', null as never)).not.toThrow()
			const output = testTransport.logs.join('\n')
			expect(output).toContain('null-metadata-test')
		})

		it('handles logging with non-string messages gracefully', () => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			expect(() => logger.info(12345, { key: 'value' })).not.toThrow()
			const output = testTransport.logs.join('\n')
			expect(output).toContain('12345')
			expect(output).toContain('key: value')
		})
	})

	describe('Obfuscation Patterns Edge Cases', () => {
		beforeEach(() => {
			// Enable obfuscation and set patterns
			currentConfig = {
				...currentConfig,
				OBFUSCATION_ENABLED: true,
				OBFUSCATION_PATTERNS: [/^mypassword$/i, /secret/i, /token:\s*\w+/],
			}
			logger.updateInstance({
				configOptions: {
					OBFUSCATION_ENABLED: true,
					OBFUSCATION_PATTERNS: [/^mypassword$/i, /secret/i, /token:\s*\w+/],
				},
			})
		})

		it('does not obfuscate fields that do not match patterns', () => {
			logger.info('no-obfuscate-test', { email: 'john@example.com', username: 'john_doe' })
			const output = testTransport.logs.join('\n')
			expect(output).toContain('username: john_doe')
			expect(output).toContain('email: john@example.com')
			expect(output).not.toContain('****MASKED****')
		})

		it('obfuscates multiple fields matching different patterns', () => {
			logger.info('multi-obfuscate-test', {
				normalField: 'visible',
				password: 'mypassword',
				secretInfo: 'topsecret',
				token: 'abc123',
			})
			const output = testTransport.logs.join('\n')
			expect(output).toContain('password: ****MASKED****')
			expect(output).toContain('secretInfo: top****MASKED****')
			expect(output).toContain('token: ****MASKED****')
			expect(output).toContain('normalField: visible')
		})

		it('handles obfuscation when patterns overlap', () => {
			logger.info('overlap-obfuscate-test', {
				password: 'mypassword',
				passwordField: 'anotherPassword456',
			})
			const output = testTransport.logs.join('\n')
			expect(output).toContain('password: ****MASKED****')
			expect(output).toContain('passwordField: ****MASKED****')
		})
	})
})
