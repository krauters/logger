/* eslint-disable @typescript-eslint/naming-convention */
import { Env, Stage } from '@krauters/structures'

import type { Config } from '../src/config'
import type { ConfigOptions } from '../src/structures'

import { getConfig } from '../src/config'
import { LogLevel } from '../src/structures'

describe('getConfig Simplified Tests', () => {
	const ORIGINAL_ENV = { ...process.env }

	beforeEach(() => {
		jest.resetModules()
		process.env = { ...ORIGINAL_ENV }
	})

	afterAll(() => {
		process.env = ORIGINAL_ENV
	})

	it('should return provided options directly when PULL_FROM_ENVIRONMENT is false', () => {
		const options: Partial<ConfigOptions> = {
			CODENAME: 'override-codename',
			ENV: Env.Production,
			LOG_FRIENDLY_FIELDS_HIDE: ['user', 'token'],
			LOG_LEVEL: LogLevel.Debug,
			PULL_FROM_ENVIRONMENT: false,
			SIMPLE_LOGS: true,
		}

		const result = getConfig(options)

		expect(result).toEqual(options)
	})

	it('should build configuration using environment variables when PULL_FROM_ENVIRONMENT is true', () => {
		process.env.CODENAME = 'override-codename'
		process.env.ENV = 'Development'
		process.env.HOST = 'env-host'
		process.env.LOG_FORMAT = 'structured'
		process.env.LOG_LEVEL = 'error'
		process.env.LOG_PREFIX = '[env-test] '
		process.env.LOG_SECTION_SEPARATOR = ' || '
		process.env.PACKAGE = 'env-package'
		process.env.SIMPLE_LOGS = 'true'
		process.env.STAGE = 'Beta'
		process.env.TIMESTAMP_FORMAT = 'MM/DD/YYYY HH:mm:ss'
		process.env.VERSION = '2.0.0'
		process.env.LOG_FRIENDLY_FIELDS_HIDE = 'admin'
		process.env.LOG_STRUCTURED_FIELDS_HIDE = 'secret,apiKey'

		const options: Partial<ConfigOptions> = {
			CODENAME: 'direct-codename',
			LOG_FRIENDLY_FIELDS_HIDE: ['user', 'token'],
			LOG_LEVEL: LogLevel.Debug,
		}

		const expectedConfig: Config = {
			CODENAME: 'override-codename',
			ENV: Env.Development,
			ENVIRONMENT_PREFIX: undefined,
			HOST: 'env-host',
			LOG_FORMAT: 'structured',
			LOG_FRIENDLY_FIELDS_HIDE: ['admin'],
			LOG_LEVEL: LogLevel.Error,
			LOG_PREFIX: '[env-test] ',
			LOG_PROCESSOR: undefined,
			LOG_SECTION_SEPARATOR: ' || ',
			LOG_STRUCTURED_FIELDS_HIDE: ['secret', 'apiKey'],
			OBFUSCATION_ENABLED: true,
			OBFUSCATION_PATTERNS: [],
			PACKAGE: 'env-package',
			REQUEST_ID: undefined,
			SIMPLE_LOGS: true,
			STAGE: Stage.Beta,
			TIMESTAMP_FORMAT: 'MM/DD/YYYY HH:mm:ss',
			VERSION: '2.0.0',
		}

		const result = getConfig(options)

		expect(result).toEqual(expectedConfig)
	})
})
