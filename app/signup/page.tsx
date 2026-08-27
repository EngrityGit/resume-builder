'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

type Step = 'form' | 'verify';

function SignUpForm() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>('form');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    setError(null);
    if (!fullName.trim()) return setError('Full name is required.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (signUpError) throw signUpError;
      setStep('verify');
    } catch (err: any) {
      setError(err?.message ?? 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setError(null);
    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
      if (verifyError) throw verifyError;
      router.push('/chat');
    } catch (err: any) {
      setError(err?.message ?? 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    setError(null);
    try {
      await supabase.auth.resend({ type: 'signup', email });
    } catch (err: any) {
      setError(err?.message ?? 'Failed to resend code.');
    }
  }

  return (
    <>
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      {step === 'form' ? (
        <div className="space-y-3">
          <Input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input type="email" placeholder="you@engrity.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button className="w-full" onClick={handleSignUp} disabled={loading || !email || !password}>
            {loading ? 'Creating account…' : 'Sign up'}
          </Button>
          <p className="text-xs text-center text-engrity-navy/50">
            Already have an account? <Link href="/signin" className="text-engrity-blue hover:underline">Sign in</Link>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-engrity-navy/70">
            We sent a 6-digit code to <span className="font-medium">{email}</span>. Enter it below to verify your email.
          </p>
          <Input placeholder="123456" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          <Button className="w-full" onClick={handleVerify} disabled={loading || code.length < 6}>
            {loading ? 'Verifying…' : 'Verify & continue'}
          </Button>
          <button onClick={resendCode} className="text-xs text-engrity-blue hover:underline w-full text-center">
            Resend code
          </button>
        </div>
      )}
    </>
  );
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-engrity-gray/20">
      <Card className="w-full max-w-sm">
        <img src="/engrity-logo.png" alt="Engrity" className="w-12 h-12 mb-4" />
        <h1 className="text-xl font-bold text-engrity-navy mb-1">Create your account</h1>
        <p className="text-sm text-engrity-navy/60 mb-6">Join Engrity Resume Flow.</p>

        <Suspense fallback={<div className="text-center py-4 text-sm text-gray-500">Loading sign up...</div>}>
          <SignUpForm />
        </Suspense>
      </Card>
    </div>
  );
}