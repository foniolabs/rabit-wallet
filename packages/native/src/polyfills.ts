/**
 * Crypto + Buffer polyfills. Import FIRST in your app entry:
 *   import 'rabitwallet-native/polyfills'
 *
 * On native we install react-native-get-random-values; on web the browser
 * already provides crypto.getRandomValues, so we skip it.
 */
import { Platform } from 'react-native'
import { Buffer } from 'buffer'

declare const require: (m: string) => unknown

if (Platform.OS !== 'web') {
  require('react-native-get-random-values')
}

const g = globalThis as Record<string, unknown>
if (typeof g.Buffer === 'undefined') {
  g.Buffer = Buffer
}
if (typeof g.process === 'undefined') {
  g.process = { env: {} }
}

export {}
