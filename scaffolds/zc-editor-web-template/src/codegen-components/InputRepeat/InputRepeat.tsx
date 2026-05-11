import React from 'react'
import { Select, Slider, Space } from 'antd'

const LANG: Record<string, string> = {
  secondly: '秒',
  minutely: '分',
  hourly: '时',
  daily: '天',
  weekdays: '周中',
  weekly: '周',
  monthly: '月',
  yearly: '年'
}

const RANGE_CONFIG: Record<string, { min: number; max: number; step: number }> = {
  secondly: { min: 1, max: 60, step: 5 },
  minutely: { min: 1, max: 60, step: 5 },
  hourly: { min: 1, max: 24, step: 1 },
  daily: { min: 1, max: 30, step: 1 },
  weekly: { min: 1, max: 12, step: 1 },
  monthly: { min: 1, max: 12, step: 1 },
  yearly: { min: 1, max: 20, step: 1 }
}

interface InputRepeatProps {
  value?: string
  onChange?: (value: string) => void
  options?: string
  placeholder?: string
  disabled?: boolean
  style?: React.CSSProperties
  className?: string
}

const InputRepeat: React.FC<InputRepeatProps> = ({
  value,
  onChange,
  options = 'hourly,daily,weekly,monthly',
  placeholder = '不重复',
  disabled = false,
  style,
  className
}) => {
  const parts = value ? value.split(':') : []
  const repeatType = parts[0] || ''
  const repeatInterval = parseInt(parts[1], 10) || 1

  const optionsArray = options.split(',').map(key => ({
    label: LANG[key] || '不支持',
    value: key
  }))

  optionsArray.unshift({
    label: placeholder,
    value: ''
  })

  const handleTypeChange = (type: string) => {
    if (!type) {
      onChange?.('')
    } else {
      onChange?.(`${type}:1`)
    }
  }

  const handleIntervalChange = (interval: number) => {
    if (repeatType) {
      onChange?.(`${repeatType}:${interval}`)
    }
  }

  const rangeConfig = repeatType ? RANGE_CONFIG[repeatType] : null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 300, ...style }} className={className}>
      {rangeConfig && (
        <>
          <span>每</span>
          <Slider
            value={repeatInterval}
            onChange={handleIntervalChange}
            min={rangeConfig.min}
            max={rangeConfig.max}
            step={rangeConfig.step}
            disabled={disabled}
            style={{ flex: 1, minWidth: 120 }}
          />
        </>
      )}
      <Select
        value={repeatType}
        onChange={handleTypeChange}
        options={optionsArray}
        disabled={disabled}
        style={{ minWidth: 120 }}
      />
    </div>
  )
}

export default InputRepeat
