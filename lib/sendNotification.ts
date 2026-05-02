import { Resend } from 'resend';

// Initialize with environment variable
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send a professional email notification to the farmer.
 * NON-BLOCKING by design — caller should NOT await this in the critical path.
 */
export async function sendFarmerEmail(farmerName: string, status: string) {
  const isOverride = status.includes('MANUAL_OVERRIDE');
  const statusLabel = isOverride ? 'Approved (Manual Override)' : 'Verified & Approved';
  const statusColor = isOverride ? '#dc2626' : '#059669'; // Red for override, green for normal

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Courier New', Courier, monospace;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.05);">
    
    <!-- Header -->
    <div style="background:#059669;padding:24px;text-align:center;border-bottom:4px solid #047857;">
      <h1 style="color:#ffffff;font-size:24px;margin:0;letter-spacing:2px;text-transform:uppercase;">PRAGATI AI</h1>
      <p style="color:#a7f3d0;font-size:12px;margin:8px 0 0;letter-spacing:1px;">GOVERNMENT OF MAHARASHTRA | AGRICULTURE DEPT.</p>
    </div>
    
    <!-- Body -->
    <div style="padding:32px;">
      <p style="font-size:16px;color:#334155;margin:0 0 20px;font-weight:bold;">Dear ${farmerName},</p>
      
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;">
        This is an official automated notification regarding your agricultural subsidy application. Your file has been processed by the District Clerk's office.
      </p>
      
      <!-- Status Badge -->
      <div style="background:#f1f5f9;border-left:4px solid ${statusColor};padding:16px;margin:0 0 24px;">
        <p style="font-size:12px;color:#64748b;margin:0 0 8px;text-transform:uppercase;font-weight:bold;">Current Status</p>
        <span style="background:${statusColor};color:#ffffff;font-size:14px;font-weight:bold;padding:6px 12px;border-radius:4px;display:inline-block;">${statusLabel}</span>
      </div>
      
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 16px;">
        <strong>Next Steps:</strong> Your Direct Benefit Transfer (DBT) has been authorized and will be initiated to your linked bank account shortly. No further action is required from your side at this time.
      </p>
      
      <p style="font-size:12px;color:#94a3b8;margin:32px 0 0;border-top:1px dashed #cbd5e1;padding-top:16px;">
        * This is a system-generated message from the PRAGATI AI Transparency Engine. Do not reply to this email. *
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'vinitvibhandik77@gmail.com', // Fixed destination as requested
      subject: 'PRAGATI AI: Application Update',
      html: htmlBody,
    });
    
    console.log('[PRAGATI Email] Sent successfully, ID:', data?.data?.id);
  } catch (error: any) {
    console.error('[PRAGATI Email] Send failed:', error.message);
  }
}
