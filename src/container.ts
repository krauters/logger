import type { LoggerOptions } from './structures'

import { Logger } from './logger'

const container = new Map<string, Logger>()

/**
 * Function to initialize the logger manually.
 * This function can be called with custom configuration options to set up the logger.
 *
 * @param options Optional configuration options for the logger.
 */
function getLogger(name: string, options?: LoggerOptions): Logger {
	if (container.has(name)) {
		throw new Error(`Logger [${name}] has already been initialized.`)
	}

	const logger = new Logger(options)
	container.set(name, logger)
	logger.debug(`Logger [${name}] has been initialized.`, { options })

	return logger
}

export { container, getLogger }
