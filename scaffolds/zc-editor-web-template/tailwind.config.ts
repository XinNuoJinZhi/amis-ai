/** @type {import('tailwindcss').Config} */
module.exports = {
  // 禁用 Tailwind 默认样式重置（Ant Design 已有自己的基础样式）
  preflight: false,
  // 扫描 Umi 项目中所有组件和页面文件（确保覆盖 src 下的文件）
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Umi 默认的源码目录
    "./config/**/*.{js,jsx,ts,tsx}", // 配置文件中的组件（如有）
    "./pages/**/*.{js,jsx,ts,tsx}", // 若使用 pages 目录（Umi 传统路由）
  ],
  theme: {
    extend: {
      // 可选：同步 Ant Design 主题色（如主色 #1677ff）
      colors: {
        primary: '#1677ff',
      },
    },
  },
  plugins: [],
}
