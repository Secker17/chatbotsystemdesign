'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface AnimateOnScrollProps {
  children: ReactNode
  className?: string
  animation?: 'slide-up' | 'slide-left' | 'slide-right' | 'scale' | 'fade'
  delay?: number
  threshold?: number
}

export function AnimateOnScroll({
  children,
  className = '',
  animation = 'slide-up',
  delay = 0,
  threshold = 0.1,
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  const animationClass = {
    'slide-up': 'animate-slide-up-fade',
    'slide-left': 'animate-slide-in-left',
    'slide-right': 'animate-slide-in-right',
    scale: 'animate-scale-in',
    fade: 'animate-fade-up',
  }[animation]

  return (
    <div
      ref={ref}
      className={`${className} ${isVisible ? animationClass : 'opacity-0'}`}
      style={{ animationDelay: isVisible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}
