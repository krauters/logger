/* eslint-disable @typescript-eslint/naming-convention */
import { EnvironmentBuilder } from '@krauters/environment'
import { Env, Stage } from '@krauters/structures'
import { hostname } from 'os'

import type { ConfigOptions } from './structures'

import { empty, LogLevel } from './structures'
import { isFalsy } from './utils'

export type Config = ReturnType<typeof getConfig>

/**
 * Retrieves the application's environment configuration, allowing overrides via an options object.
 * If PULL_FROM_ENVIRONMENT is false, will not load values from environment variables.
 *
 * @param options Optional configuration overrides.
 * @returns The environment variable configuration.
 */
export function getConfig(options?: Partial<ConfigOptions>) {
	if (options?.PULL_FROM_ENVIRONMENT === false) {
		return options
	}

	return EnvironmentBuilder.create(
		'CODENAME',
		'ENV',
		'HOST',
		'LOG_FORMAT',
		'LOG_LEVEL',
		'LOG_PREFIX',
		'LOG_SECTION_SEPARATOR',
		'OBFUSCATION_ENABLED',
		'OBFUSCATION_PATTERNS',
		'PACKAGE',
		'SIMPLE_LOGS',
		'STAGE',
		'TIMESTAMP_FORMAT',
		'VERSION',
	)
		.optionals('LOG_FRIENDLY_FIELDS_HIDE', 'LOG_STRUCTURED_FIELDS_HIDE', 'REQUEST_ID', 'LOG_PROCESSOR')
		.transform((value) => !isFalsy(value), 'SIMPLE_LOGS', 'OBFUSCATION_ENABLED')
		.transform(
			(value) => (value.trim() === '' ? [] : value.replace(/\s/g, '').split(',')),
			'LOG_FRIENDLY_FIELDS_HIDE',
			'LOG_STRUCTURED_FIELDS_HIDE',
		)
		.transform((value) => value as Env, 'ENV')
		.transform((value) => value as Stage, 'STAGE')
		.transform((value) => value as LogLevel, 'LOG_LEVEL')
		.transform(
			(value) => (typeof value === 'string' && value.trim() !== '' ? [new RegExp(value.trim())] : []),
			'OBFUSCATION_PATTERNS',
		)
		.defaults({
			// Actual Defaults
			CODENAME: empty,
			CUSTOM_LOG_PROCESSOR: undefined,
			ENV: Env.Unknown,
			HOST: hostname(),
			LOG_FORMAT: 'friendly',
			LOG_LEVEL: LogLevel.Info,
			LOG_PREFIX: '',
			LOG_SECTION_SEPARATOR: ' | ',
			OBFUSCATION_ENABLED: true,

			// Object.values(SensitivePatterns).map((pattern) => new RegExp(pattern))
			OBFUSCATION_PATTERNS: [],
			PACKAGE: empty,
			SIMPLE_LOGS: false,
			STAGE: Stage.Unknown,
			TIMESTAMP_FORMAT: 'YYYY-MM-DD HH:mm:ssZ',
			VERSION: empty,

			// Parameter Supplied Defaults
			...options,
		})
		.withPrefix(options?.ENVIRONMENT_PREFIX ?? '')
		.environment()
}
