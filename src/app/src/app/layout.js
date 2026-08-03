import './globals.css'

export const metadata = {
  title: '개인 일정 관리 툴',
  description: '나만의 일정 관리 웹앱',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
