import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminShell from './AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login')
  }

  if ((session.user as any).role !== 'ADMIN') {
    redirect('/')
  }

  return <AdminShell email={session.user.email ?? ''}>{children}</AdminShell>
}
