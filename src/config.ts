/* eslint-disable @typescript-eslint/naming-convention */
import { EnvironmentBuilder } from '@krauters/environment'
import { Env, Stage } from '@krauters/structures'
import { hostname } from 'os'

import { empty, LogLevel } from './structures'
import { isFalsy } from './utils'

export type Config = ReturnType<typeof getConfig>

/**
 * Configuration options for retrieving and building the logger environment configuration.
 */
export interface ConfigOptions {
	CODENAME: string

	/**
	 * The current environment (e.g. Development, Production).
	 */
	ENV: Env

	/**
	 * An optional prefix to apply to environment variables.
	 */
	ENVIRONMENT_PREFIX?: string

	/**
	 * The hostname of the machine or environment running the code.
	 */
	HOST: string

	/**
	 * The output format of logs, either 'friendly' or 'structured'.
	 */
	LOG_FORMAT: string

	/**
	 * Fields to be hidden from friendly log format output.
	 */
	LOG_FRIENDLY_FIELDS_HIDE?: string[]

	/**
	 * The minimum log level at which logs are recorded.
	 */
	LOG_LEVEL: LogLevel

	/**
	 * A string prefix applied to every log message.
	 */
	LOG_PREFIX: string

	/**
	 * A string used to separate sections within a log message.
	 */
	LOG_SECTION_SEPARATOR: string

	/**
	 * Fields to be hidden from structured log format output.
	 */
	LOG_STRUCTURED_FIELDS_HIDE?: string[]

	/**
	 * The package or application name.
	 */
	PACKAGE: string

	/**
	 * If true, values can be pulled from environment variables. Defaults to true if not provided.
	 */
	PULL_FROM_ENVIRONMENT?: boolean

	/**
	 * A static request ID to be used in logs. If not provided, one will be generated.
	 */
	REQUEST_ID?: string

	/**
	 * If true, enables simpler log formatting without full request IDs.
	 */
	SIMPLE_LOGS: boolean

	/**
	 * The current stage or tier (e.g. Beta, Production).
	 */
	STAGE: Stage

	/**
	 * The format of timestamps in log messages.
	 */
	TIMESTAMP_FORMAT: string

	/**
	 * The current version of the application or service.
	 */
	VERSION: string
}

/**
 * Retrieves the application's environment configuration, allowing overrides via an options object.
 * If pullFromEnv is false, will not load values from environment variables.
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
		'PACKAGE',
		'SIMPLE_LOGS',
		'STAGE',
		'TIMESTAMP_FORMAT',
		'VERSION',
	)
		.optionals('LOG_FRIENDLY_FIELDS_HIDE', 'LOG_STRUCTURED_FIELDS_HIDE', 'REQUEST_ID')
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
			LOG_PREFIX: '',
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
