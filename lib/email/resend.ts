import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInviteEmail(toEmail: string, inviteUrl: string, invitedByName?: string) {
  return resend.emails.send({
    from: 'Engrity Resume Flow <noreply@engrity.com>',
    to: toEmail,
    subject: "You've been invited to Engrity Resume Flow",
    html: `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; color:#070B20;">
        <h2 style="color:#0071fe;">Welcome to Engrity Resume Flow</h2>
        <p>${invitedByName ? `${invitedByName} has invited you` : "You've been invited"} to join the internal resume
        builder for Engrity Group Inc.</p>
        <p><a href="${inviteUrl}" style="background:#0071fe;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">
          Accept invitation</a></p>
      </div>
    `,
  });
}
