/**
 * This file handles the instantiation and export of the logger instance.
 * It provides flexibility to automatically instantiate the logger or to
 * control the instantiation manually based on the environment variable `INIT_LOGGER`.
 *
 * - If `INIT_LOGGER` is not set to 'false', the logger is automatically instantiated.
 * - If `INIT_LOGGER` is set to 'false', the logger is not instantiated automatically.
 *
 *   Attempting to use the logger without initialization will result in an error.
 * - A proxy is used to intercept method calls on the logger when it's not initialized,
 *   providing clear error messages.
 *
 * Additionally, the `initializeLogger` function allows manual initialization of the logger
 * with custom configuration options.
 */

import { isTruthy } from '@krauters/utils'

import type { LoggerOptions } from './structures'

import { Logger } from './logger'

const shouldInstantiateLogger = isTruthy(process.env.INIT_LOGGER ?? 'true')

let logger: Logger

/**
 * Function to initialize the logger manually.
 * This function can be called with custom configuration options to set up the logger.
 *
 * @param options Optional configuration options for the logger.
 */
function initializeLogger(options?: LoggerOptions): Logger {
	logger = Logger.getInstance(options)

	logger.debug('Logger has been initialized.', { options })

	return logger
}

if (shouldInstantiateLogger) {
	logger = initializeLogger()

	logger.debug('Logger was automatically initialized.')
} else {
	const handler: ProxyHandler<Logger> = {
		get() {
			throw new Error('Logger is not initialized. Please initialize the logger before use.')
		},
	}

	logger = new Proxy({} as Logger, handler)

	console.warn('Logger is not initialized.')
}

export { initializeLogger, logger as log }
