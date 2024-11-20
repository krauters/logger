/* eslint-disable @typescript-eslint/naming-convention */
import { EnvironmentBuilder } from '@krauters/environment'
import { Env } from '@krauters/structures'
import { configDotenv } from 'dotenv'
import { hostname } from 'os'

import { LogLevel } from './structures'
import { isFalsy } from './utils'

configDotenv()

export type Config = ReturnType<typeof getConfig>

export interface ConfigOptions {
	CODENAME: string
	DRY_RUN: boolean
	ENV: Env
	HOST: string
	LOG_LEVEL: LogLevel
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
		'DRY_RUN',
		'ENV',
		'HOST',
		'LOG_LEVEL',
		'LOG_SECTION_SEPARATOR',
		'SIMPLE_LOGS',
		'TIMESTAMP_FORMAT',
		'VERSION',
	)
		.optionals('REQUEST_ID')
		.transform((value) => value as LogLevel, 'LOG_LEVEL')
		.transform((value) => !isFalsy(value), 'SIMPLE_LOGS')
		.transform((value) => !isFalsy(value), 'DRY_RUN')
		.defaults({
			// Actual Defaults
			CODENAME: 'NOTSET',
			DRY_RUN: false,
			ENV: Env.Unknown,
			HOST: hostname(),
			LOG_LEVEL: LogLevel.Info,
			LOG_SECTION_SEPARATOR: ' | ',
			SIMPLE_LOGS: false,
			TIMESTAMP_FORMAT: 'YYYY-MM-DD HH:mm:ssZ',
			VERSION: 'NOTSET',

			// Parameter Supplied Defaults
			...options,
		})
		.environment()
}
