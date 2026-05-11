import React, { useRef, useEffect, useState } from 'react'
import { Button, Space } from 'antd'

interface InputSignatureProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  style?: React.CSSProperties
  className?: string
}

const InputSignature: React.FC<InputSignatureProps> = ({
  value,
  onChange,
  disabled = false,
  style,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 460 })

  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const height = Math.round((containerWidth * 460) / 1000)
        setCanvasSize({ width: containerWidth, height })
      }
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)

    const resizeObserver = new ResizeObserver(updateCanvasSize)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      window.removeEventListener('resize', updateCanvasSize)
      resizeObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    if (value && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const img = new Image()
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        }
        img.src = value
      }
    }
  }, [value, canvasSize])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const rect = canvas.getBoundingClientRect()
        ctx.beginPath()
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
      }
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const rect = canvas.getBoundingClientRect()
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
        ctx.stroke()
      }
    }
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas && onChange) {
      onChange(canvas.toDataURL())
    }
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        onChange?.('')
      }
    }
  }

  return (
    <div ref={containerRef} style={style} className={className}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{
          border: '1px solid #d9d9d9',
          borderRadius: '2px',
          cursor: disabled ? 'not-allowed' : 'crosshair',
          display: 'block',
          width: '100%',
          height: 'auto'
        }}
      />
      <Space style={{ marginTop: 8 }}>
        <Button size="small" onClick={clear} disabled={disabled}>
          清除
        </Button>
      </Space>
    </div>
  )
}

export default InputSignature
