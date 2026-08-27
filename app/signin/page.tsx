'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      
      const redirectTo = searchParams.get('redirect') ?? '/chat';
      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <div className="space-y-3">
        <Input type="email" placeholder="you@engrity.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button className="w-full" onClick={handleSignIn} disabled={loading || !email || !password}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
        <p className="text-xs text-center text-engrity-navy/50">
          New here? <Link href="/signup" className="text-engrity-blue hover:underline">Create an account</Link>
        </p>
      </div>
    </>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-engrity-gray/20">
      <Card className="w-full max-w-sm">
        <img src="/engrity-logo.png" alt="Engrity" className="w-12 h-12 mb-4" />
        <h1 className="text-xl font-bold text-engrity-navy mb-1">Welcome back</h1>
        <p className="text-sm text-engrity-navy/60 mb-6">Sign in to Engrity Resume Flow.</p>

        <Suspense fallback={<div>Loading...</div>}>
          <SignInForm />
        </Suspense>
      </Card>
    </div>
  );
}