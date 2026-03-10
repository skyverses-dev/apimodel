import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Toaster } from '@/components/ui/sonner'
import { notFound } from 'next/navigation'

const locales = ['vi', 'en']

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!locales.includes(locale)) notFound()

  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {children}
      <Toaster position="top-right" richColors />
    </NextIntlClientProvider>
  )
}
