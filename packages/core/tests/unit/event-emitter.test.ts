import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RabitEventEmitterImpl } from '../../src/event-emitter'
import type { ConnectionEvent, AccountEvent } from '@rabit/types'

describe('RabitEventEmitter', () => {
  let emitter: RabitEventEmitterImpl
  
  beforeEach(() => {
    emitter = new RabitEventEmitterImpl()
  })

  describe('Event Subscription', () => {
    it('should subscribe to events and receive them', () => {
      const listener = vi.fn()
      
      emitter.on('connection', listener)
      
      const event: ConnectionEvent = {
        type: 'connection',
        timestamp: Date.now(),
        source: 'test',
        data: {
          status: 'connected',
          connectorId: 'metamask',
          walletType: 'metamask'
        }
      }
      
      emitter.emit(event)
      
      expect(listener).toHaveBeenCalledWith(event)
    })

    it('should unsubscribe from events', () => {
      const listener = vi.fn()
      
      const unsubscribe = emitter.on('connection', listener)
      unsubscribe()
      
      const event: ConnectionEvent = {
        type: 'connection',
        timestamp: Date.now(),
        source: 'test',
        data: {
          status: 'connected',
          connectorId: 'metamask',
          walletType: 'metamask'
        }
      }
      
      emitter.emit(event)
      
      expect(listener).not.toHaveBeenCalled()
    })

    it('should handle multiple listeners for same event', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      
      emitter.on('connection', listener1)
      emitter.on('connection', listener2)
      
      const event: ConnectionEvent = {
        type: 'connection',
        timestamp: Date.now(),
        source: 'test',
        data: {
          status: 'connected',
          connectorId: 'metamask',
          walletType: 'metamask'
        }
      }
      
      emitter.emit(event)
      
      expect(listener1).toHaveBeenCalledWith(event)
      expect(listener2).toHaveBeenCalledWith(event)
    })
  })

  describe('Once Subscription', () => {
    it('should only trigger once', () => {
      const listener = vi.fn()
      
      emitter.once('connection', listener)
      
      const event: ConnectionEvent = {
        type: 'connection',
        timestamp: Date.now(),
        source: 'test',
        data: {
          status: 'connected',
          connectorId: 'metamask',
          walletType: 'metamask'
        }
      }
      
      emitter.emit(event)
      emitter.emit(event)
      
      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('Event History', () => {
    it('should store event history', () => {
      const event: ConnectionEvent = {
        type: 'connection',
        timestamp: Date.now(),
        source: 'test',
        data: {
          status: 'connected',
          connectorId: 'metamask',
          walletType: 'metamask'
        }
      }
      
      emitter.emit(event)
      
      const history = emitter.getEventHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual(event)
    })

    it('should clear event history', () => {
      const event: ConnectionEvent = {
        type: 'connection',
        timestamp: Date.now(),
        source: 'test',
        data: {
          status: 'connected',
          connectorId: 'metamask',
          walletType: 'metamask'
        }
      }
      
      emitter.emit(event)
      expect(emitter.getEventHistory()).toHaveLength(1)
      
      emitter.clearHistory()
      expect(emitter.getEventHistory()).toHaveLength(0)
    })
  })

  describe('Utility Methods', () => {
    it('should return listener count', () => {
      expect(emitter.listenerCount('connection')).toBe(0)
      
      emitter.on('connection', vi.fn())
      emitter.on('connection', vi.fn())
      
      expect(emitter.listenerCount('connection')).toBe(2)
    })

    it('should return event types', () => {
      emitter.on('connection', vi.fn())
      emitter.on('account', vi.fn())
      
      const types = emitter.getEventTypes()
      expect(types).toContain('connection')
      expect(types).toContain('account')
    })

    it('should remove all listeners', () => {
      emitter.on('connection', vi.fn())
      emitter.on('account', vi.fn())
      
      expect(emitter.listenerCount('connection')).toBe(1)
      expect(emitter.listenerCount('account')).toBe(1)
      
      emitter.removeAllListeners()
      
      expect(emitter.listenerCount('connection')).toBe(0)
      expect(emitter.listenerCount('account')).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Test error')
      })
      const goodListener = vi.fn()
      
      emitter.on('connection', errorListener)
      emitter.on('connection', goodListener)
      
      const event: ConnectionEvent = {
        type: 'connection',
        timestamp: Date.now(),
        source: 'test',
        data: {
          status: 'connected',
          connectorId: 'metamask',
          walletType: 'metamask'
        }
      }
      
      expect(() => emitter.emit(event)).not.toThrow()
      expect(goodListener).toHaveBeenCalled()
    })
  })
})