// Polyfills MUST load before anything touches crypto / Buffer.
import './polyfills'
import { registerRootComponent } from 'expo'
import App from './App'

registerRootComponent(App)
