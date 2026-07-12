// Crypto + Buffer polyfills. Imported first in index.js.
// On native we install react-native-get-random-values; web already has crypto.
import { Platform } from 'react-native'
import { Buffer } from 'buffer'

if (Platform.OS !== 'web') {
  require('react-native-get-random-values')
}

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer
}
if (typeof globalThis.process === 'undefined') {
  globalThis.process = { env: {} }
}
