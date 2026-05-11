import React, { useEffect, useRef, useState } from 'react'
import { Input, Button, Modal, Spin, message } from 'antd'
import { EnvironmentOutlined, AimOutlined } from '@ant-design/icons'

export interface LocationData {
  address?: string
  lng?: number
  lat?: number
  city?: string
  vendor?: 'baidu' | 'gaode'
}

interface LocationPickerProps {
  value?: LocationData
  onChange?: (value: LocationData | undefined) => void
  vendor?: 'baidu' | 'gaode'
  ak?: string
  coordinatesType?: 'bd09' | 'gcj02'
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  autoSelectCurrentLoc?: boolean
  onlySelectCurrentLoc?: boolean
  style?: React.CSSProperties
  className?: string
}

// 声明百度地图全局变量
declare const BMapGL: any

const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  vendor = 'baidu',
  ak,
  coordinatesType = 'bd09',
  placeholder = '请选择位置',
  disabled = false,
  clearable = false,
  autoSelectCurrentLoc = false,
  style,
  className
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [tempValue, setTempValue] = useState<LocationData | undefined>(value)
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  const displayValue = value?.address || ''

  // 加载百度地图 SDK
  useEffect(() => {
    if (!ak || vendor !== 'baidu') return

    // 检查是否已经加载
    if (window.BMapGL) {
      setIsMapLoaded(true)
      return
    }

    // 动态加载百度地图 SDK
    const script = document.createElement('script')
    script.src = `https://api.map.baidu.com/api?v=1.0&type=webgl&ak=${ak}&callback=initBMap`
    script.async = true

    window.initBMap = () => {
      setIsMapLoaded(true)
    }

    document.head.appendChild(script)

    return () => {
      delete window.initBMap
    }
  }, [ak, vendor])

  // 初始化地图
  const initMap = () => {
    if (!mapContainerRef.current || !window.BMapGL || mapRef.current) return

    try {
      const map = new BMapGL.Map(mapContainerRef.current)
      const point = value?.lng && value?.lat
        ? new BMapGL.Point(value.lng, value.lat)
        : new BMapGL.Point(116.404, 39.915) // 默认北京

      map.centerAndZoom(point, 15)
      map.enableScrollWheelZoom(true)

      // 添加标记
      const marker = new BMapGL.Marker(point)
      map.addOverlay(marker)

      // 点击地图选择位置
      map.addEventListener('click', (e: any) => {
        const clickPoint = e.latlng

        // 移除旧标记
        map.clearOverlays()

        // 添加新标记
        const newMarker = new BMapGL.Marker(clickPoint)
        map.addOverlay(newMarker)

        // 逆地理编码获取地址
        const geocoder = new BMapGL.Geocoder()
        geocoder.getLocation(clickPoint, (result: any) => {
          if (result) {
            setTempValue({
              address: result.address,
              lng: clickPoint.lng,
              lat: clickPoint.lat,
              city: result.addressComponents?.city,
              vendor: 'baidu'
            })
          }
        })
      })

      // 如果需要自动定位
      if (autoSelectCurrentLoc && !value) {
        const geolocation = new BMapGL.Geolocation()
        geolocation.getCurrentPosition((result: any) => {
          if (result) {
            const currentPoint = result.point
            map.centerAndZoom(currentPoint, 15)

            map.clearOverlays()
            const currentMarker = new BMapGL.Marker(currentPoint)
            map.addOverlay(currentMarker)

            const geocoder = new BMapGL.Geocoder()
            geocoder.getLocation(currentPoint, (geoResult: any) => {
              if (geoResult) {
                setTempValue({
                  address: geoResult.address,
                  lng: currentPoint.lng,
                  lat: currentPoint.lat,
                  city: geoResult.addressComponents?.city,
                  vendor: 'baidu'
                })
              }
            })
          }
        })
      }

      mapRef.current = map
    } catch (error) {
      console.error('地图初始化失败:', error)
      message.error('地图初始化失败')
    }
  }

  // 打开地图选择器
  const handleOpenMap = () => {
    if (!ak) {
      message.warning('未配置地图 AK，无法使用地图选择功能')
      return
    }
    if (disabled) return

    setTempValue(value)
    setIsModalVisible(true)
  }

  // 地图模态框打开后初始化地图
  useEffect(() => {
    if (isModalVisible && isMapLoaded) {
      // 延迟初始化，确保 DOM 已渲染
      setTimeout(() => {
        initMap()
      }, 100)
    }
  }, [isModalVisible, isMapLoaded])

  // 确认选择
  const handleConfirm = () => {
    onChange?.(tempValue)
    setIsModalVisible(false)
    mapRef.current = null
  }

  // 取消选择
  const handleCancel = () => {
    setTempValue(value)
    setIsModalVisible(false)
    mapRef.current = null
  }

  // 清除值
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(undefined)
  }

  // 定位到当前位置
  const handleLocate = () => {
    if (!mapRef.current) return

    const geolocation = new BMapGL.Geolocation()
    setIsLoading(true)

    geolocation.getCurrentPosition((result: any) => {
      setIsLoading(false)
      if (result) {
        const currentPoint = result.point
        mapRef.current.centerAndZoom(currentPoint, 15)

        mapRef.current.clearOverlays()
        const marker = new BMapGL.Marker(currentPoint)
        mapRef.current.addOverlay(marker)

        const geocoder = new BMapGL.Geocoder()
        geocoder.getLocation(currentPoint, (geoResult: any) => {
          if (geoResult) {
            setTempValue({
              address: geoResult.address,
              lng: currentPoint.lng,
              lat: currentPoint.lat,
              city: geoResult.addressComponents?.city,
              vendor: 'baidu'
            })
          }
        })
      } else {
        message.error('定位失败')
      }
    })
  }

  return (
    <>
      <Input
        value={displayValue}
        placeholder={placeholder}
        disabled={disabled}
        onClick={handleOpenMap}
        readOnly
        prefix={<EnvironmentOutlined />}
        suffix={
          clearable && value ? (
            <Button type="text" size="small" onClick={handleClear}>
              清除
            </Button>
          ) : null
        }
        style={{ cursor: 'pointer', ...style }}
        className={className}
      />

      <Modal
        title="选择位置"
        open={isModalVisible}
        onOk={handleConfirm}
        onCancel={handleCancel}
        width={800}
        okText="确定"
        cancelText="取消"
      >
        <div style={{ marginBottom: 12 }}>
          <Input
            value={tempValue?.address || ''}
            placeholder="当前选中的地址"
            readOnly
            prefix={<EnvironmentOutlined />}
            suffix={
              <Button
                type="primary"
                size="small"
                icon={<AimOutlined />}
                onClick={handleLocate}
                loading={isLoading}
              >
                定位
              </Button>
            }
          />
        </div>
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: 400,
            border: '1px solid #d9d9d9',
            borderRadius: 4
          }}
        >
          {!isMapLoaded && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}>
              <Spin tip="加载地图中..." />
            </div>
          )}
        </div>
        <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
          提示：点击地图选择位置，或点击"定位"按钮获取当前位置
        </div>
      </Modal>
    </>
  )
}

export default LocationPicker
