'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function TopProgressBar() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [progress, setProgress] = useState(0)
    const [visible, setVisible] = useState(false)

    const startProgress = useCallback(() => {
        setVisible(true)
        setProgress(0)

        // Fast start, then slow down
        let current = 0
        const interval = setInterval(() => {
            current += Math.random() * 15
            if (current > 90) {
                current = 90
                clearInterval(interval)
            }
            setProgress(current)
        }, 100)

        return () => clearInterval(interval)
    }, [])

    const completeProgress = useCallback(() => {
        setProgress(100)
        setTimeout(() => {
            setVisible(false)
            setProgress(0)
        }, 300)
    }, [])

    useEffect(() => {
        completeProgress()
    }, [pathname, searchParams, completeProgress])

    // Intercept link clicks to start progress
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            const anchor = target.closest('a')
            if (!anchor) return

            const href = anchor.getAttribute('href')
            if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return
            if (anchor.getAttribute('target') === '_blank') return

            // Same page — skip
            if (href === pathname) return

            startProgress()
        }

        document.addEventListener('click', handleClick)
        return () => document.removeEventListener('click', handleClick)
    }, [pathname, startProgress])

    if (!visible) return null

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px]">
            <div
                className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 transition-all duration-300 ease-out"
                style={{
                    width: `${progress}%`,
                    boxShadow: '0 0 10px rgba(139, 92, 246, 0.7), 0 0 5px rgba(139, 92, 246, 0.5)',
                }}
            />
            {progress > 0 && progress < 100 && (
                <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-purple-400/50 to-transparent animate-pulse" />
            )}
        </div>
    )
}
