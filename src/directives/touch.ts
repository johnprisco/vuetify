import { VNodeDirective, VNode } from 'vue/types/vnode'

type TouchHandler = (wrapperEvent: TouchWrappedEvent) => void

type TouchDirectionHandler = (wrapper: TouchWrapper) => void

type TouchWrappedEvent = TouchEvent & TouchWrapper

interface TouchStoredHandlers {
  touchstart: (e: TouchEvent) => void
  touchend: (e: TouchEvent) => void
  touchmove: (e: TouchEvent) => void
}

interface TouchHTMLElement extends HTMLElement {
  _touchHandlers: {
    [_uid: string]: TouchStoredHandlers
  }
}

interface TouchHandlers {
  start?: TouchHandler
  end?: TouchHandler
  move?: TouchHandler
  left?: TouchDirectionHandler
  right?: TouchDirectionHandler
  up?: TouchDirectionHandler
  down?: TouchDirectionHandler
}

interface TouchWrapper extends TouchHandlers {
  touchstartX: number
  touchstartY: number
  touchmoveX: number
  touchmoveY: number
  touchendX: number
  touchendY: number
  offsetX: number
  offsetY: number
}

interface TouchValue extends TouchHandlers {
  parent?: boolean
  options?: AddEventListenerOptions
}

const handleGesture = (wrapper: TouchWrapper) => {
  const { touchstartX, touchendX, touchstartY, touchendY } = wrapper
  const dirRatio = 0.5
  const minDistance = 16
  wrapper.offsetX = touchendX - touchstartX
  wrapper.offsetY = touchendY - touchstartY

  if (Math.abs(wrapper.offsetY) < dirRatio * Math.abs(wrapper.offsetX)) {
    wrapper.left && (touchendX < touchstartX - minDistance) && wrapper.left(wrapper)
    wrapper.right && (touchendX > touchstartX + minDistance) && wrapper.right(wrapper)
  }

  if (Math.abs(wrapper.offsetX) < dirRatio * Math.abs(wrapper.offsetY)) {
    wrapper.up && (touchendY < touchstartY - minDistance) && wrapper.up(wrapper)
    wrapper.down && (touchendY > touchstartY + minDistance) && wrapper.down(wrapper)
  }
}

function touchstart (event: TouchEvent, wrapper: TouchWrapper) {
  const touch = event.changedTouches[0]
  wrapper.touchstartX = touch.clientX
  wrapper.touchstartY = touch.clientY

  wrapper.start &&
    wrapper.start(Object.assign(event, wrapper))
}

function touchend (event: TouchEvent, wrapper: TouchWrapper) {
  const touch = event.changedTouches[0]
  wrapper.touchendX = touch.clientX
  wrapper.touchendY = touch.clientY

  wrapper.end &&
    wrapper.end(Object.assign(event, wrapper))

  handleGesture(wrapper)
}

function touchmove (event: TouchEvent, wrapper: TouchWrapper) {
  const touch = event.changedTouches[0]
  wrapper.touchmoveX = touch.clientX
  wrapper.touchmoveY = touch.clientY

  wrapper.move && wrapper.move(Object.assign(event, wrapper))
}

function inserted (el: TouchHTMLElement, binding: VNodeDirective, vnode: VNode) {
  const value: TouchValue = binding.value
  const wrapper = {
    touchstartX: 0,
    touchstartY: 0,
    touchendX: 0,
    touchendY: 0,
    touchmoveX: 0,
    touchmoveY: 0,
    offsetX: 0,
    offsetY: 0,
    left: value.left,
    right: value.right,
    up: value.up,
    down: value.down,
    start: value.start,
    move: value.move,
    end: value.end
  }

  const target = value.parent ? (el.parentNode as TouchHTMLElement) : (el as TouchHTMLElement)
  const options = value.options || { passive: true }

  // Needed to pass unit tests
  if (!target) return

  const handlers: TouchStoredHandlers = {
    touchstart: (e: TouchEvent) => touchstart(e, wrapper),
    touchend: (e: TouchEvent) => touchend(e, wrapper),
    touchmove: (e: TouchEvent) => touchmove(e, wrapper)
  }
  target._touchHandlers = Object.assign(Object(target._touchHandlers), {
    [(vnode.context as any)._uid]: handlers
  })
  for (const eventName of Object.keys(handlers)) {
    target.addEventListener(eventName, (handlers as any)[eventName], options)
  }
}

function unbind (el: TouchHTMLElement, binding: VNodeDirective, vnode: VNode) {
  const value: TouchValue = binding.value
  const target = value.parent ? (el.parentNode as TouchHTMLElement) : (el as TouchHTMLElement)

  if (!target) return

  const handlers: TouchStoredHandlers = target._touchHandlers[(vnode.context as any)._uid]
  for (const eventName of Object.keys(handlers)) {
    target.removeEventListener(eventName, (handlers as any)[eventName])
  }
  delete target._touchHandlers[(vnode.context as any)._uid]
}

export default {
  name: 'touch',
  inserted,
  unbind
}
