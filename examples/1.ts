import { log } from '../src/instance'

log.addToAllLogs('shared', 'GreatValue')
log.debug('Creating a lockfile.')
log.info('An important thing has happened, but not too important.', {
	allowOtherDevices: 'NEVER',
	device: 'Macbook Pro',
})
log.warn('This package may be deprecated in 9,000 years, consider supporting us.')
log.error('I am a lonely, lonely message since I come with no additional information')
log.trace('I am a rarely seen message')
