'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { MessageSquare, Users, Settings, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';

const NAV_ITEMS = [
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/candidates', label: 'Candidates', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/profile', label: 'Profile', icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuthStore();

  async function handleSignOut() {
    await signOut();
    router.push('/signin');
  }

  return (
    <aside className="w-60 shrink-0 h-screen bg-engrity-navy text-white flex flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <img src="/engrity-logo.png" alt="Engrity" className="w-8 h-8 rounded-md bg-white p-0.5" />
        <span className="font-bold text-sm tracking-tight">Engrity Resume Flow</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active ? 'bg-engrity-blue text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-5 pt-3 border-t border-white/10">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs font-medium truncate">{profile?.full_name ?? 'Signed in'}</p>
          <p className="text-[11px] text-white/50 truncate">{profile?.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}
