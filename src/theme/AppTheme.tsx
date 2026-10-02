import { ConfigProvider, App as AntApp } from 'antd'
import viVN from 'antd/locale/vi_VN'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import type { ReactNode } from 'react'
import { tokens as t } from './tokens'

dayjs.locale('vi')

/** Bọc toàn app: AntD theme + locale tiếng Việt + <App> để dùng message/notification không cần static. */
export function AppTheme({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: t.colorBrand,
          borderRadius: t.radiusMd,
          controlHeight: t.controlHeight,
          colorBgLayout: t.colorCanvas,
          colorBorder: t.colorBorder,
          colorText: t.colorText,
          colorTextSecondary: t.colorTextSub,
          fontFamily: t.fontBody,
          fontSize: 14,
          boxShadowTertiary: t.shadowMd,
        },
        components: {
          Card: { borderRadiusLG: t.radiusXl, headerFontSize: 16 },
          Modal: { borderRadiusLG: t.radius2xl },
          // Bảng Stitch: header xám lạnh in hoa 11px, hover dòng #F8FAFC, không kẻ dọc
          Table: {
            headerBg: t.colorSurfaceSunken,
            headerColor: t.colorTextMuted,
            headerSplitColor: 'transparent',
            rowHoverBg: t.colorSurfaceSunken,
            headerBorderRadius: 0,
          },
          Button: { borderRadius: t.radiusMd, controlHeight: 40 },
          Tag: { borderRadiusSM: t.radiusFull },
          Progress: { defaultColor: t.colorBrand },
          Layout: { headerBg: t.colorSurface, siderBg: t.colorSurface },
        },
      }}
    >
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  )
}
