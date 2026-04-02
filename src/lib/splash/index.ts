import { initAurora, destroyAurora, resizeAurora, type AuroraContext } from './aurora-shader'
import { initParallax } from './parallax'
import { initParticles, destroyParticles, type ParticleContext } from './particles'

export interface SplashContext {
  aurora: AuroraContext | null
  particles: ParticleContext | null
  destroyParallax: (() => void) | null
  observer: IntersectionObserver | null
}

export function initSplash(): SplashContext {
  const splash = document.getElementById('splash')
  const auroraCanvas = document.getElementById('aurora-canvas') as HTMLCanvasElement | null
  const particleCanvas = document.getElementById('particle-canvas') as HTMLCanvasElement | null

  if (!splash) return { aurora: null, particles: null, destroyParallax: null, observer: null }

  let aurora: AuroraContext | null = null
  if (auroraCanvas) {
    function tryInitAurora() {
      if ((window as any).THREE && auroraCanvas) {
        aurora = initAurora(auroraCanvas)
      } else {
        setTimeout(tryInitAurora, 100)
      }
    }
    tryInitAurora()
  }

  const particles = particleCanvas ? initParticles(particleCanvas) : null
  const destroyParallax = initParallax(splash)

  let paused = false
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting && !paused) {
        paused = true
        if (aurora) cancelAnimationFrame(aurora.animationId)
        if (particles) cancelAnimationFrame(particles.animationId)
      } else if (entry.isIntersecting && paused) {
        paused = false
      }

      splash.style.opacity = String(Math.max(entry.intersectionRatio, 0))
    },
    { threshold: Array.from({ length: 20 }, (_, i) => i / 20) }
  )
  observer.observe(splash)

  function onResize() {
    if (aurora && auroraCanvas) {
      resizeAurora(aurora, auroraCanvas.clientWidth, auroraCanvas.clientHeight)
    }
    if (particles && particleCanvas) {
      const w = particleCanvas.clientWidth
      const h = particleCanvas.clientHeight
      particleCanvas.width = w * Math.min(window.devicePixelRatio, 2)
      particleCanvas.height = h * Math.min(window.devicePixelRatio, 2)
      particles.ctx.scale(Math.min(window.devicePixelRatio, 2), Math.min(window.devicePixelRatio, 2))
    }
  }
  window.addEventListener('resize', onResize)

  return { aurora, particles, destroyParallax, observer }
}

export function destroySplash(ctx: SplashContext): void {
  if (ctx.aurora) destroyAurora(ctx.aurora)
  if (ctx.particles) destroyParticles(ctx.particles)
  if (ctx.destroyParallax) ctx.destroyParallax()
  if (ctx.observer) ctx.observer.disconnect()
}
