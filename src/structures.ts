/* eslint-disable @stylistic/ts/lines-around-comment */
/* eslint-disable @typescript-eslint/naming-convention */
import type { Env, Stage } from '@krauters/structures'
import type { Context as LambdaContext } from 'aws-lambda'
import type { Format } from 'logform'
import type TransportStream from 'winston-transport'

export enum LogLevel {
	Debug = 'debug',
	Error = 'error',
	Info = 'info',
	Silly = 'silly',
	Trace = 'trace',
	Verbose = 'verbose',
	Warn = 'warn',
}

export enum MetricUnit {
	Count = 'Count',
}

export interface LoggerOptions {
	configOptions?: Partial<ConfigOptions>
	context?: LambdaContext
	format?: Format
	logProcessor?: LogProcessor
	transports?: TransportStream[]
}

export interface LogOptions {
	level: LogLevel
	message: string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	metadata?: Record<string, any>
}

export type LogProcessor = (logObject: Record<string, unknown>) => Record<string, unknown>

export interface PublishMetricOptions {
	dimensions?: {
		Name: string

		Value: string
	}[]
	metricName: string
	unit?: MetricUnit
	value: number
}

export const empty = 'NOTSET'

export interface ConfigOptions {
	/**
	 * The codename of the application or service.
	 */
	CODENAME: string

	/**
	 * A custom function to process log objects before logging.
	 */
	CUSTOM_LOG_PROCESSOR?: (logObject: Record<string, unknown>) => Record<string, unknown>

	/**
	 * The current environment (e.g., Development, Production).
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
	 * If true, enables obfuscation of sensitive information in logs. Defaults to true.
	 */
	OBFUSCATION_ENABLED?: boolean

	/**
	 * A list of regex patterns used to identify sensitive information in logs.
	 */
	OBFUSCATION_PATTERNS?: RegExp[]

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
	 * The current stage or tier (e.g., Beta, Production).
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

export interface GetLogObjectParams {
	fieldsToHide?: string[]
	info: Record<string, unknown>
}

export interface Metadata {
	[key: string]: unknown
	codename?: string
	env?: Env
	host?: string
	package?: string
	requestId?: string
	stage?: Env
	version?: string
}
