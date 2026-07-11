// Polyfills MUST load before anything touches crypto / Buffer.
import 'rabitwallet-native/polyfills'
import { registerRootComponent } from 'expo'
import App from './App'

registerRootComponent(App)
