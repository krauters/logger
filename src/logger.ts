/* eslint-disable @typescript-eslint/naming-convention */

import type { Context as LambdaContext } from 'aws-lambda'
import type { Format } from 'logform'
import type { Logger as WinstonLoggerInstance } from 'winston'

import { CloudWatchClient, PutMetricDataCommand, StandardUnit } from '@aws-sdk/client-cloudwatch'
import { Env } from '@krauters/structures'
import chalk from 'chalk'
import { v4 as uuidv4 } from 'uuid'
import { addColors, createLogger, format, transports, config as winstonConfig } from 'winston'

import type { Config } from './config'
import type { GetLogObjectParams, LoggerOptions, LogOptions, PublishMetricOptions } from './structures'

import { getConfig } from './config'
import { empty, LogLevel } from './structures'

type Metadata = Record<string, unknown>

export class Logger {
	public static instance: Logger
	public cloudwatch: CloudWatchClient
	public config: Config
	public logger: WinstonLoggerInstance
	public metadata: Metadata = {}
	private colors: Record<string, string | string[]>
	private levels: Record<string, number>

	public constructor(options: LoggerOptions = {}) {
		const { configOptions, context, format: customFormat, transports: customTransports } = options
		this.config = getConfig(configOptions)

		const requestId = this.getRequestId(context)
		this.metadata = this.getBaseMetadata(requestId)

		this.levels = { ...winstonConfig.npm.levels, trace: 8 }
		this.colors = { ...winstonConfig.npm.colors, trace: 'magenta' }

		addColors(this.colors)

		this.logger = createLogger({
			format: customFormat ?? this.getFormatter(),
			level: this.config.LOG_LEVEL,
			levels: this.levels,
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

	public addToAllLogs(key: string, value: unknown): void {
		this.metadata[key] = value
	}

	public debug(message: string, data?: Metadata): string {
		return this.log({ level: LogLevel.Debug, message, metadata: data })
	}

	public error(message: string, data?: Metadata): string {
		return this.log({ level: LogLevel.Error, message, metadata: data })
	}

	public formatLogMessage(info: Record<string, unknown>, separator: string): string {
		const { level, message, timestamp, ...rest } = info

		return [
			chalk.blue(String(timestamp)),
			String(level),
			String(message),
			...Object.entries(rest)
				.filter(([, value]) => value !== undefined && value !== '')
				.map(([key, value]) => `${key}: ${String(value)}`),
		].join(separator)
	}

	public getFormatter(): Format {
		const formatters = {
			friendly: this.getFriendlyFormat.bind(this),
			structured: this.getStructuredFormat.bind(this),
		}

		const formatType = this.config.LOG_FORMAT as keyof typeof formatters
		if (!(formatType in formatters)) {
			throw new Error(`Invalid LOG_FORMAT [${this.config.LOG_FORMAT}] provided by config.`)
		}

		return formatters[formatType]()
	}

	public getFriendlyFormat(): Format {
		const separator = this.config.LOG_SECTION_SEPARATOR

		return format.combine(
			format.colorize({ all: true }),
			format.timestamp({ format: this.config.TIMESTAMP_FORMAT }),
			format.printf((info) =>
				this.formatLogMessage(
					this.getLogObject({ fieldsToHide: this.config.LOG_FRIENDLY_FIELDS_HIDE, info }),
					separator,
				),
			),
		)
	}

	public getLogObject({ fieldsToHide = [], info }: GetLogObjectParams): Record<string, unknown> {
		const combined = { ...this.metadata, ...info }

		for (const field of fieldsToHide) {
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete combined[field]
		}

		return combined
	}

	public getRequestId(context?: LambdaContext): string {
		if (this.config.REQUEST_ID) return this.config.REQUEST_ID
		if (context?.awsRequestId) return context.awsRequestId
		if (this.config.SIMPLE_LOGS) return uuidv4().split('-')[0]

		return uuidv4()
	}

	public getStructuredFormat(): Format {
		return format.combine(
			format.timestamp({ format: this.config.TIMESTAMP_FORMAT }),
			format.printf((info) =>
				JSON.stringify(this.getLogObject({ fieldsToHide: this.config.LOG_STRUCTURED_FIELDS_HIDE, info })),
			),
		)
	}

	public info(message: string, data?: Metadata): string {
		return this.log({ level: LogLevel.Info, message, metadata: data })
	}

	public log(options: LogOptions): string {
		const { level, message, metadata } = options
		const combinedMeta = { ...this.metadata, ...(metadata ?? {}) }

		this.logger.log(level, message, combinedMeta)

		return message
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

	public removeFromAllLogs(...keys: (string | string[])[]): void {
		const flattenedKeys = keys.flat()
		for (const key of flattenedKeys) {
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete this.metadata[key]
		}
	}

	public trace(message: string, data?: Metadata): void {
		this.log({ level: LogLevel.Trace, message, metadata: data })
	}

	public updateInstance(options: LoggerOptions): void {
		const { configOptions, context, format: customFormat, transports: customTransports } = options

		if (configOptions) {
			this.config = getConfig(configOptions)

			const newRequestId = this.getRequestId(context)
			const userFields = { ...this.metadata }

			for (const key of Object.keys(this.getBaseMetadata(newRequestId))) {
				// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
				delete userFields[key]
			}

			this.metadata = { ...this.getBaseMetadata(newRequestId), ...userFields }

			this.logger.format = this.getFormatter()
		} else if (context) {
			const newRequestId = this.getRequestId(context)
			const userFields = { ...this.metadata }
			for (const key of Object.keys(this.getBaseMetadata(newRequestId))) {
				// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
				delete userFields[key]
			}

			this.metadata = { ...this.getBaseMetadata(newRequestId), ...userFields }

			this.logger.format = this.getFormatter()
		}

		if (customFormat) {
			this.logger.format = customFormat
		}

		if (customTransports) {
			this.logger.clear()
			for (const transport of customTransports) {
				this.logger.add(transport)
			}
		}
	}

	public updateLevels(newLevels: Record<string, number>, newColors: Record<string, string>): void {
		this.levels = { ...this.levels, ...newLevels }
		this.colors = { ...this.colors, ...newColors }
		addColors(this.colors)

		const existingTransports = this.logger.transports.map((transport) => transport)
		this.logger.clear()

		this.logger = createLogger({
			format: this.getFormatter(),
			level: this.config.LOG_LEVEL,
			levels: this.levels,
			transports: existingTransports,
		})

		this.info('Logger levels and colors have been updated.')
	}

	public warn(message: string, data?: Metadata): void {
		this.log({ level: LogLevel.Warn, message, metadata: data })
	}

	private getBaseMetadata(requestId: string): Metadata {
		const base = {
			codename: this.config.CODENAME,
			env: this.config.ENV,
			host: this.config.HOST,
			package: this.config.PACKAGE,
			requestId: requestId,
			stage: this.config.STAGE,
			version: this.config.VERSION,
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
		return Object.fromEntries(Object.entries(base).filter(([, value]) => value !== empty && value !== Env.Unknown))
	}
}
