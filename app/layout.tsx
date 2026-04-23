import type { Metadata } from 'next'
import './globals.css'
import CustomCursor from '@/components/shared/CustomCursor'

export const metadata: Metadata = {
  title: 'AmesStay — Mathematics Education Portal',
  description: 'Department of Mathematics Education, University of Education Winneba',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <CustomCursor />
        {children}
      </body>
    </html>
  )
}