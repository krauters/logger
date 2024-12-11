/* eslint-disable @typescript-eslint/naming-convention */
import { EnvironmentBuilder } from '@krauters/environment'
import { Env, Stage } from '@krauters/structures'
import { hostname } from 'os'

import { empty, LogLevel } from './structures'
import { isFalsy } from './utils'

export type Config = ReturnType<typeof getConfig>

export interface ConfigOptions {
	CODENAME: string
	ENV: Env
	ENVIRONMENT_PREFIX?: string
	HOST: string
	LOG_FORMAT: string
	LOG_FRIENDLY_FIELDS_HIDE?: string[]
	LOG_LEVEL: LogLevel
	LOG_SECTION_SEPARATOR: string
	LOG_STRUCTURED_FIELDS_HIDE?: string[]
	PACKAGE: string
	STAGE: Stage
	TIMESTAMP_FORMAT: string
	VERSION: string
}

/**
 * Retrieves the application's environment configuration, allowing overrides via an options object.
 *
 * @param options Optional configuration overrides.
 * @returns The environment variable configuration.
 */
export function getConfig(options?: Partial<ConfigOptions>) {
	return EnvironmentBuilder.create(
		'CODENAME',
		'ENV',
		'HOST',
		'LOG_FORMAT',
		'LOG_LEVEL',
		'LOG_SECTION_SEPARATOR',
		'PACKAGE',
		'SIMPLE_LOGS',
		'STAGE',
		'TIMESTAMP_FORMAT',
		'VERSION',
	)
		.optionals('REQUEST_ID', 'LOG_FRIENDLY_FIELDS_HIDE', 'LOG_STRUCTURED_FIELDS_HIDE', 'LOG_PREFIX')
		.transform((value) => !isFalsy(value), 'SIMPLE_LOGS')
		.transform(
			(value) => (value.trim() === '' ? [] : value.replace(/\s/g, '').split(',')),
			'LOG_FRIENDLY_FIELDS_HIDE',
			'LOG_STRUCTURED_FIELDS_HIDE',
		)
		.transform((value) => value as Env, 'ENV')
		.transform((value) => value as Stage, 'STAGE')
		.transform((value) => value as LogLevel, 'LOG_LEVEL')
		.defaults({
			// Actual Defaults
			CODENAME: empty,
			ENV: Env.Unknown,
			HOST: hostname(),
			LOG_FORMAT: 'friendly',
			LOG_LEVEL: LogLevel.Info,
			LOG_SECTION_SEPARATOR: ' | ',
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
