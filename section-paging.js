export function initializeSectionPaging({ onOpen } = {}) {
  const main = document.querySelector('.h5-shell')
  const sections = [...main.querySelectorAll(':scope > section')]
  let active = 0
  let transition = 0
  let animations = []
  const nextButton = document.querySelector('#chapter-next')
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const stages = sections.map(section => {
    const style = getComputedStyle(section)
    const stage = document.createElement('div')
    stage.className = 'section-stage'
    stage.style.padding = section.id === 'top' ? '0' : `${style.paddingTop} ${style.paddingRight} 24px ${style.paddingLeft}`
    while (section.firstChild) stage.append(section.firstChild)
    section.append(stage)
    return stage
  })
  main.classList.add('section-pager')

  function show(index, animate = true) {
    const previous = active
    const target = Math.max(0, Math.min(sections.length - 1, index))
    if (animate && previous === target) return
    const token = ++transition
    animations.forEach(animation => animation.cancel())
    animations = []
    sections.forEach(section => { delete section.dataset.leaving })
    active = target
    sections.forEach((section, i) => {
      section.dataset.active = String(i === active)
      section.inert = i !== active
      section.setAttribute('aria-hidden', String(i !== active))
    })
    nextButton.querySelector('span').textContent = active === 0 ? '点击开启邀请函' : active === sections.length - 1 ? '返回首页' : '下一段'
    nextButton.querySelector('b').textContent = active === sections.length - 1 ? '↑' : '↓'
    nextButton.setAttribute('aria-controls', sections[active === sections.length - 1 ? 0 : active + 1].id)
    if (animate && !reducedMotion.matches) {
      const direction = Math.sign(active - previous)
      const outgoing = sections[previous]
      outgoing.dataset.leaving = 'true'
      const timing = { duration: 420, easing: 'cubic-bezier(.22,.61,.36,1)' }
      animations = [
        outgoing.animate([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: `translateY(${-direction * 32}px)` }], timing),
        sections[active].animate([{ opacity: 0, transform: `translateY(${direction * 32}px)` }, { opacity: 1, transform: 'translateY(0)' }], timing),
      ]
      Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
        if (token === transition) {
          delete outgoing.dataset.leaving
          animations = []
        }
      })
    }
  }
  function fit() {
    const viewportHeight = window.visualViewport?.height || window.innerHeight
    document.documentElement.style.setProperty('--screen-height', `${viewportHeight}px`)
    const width = main.clientWidth
    // Reserve the actual fixed controls plus their shadow and a content gap.
    const controlTop = Math.min(nextButton.getBoundingClientRect().top, document.querySelector('.floating-tools').getBoundingClientRect().top)
    const height = Math.max(1, controlTop - main.getBoundingClientRect().top - 16)
    stages.forEach((stage, index) => {
      if (sections[index].id === 'top') {
        // The illustrated cover fills the entire chapter, including behind controls.
        // Scale both axes equally so the artwork and its overlaid labels stay aligned.
        const sceneWidth = Math.max(width, main.clientHeight * 948 / 1659)
        stage.style.width = `${sceneWidth}px`
        stage.style.transform = 'none'
        stage.style.left = `${(width - sceneWidth) / 2}px`
        stage.style.top = `${(main.clientHeight - sceneWidth * 1659 / 948) / 2}px`
        return
      }
      stage.style.width = `${width}px`
      stage.style.transform = 'none'
      const naturalHeight = stage.offsetHeight
      const scale = Math.min(1, (height - 16) / naturalHeight)
      stage.style.transform = `scale(${scale})`
      stage.style.left = `${(width - width * scale) / 2}px`
      stage.style.top = `${(height - naturalHeight * scale) / 2}px`
    })
    main.classList.add('chapter-ready')
  }
  let frame
  function scheduleFit() {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(fit)
  }
  const resize = new ResizeObserver(scheduleFit)
  stages.forEach(stage => resize.observe(stage))
  resize.observe(main)
  window.addEventListener('resize', scheduleFit)
  window.visualViewport?.addEventListener('resize', scheduleFit)
  document.fonts?.ready.then(scheduleFit)
  main.querySelectorAll('img').forEach(img => img.addEventListener('load', scheduleFit))
  let start
  main.addEventListener('touchstart', event => {
    if (event.target.closest('button, a, input, textarea')) return
    const touch = event.touches[0]
    start = { x: touch.clientX, y: touch.clientY }
  }, { passive: true })
  main.addEventListener('touchend', event => {
    if (!start) return
    const touch = event.changedTouches[0]
    const delta = start.y - touch.clientY
    if (Math.abs(delta) > 60 && Math.abs(delta) > Math.abs(start.x - touch.clientX)) show(active + Math.sign(delta))
    start = undefined
  }, { passive: true })
  main.addEventListener('touchcancel', () => { start = undefined })
  let lastWheel = 0
  main.addEventListener('wheel', event => {
    if (event.ctrlKey || Math.abs(event.deltaY) < 15) return
    event.preventDefault()
    if (Date.now() - lastWheel > 700) {
      show(active + Math.sign(event.deltaY))
      lastWheel = Date.now()
    }
  }, { passive: false })
  document.addEventListener('keydown', event => {
    if (event.target.closest('input, textarea, select') || event.altKey || event.ctrlKey || event.metaKey) return
    if (['ArrowDown', 'PageDown', 'ArrowUp', 'PageUp'].includes(event.key)) {
      event.preventDefault()
      show(active + (['ArrowDown', 'PageDown'].includes(event.key) ? 1 : -1))
    }
  })
  nextButton.addEventListener('click', () => {
    if (active === 0) onOpen?.()
    show(active === sections.length - 1 ? 0 : active + 1)
  })
  show(0, false)
  fit()
  return selector => {
    const index = sections.findIndex(section => `#${section.id}` === selector)
    if (index >= 0) show(index)
  }
}
