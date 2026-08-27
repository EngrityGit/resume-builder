import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendInviteEmail } from '@/lib/email/resend';

export async function POST(req: NextRequest) {
  try {
    const { email, invitedByName } = (await req.json()) as { email: string; invitedByName?: string };
    if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });

    const supabase = createServiceClient();
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/signin`,
    });
    if (error) throw error;

    const inviteUrl = data?.properties?.action_link ?? `${process.env.NEXT_PUBLIC_APP_URL}/signin`;
    await sendInviteEmail(email, inviteUrl, invitedByName);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('invite error', err);
    return NextResponse.json({ error: 'Failed to send invite.' }, { status: 500 });
  }
}
