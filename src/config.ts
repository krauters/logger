/* eslint-disable @typescript-eslint/naming-convention */
import { EnvironmentBuilder } from '@krauters/environment'
import { Env, getPackageJson, isTruthy } from '@krauters/utils'
import { hostname } from 'os'

import { LogLevel } from './structures'

/**
 * Retrieves the application's environment configuration, allowing overrides via an options object.
 *
 * @param options Optional configuration overrides.
 * @returns The environment variable configuration.
 */
export function getConfig(options?: Partial<ConfigOptions>) {
	const packageJson = getPackageJson()
	const codename = packageJson.name.split('/')[1]

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
		.transform((value) => isTruthy(value), 'DRY_RUN')
		.defaults({
			// Actual Defaults
			CODENAME: codename,
			DRY_RUN: false,
			ENV: Env.Unknown,
			HOST: hostname(),
			LOG_LEVEL: LogLevel.Info,
			LOG_SECTION_SEPARATOR: ' | ',
			TIMESTAMP_FORMAT: 'YYYY-MM-DD HH:mm:ssZ',
			VERSION: packageJson.version,

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
