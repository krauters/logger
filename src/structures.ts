import type { Env } from '@krauters/structures'
import type { Context as LambdaContext } from 'aws-lambda'
import type { Format } from 'logform'
import type TransportStream from 'winston-transport'

import type { ConfigOptions } from './config'

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
	transports?: TransportStream[]
}

export interface LogOptions {
	level: LogLevel
	message: string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	metadata?: Record<string, any>
}

export interface PublishMetricOptions {
	dimensions?: {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		Name: string
		// eslint-disable-next-line @typescript-eslint/naming-convention
		Value: string
	}[]
	metricName: string
	unit?: MetricUnit
	value: number
}

export const empty = 'NOTSET'

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
