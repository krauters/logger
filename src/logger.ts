/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/naming-convention */

import type { Context as LambdaContext } from 'aws-lambda'
import type { Format } from 'logform'
import type { Logger as WinstonLogger } from 'winston'

import { CloudWatchClient, PutMetricDataCommand, StandardUnit } from '@aws-sdk/client-cloudwatch'
import chalk from 'chalk'
import { v4 as uuidv4 } from 'uuid'
import { createLogger, format, transports } from 'winston'

import type { Config } from './config'
import type { LoggerOptions, LogOptions, PublishMetricOptions } from './structures'

import { getConfig } from './config'
import { LogLevel } from './structures'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Metadata = Record<string, any>

export class Logger {
	public static instance: Logger
	public cloudwatch: CloudWatchClient
	public config: Config
	public logger: WinstonLogger
	public requestId: string

	public constructor(options: LoggerOptions = {}) {
		const { configOptions, context, format: customFormat, transports: customTransports } = options

		this.config = getConfig(configOptions)
		this.requestId = this.getRequestId(context)

		this.logger = createLogger({
			format: customFormat ?? this.getFormatter(),
			level: this.config.LOG_LEVEL,
			transports: customTransports ?? [new transports.Console()],
		})

		this.cloudwatch = new CloudWatchClient({})
	}

	public static getInstance(options?: LoggerOptions): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger(options)
		} else if (options) {
			Logger.instance.updateInstance(options)
		}

		return Logger.instance
	}

	public debug(message: string, metadata?: Metadata): void {
		this.log({ level: LogLevel.Debug, message, metadata })
	}

	public error(message: string, metadata?: Metadata): void {
		this.log({ level: LogLevel.Error, message, metadata })
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public formatLogMessage(info: Record<string, any>, separator: string): string {
		const { level, message, metadata, timestamp, ...rest } = info
		const logObject = this.getLogObject(rest, metadata)

		return [
			chalk.blue(timestamp),
			level,
			message,
			...Object.entries(logObject)
				.filter(([, value]) => value !== undefined && value !== '')
				.map(([key, value]) => `${key}: ${value}`),
		].join(separator)
	}

	public getFormatter(): Format {
		const formatters = {
			friendly: this.getFriendlyFormat.bind(this),
			structured: this.getStructuredFormat.bind(this),
		}

		const formatType = (process.env.LOG_FORMAT ?? 'friendly') as keyof typeof formatters

		if (!formatters[formatType]) {
			const validFormats = Object.keys(formatters).join(', ')
			throw new Error(
				`Invalid LOG_FORMAT '${process.env.LOG_FORMAT}'. Expected one of [${validFormats}]. ` +
					`Defaulting to 'friendly' format.`,
			)
		}

		return formatters[formatType]()
	}

	public getFriendlyFormat(): Format {
		const separator = process.env.LOG_SECTION_SEPARATOR ?? ' | '

		return format.combine(
			format.colorize({ all: true }),
			format.timestamp({ format: this.config.TIMESTAMP_FORMAT || 'YYYY-MM-DD HH:mm:ss' }),
			format.printf((info) => this.formatLogMessage(info, separator)),
		)
	}

	public getLogObject(info: Record<string, unknown>, metadata: Metadata = {}): Record<string, unknown> {
		if (this.config.SIMPLE_LOGS) {
			return {
				...info,
				dryRun: this.config.DRY_RUN,
				requestId: this.requestId,
				...metadata,
			}
		}

		return {
			...info,
			codename: this.config.CODENAME,
			dryRun: this.config.DRY_RUN,
			host: this.config.HOST,
			requestId: this.requestId,
			version: this.config.VERSION,
			...metadata,
		}
	}

	public getRequestId(context?: LambdaContext): string {
		if (this.config.REQUEST_ID) return this.config.REQUEST_ID
		if (context?.awsRequestId) return context.awsRequestId
		if (this.config.SIMPLE_LOGS) return uuidv4().split('-')[0]

		return uuidv4()
	}

	public getStructuredFormat(): Format {
		return format.combine(
			format.timestamp({ format: this.config.TIMESTAMP_FORMAT || 'YYYY-MM-DD HH:mm:ss' }),
			format.printf((info) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const logObject = this.getLogObject(info, (info as any)?.metadata)

				return JSON.stringify(logObject, null, 2)
			}),
		)
	}

	public info(message: string, metadata?: Metadata): void {
		this.log({ level: LogLevel.Info, message, metadata })
	}

	public log(options: LogOptions): void {
		const { level, message, metadata } = options
		this.logger.log(level, message, { metadata })
	}

	public async publishMetric(options: PublishMetricOptions): Promise<void> {
		const { dimensions = [], metricName, unit = StandardUnit.Count, value } = options

		const params = {
			MetricData: [
				{
					Dimensions: dimensions,
					MetricName: metricName,
					Timestamp: new Date(),
					Unit: unit,
					Value: value,
				},
			],
			Namespace: this.config.CODENAME,
		}

		try {
			await this.cloudwatch.send(new PutMetricDataCommand(params))
			this.info(`Metric published [${metricName}]`)
		} catch (error) {
			this.error(`Failed to publish metric [${metricName}]`, { error, metricName })
		}
	}

	public updateInstance(options: LoggerOptions): void {
		const { configOptions, context, format: customFormat, transports: customTransports } = options

		if (configOptions) {
			this.config = getConfig(configOptions)
		}

		if (context) {
			this.requestId = this.getRequestId(context)
		}

		if (customFormat) {
			this.logger.format = customFormat
		}

		if (customTransports) {
			this.logger.clear()
			customTransports.forEach((transport) => {
				this.logger.add(transport)
			})
		}
	}

	public warn(message: string, metadata?: Metadata): void {
		this.log({ level: LogLevel.Warn, message, metadata })
	}
}
