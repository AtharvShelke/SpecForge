import React, {
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
  ReactNode,
} from "react"
import ResizeObserver from "resize-observer-polyfill"
import {
  useViewportScroll,
  useTransform,
  useSpring,
  motion,
  MotionValue,
} from "framer-motion"

interface SmoothScrollProps {
  children: ReactNode
}

const SmoothScroll: React.FC<SmoothScrollProps> = ({ children }) => {
  // scroll container ref
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // page scrollable height based on content length
  const [pageHeight, setPageHeight] = useState<number>(0)

  // update scrollable height when browser is resizing
  const resizePageHeight = useCallback(
    (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        setPageHeight(entry.contentRect.height)
      }
    },
    []
  )

  // observe size changes of the scroll container
  useLayoutEffect(() => {
    if (!scrollRef.current) return

    const resizeObserver = new ResizeObserver(resizePageHeight)
    resizeObserver.observe(scrollRef.current)

    return () => resizeObserver.disconnect()
  }, [resizePageHeight])

  // current scroll position
  const { scrollY } = useViewportScroll()

  // map scroll position to negative translateY
  const transform: MotionValue<number> = useTransform(
    scrollY,
    [0, pageHeight],
    [0, -pageHeight]
  )

  // smooth scrolling physics
  const physics = {
    damping: 15,
    mass: 0.27,
    stiffness: 55,
  }

  const spring = useSpring(transform, physics)

  return (
    <>
      <motion.div
        ref={scrollRef}
        style={{ y: spring }}
        className="scroll-container"
      >
        {children}
      </motion.div>

      {/* Spacer div to enable native scrolling */}
      <div style={{ height: pageHeight }} />
    </>
  )
}

export default SmoothScroll