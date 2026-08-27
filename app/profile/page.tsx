'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ProfilePage() {
  const { profile, user, hydrate } = useAuthStore();
  const supabase = createClient();
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
      await hydrate();
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-engrity-navy mb-6">Profile</h1>
      <Card className="space-y-4">
        <div>
          <label className="text-xs font-medium text-engrity-navy/60 mb-1 block">Full name</label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-engrity-navy/60 mb-1 block">Email</label>
          <Input value={profile?.email ?? ''} disabled />
        </div>
        <div>
          <label className="text-xs font-medium text-engrity-navy/60 mb-1 block">Role</label>
          <Input value={profile?.role ?? ''} disabled className="capitalize" />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
          {savedAt && <span className="text-xs text-engrity-navy/40">Saved {savedAt.toLocaleTimeString()}</span>}
        </div>
      </Card>
    </main>
  );
}
