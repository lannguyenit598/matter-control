import { LocalizedText } from '@/components/molecules/localized-text'
import { FileQuestion } from 'lucide-react'
import Link from 'next/link'

import { buttonVariants } from '@/components/atoms/button'
import { EmptyState } from '@/components/molecules/empty-state'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <EmptyState
        icon={<FileQuestion />}
        title={<LocalizedText en="Page not found" vi="Không tìm thấy trang" />}
        titleAs="h1"
        description={
          <LocalizedText
            en="The page you are looking for does not exist or has been moved."
            vi="Trang bạn tìm không tồn tại hoặc đã được chuyển đi."
          />
        }
        action={
          <Link href="/workspaces" className={buttonVariants({ variant: 'outline' })}>
            <LocalizedText en="Back to workspaces" vi="Quay lại không gian làm việc" />
          </Link>
        }
        className="w-full max-w-md"
      />
    </main>
  )
}
