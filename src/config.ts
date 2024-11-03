/* eslint-disable @typescript-eslint/naming-convention */
import { EnvironmentBuilder } from '@krauters/environment'
import { Env } from '@krauters/structures'
import { hostname } from 'os'

import { LogLevel } from './structures'

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
		'VERSION',
		'TIMESTAMP_FORMAT',
		'LOG_SECTION_SEPARATOR',
	)
		.optionals('REQUEST_ID')
		.transform((value) => value as LogLevel, 'LOG_LEVEL')
		.transform((value) => value.toLowerCase() === 'true', 'DRY_RUN')
		.defaults({
			// Actual Defaults
			CODENAME: 'NOTSET',
			DRY_RUN: false,
			ENV: Env.Unknown,
			HOST: hostname(),
			LOG_LEVEL: LogLevel.Info,
			LOG_SECTION_SEPARATOR: ' | ',
			TIMESTAMP_FORMAT: 'YYYY-MM-DD HH:mm:ssZ',
			VERSION: 'NOTSET',

			// Parameter Supplied Defaults
			...options,
		})
		.environment()
}

export interface ConfigOptions {
	CODENAME: string
	DRY_RUN: boolean
	ENV: Env
	HOST: string
	LOG_LEVEL: LogLevel
	VERSION: string
}

export type Config = ReturnType<typeof getConfig>
