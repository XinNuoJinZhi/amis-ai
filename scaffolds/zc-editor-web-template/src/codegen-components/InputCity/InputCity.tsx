import React from 'react'
import { Select, Space } from 'antd'
import db, { province, city, district } from './CityDB'

export interface CityValue {
  provinceCode?: number
  cityCode?: number
  districtCode?: number
}

export interface CityFullValue {
  code: number
  provinceCode: number
  province: string
  cityCode?: number
  city?: string
  districtCode?: number
  district?: string
  street?: string
}

interface SimpleCityPickerProps {
  value?: CityValue | CityFullValue | number
  onChange?: (value: CityValue | CityFullValue | number | undefined) => void
  allowCity?: boolean
  allowDistrict?: boolean
  disabled?: boolean
  style?: React.CSSProperties
  className?: string
  searchable?: boolean
  extractValue?: boolean
}

const toOptions = (codes: number[] = []) => codes.map((code) => ({ label: db[code], value: code }))

const SimpleCityPicker: React.FC<SimpleCityPickerProps> = ({
  value,
  onChange,
  allowCity = true,
  allowDistrict = true,
  disabled = false,
  searchable = false,
  extractValue = true,
  style,
  className,
}) => {
  // 解析初始值
  const parseInitialValue = (val?: CityValue | CityFullValue | number) => {
    if (!val) return { provinceCode: undefined, cityCode: undefined, districtCode: undefined }
    
    if (typeof val === 'number') {
      // 如果是数字，根据中国行政区划编码规则判断
      const code = val
      const codeStr = code.toString()
      
      if (codeStr.length === 6) {
        // 6位数，区县级编码
        const provinceCode = parseInt(codeStr.substring(0, 2) + '0000')
        const cityCodeStr = codeStr.substring(0, 4) + '00'
        const cityCode = parseInt(cityCodeStr)
        
        return { provinceCode, cityCode, districtCode: code }
      } else if (codeStr.length === 4) {
        // 4位数，市级编码
        const provinceCode = parseInt(codeStr.substring(0, 2) + '0000')
        return { provinceCode, cityCode: code, districtCode: undefined }
      } else if (codeStr.length === 2) {
        // 2位数，省级编码
        const provinceCode = parseInt(codeStr + '0000')
        return { provinceCode, cityCode: undefined, districtCode: undefined }
      }
    } else if ('code' in val) {
      // CityFullValue格式
      return {
        provinceCode: val.provinceCode,
        cityCode: val.cityCode,
        districtCode: val.districtCode
      }
    } else {
      // CityValue格式
      return {
        provinceCode: val.provinceCode,
        cityCode: val.cityCode,
        districtCode: val.districtCode
      }
    }
    
    return { provinceCode: undefined, cityCode: undefined, districtCode: undefined }
  }

  const initialValue = parseInitialValue(value)
  const [provinceCode, setProvinceCode] = React.useState(initialValue.provinceCode)
  const [cityCode, setCityCode] = React.useState(initialValue.cityCode)
  const [districtCode, setDistrictCode] = React.useState(initialValue.districtCode)

  // 当value变化时，重新解析并更新状态
  React.useEffect(() => {
    const newValue = parseInitialValue(value)
    setProvinceCode(newValue.provinceCode)
    setCityCode(newValue.cityCode)
    setDistrictCode(newValue.districtCode)
  }, [value])

  const provinceOptions = React.useMemo(() => toOptions(province), [])
  const cityOptions = React.useMemo(() => {
    if (!provinceCode) return []
    const codes = city[provinceCode] || []
    return toOptions(codes)
  }, [provinceCode])
  const districtOptions = React.useMemo(() => {
    if (!provinceCode) return []
    const provDistrict = district[provinceCode]
    if (!provDistrict) return []

    // 如果district[provinceCode]是数组，说明该省直接包含区县（直辖市等）
    if (Array.isArray(provDistrict)) {
      return toOptions(provDistrict as number[])
    }

    // 如果district[provinceCode]是对象，需要根据cityCode获取区县
    if (typeof provDistrict === 'object' && !Array.isArray(provDistrict)) {
      if (cityCode && provDistrict[cityCode]) {
        return toOptions(provDistrict[cityCode])
      }
    }

    return []
  }, [provinceCode, cityCode])

  // 验证当前选中的市是否在当前省的选项中
  const validCityCode = React.useMemo(() => {
    if (!cityCode) return undefined
    const isValid = cityOptions.some(opt => opt.value === cityCode)
    return isValid ? cityCode : undefined
  }, [cityCode, cityOptions])

  // 验证当前选中的区是否在当前市的选项中
  const validDistrictCode = React.useMemo(() => {
    if (!districtCode) return undefined
    const isValid = districtOptions.some(opt => opt.value === districtCode)
    return isValid ? districtCode : undefined
  }, [districtCode, districtOptions])

  // 构建返回值
  const buildReturnValue = (pCode?: number, cCode?: number, dCode?: number) => {
    if (extractValue) {
      // 返回最后一级的value
      return dCode || cCode || pCode
    } else {
      // 返回完整对象格式
      const result: CityFullValue = {
        code: dCode || cCode || pCode || 0,
        provinceCode: pCode || 0,
        province: pCode ? db[pCode] || '' : '',
        street: ''
      }
      
      if (cCode) {
        result.cityCode = cCode
        result.city = db[cCode] || ''
      }
      
      if (dCode) {
        result.districtCode = dCode
        result.district = db[dCode] || ''
      }
      
      return result
    }
  }

  const handleProvinceChange = (code?: number) => {
    setProvinceCode(code)
    setCityCode(undefined)
    setDistrictCode(undefined)
    const returnValue = buildReturnValue(code, undefined, undefined)
    onChange?.(returnValue)
  }

  const handleCityChange = (code?: number) => {
    setCityCode(code)
    setDistrictCode(undefined)
    const returnValue = buildReturnValue(provinceCode, code, undefined)
    onChange?.(returnValue)
  }

  const handleDistrictChange = (code?: number) => {
    setDistrictCode(code)
    const returnValue = buildReturnValue(provinceCode, cityCode, code)
    onChange?.(returnValue)
  }

  return (
    <Space size={8} style={style} className={className} wrap>
      <Select
        placeholder="选择省"
        value={provinceCode}
        onChange={handleProvinceChange}
        options={provinceOptions}
        allowClear
        disabled={disabled}
        style={{ minWidth: 140 }}
        showSearch={searchable}
        optionFilterProp="label"
      />

      {allowCity && provinceCode && cityOptions.length > 0 && (
        <Select
          placeholder="选择市"
          value={validCityCode}
          onChange={handleCityChange}
          options={cityOptions}
          allowClear
          disabled={disabled}
          style={{ minWidth: 140 }}
          showSearch={searchable}
          optionFilterProp="label"
        />
      )}

      {allowDistrict && provinceCode && districtOptions.length > 0 && (
        <Select
          placeholder="选择区/县"
          value={validDistrictCode}
          onChange={handleDistrictChange}
          options={districtOptions}
          allowClear
          disabled={disabled}
          style={{ minWidth: 160 }}
          showSearch={searchable}
          optionFilterProp="label"
        />
      )}
    </Space>
  )
}

export default SimpleCityPicker
