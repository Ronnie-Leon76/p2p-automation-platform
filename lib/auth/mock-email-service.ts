/**
 * Mock Email Service for Team Invitations
 * Simulates email sending for development and testing
 */

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export class MockEmailService {
  private static instance: MockEmailService;

  static getInstance(): MockEmailService {
    if (!MockEmailService.instance) {
      MockEmailService.instance = new MockEmailService();
    }
    return MockEmailService.instance;
  }

  /**
   * Send team invitation email
   */
  async sendTeamInvitation(
    inviterName: string,
    teamName: string,
    inviteeEmail: string,
    inviteLink: string,
    role: string,
    requiresExchangeAccount: boolean
  ): Promise<boolean> {
    const template = this.generateInvitationTemplate(
      inviterName,
      teamName,
      inviteeEmail,
      inviteLink,
      role,
      requiresExchangeAccount
    );

    // Simulate email sending
    console.log("📧 Sending email invitation:");
    console.log("To:", template.to);
    console.log("Subject:", template.subject);
    console.log("Link:", inviteLink);

    // In development, just log the email content
    if (process.env.NODE_ENV === 'development') {
      this.logEmailToConsole(template);
      this.showEmailNotification(template);
    }

    // Simulate async email sending
    await new Promise(resolve => setTimeout(resolve, 1000));

    return true;
  }

  /**
   * Generate invitation email template
   */
  private generateInvitationTemplate(
    inviterName: string,
    teamName: string,
    inviteeEmail: string,
    inviteLink: string,
    role: string,
    requiresExchangeAccount: boolean
  ): EmailTemplate {
    const subject = `${inviterName} invited you to join ${teamName}`;
    
    const text = `
Hi there!

${inviterName} has invited you to join "${teamName}" as a ${role} on the P2P Trading Platform.

${requiresExchangeAccount 
  ? 'You will need an existing exchange account to join this team.' 
  : 'Don\'t worry if you don\'t have an exchange account - we\'ll help you set one up!'
}

Click the link below to accept the invitation:
${inviteLink}

This invitation will expire in 7 days.

Best regards,
P2P Trading Platform Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Team Invitation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .info-box { background: white; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤝 You're Invited!</h1>
    </div>
    <div class="content">
        <h2>Join ${teamName}</h2>
        <p>Hi there!</p>
        <p><strong>${inviterName}</strong> has invited you to join <strong>"${teamName}"</strong> as a <strong>${role}</strong> on our P2P Trading Platform.</p>
        
        <div class="info-box">
            <h3>Your Role: ${role.charAt(0).toUpperCase() + role.slice(1)}</h3>
            <p>As a ${role}, you'll be able to:</p>
            <ul>
                ${role === 'admin' ? '<li>Create and manage ads</li><li>Handle all order operations</li><li>View team analytics</li><li>Manage team settings</li>' : ''}
                ${role === 'manager' ? '<li>Create and manage ads</li><li>Handle order operations</li><li>View team analytics</li>' : ''}
                ${role === 'operator' ? '<li>Manage order operations</li><li>Handle customer disputes</li>' : ''}
            </ul>
        </div>

        ${requiresExchangeAccount 
          ? '<p><strong>📋 Note:</strong> You will need an existing exchange account to join this team.</p>' 
          : '<p><strong>🎉 Good news:</strong> Don\'t worry if you don\'t have an exchange account - we\'ll help you set one up during the onboarding process!</p>'
        }

        <div style="text-align: center;">
            <a href="${inviteLink}" class="button">Accept Invitation</a>
        </div>

        <p><small>This invitation will expire in 7 days. If you can't click the button above, copy and paste this link into your browser:</small></p>
        <p><small style="word-break: break-all;">${inviteLink}</small></p>
    </div>
    <div class="footer">
        <p>This email was sent by the P2P Trading Platform.<br>
        If you didn't expect this invitation, you can safely ignore this email.</p>
    </div>
</body>
</html>
    `.trim();

    return {
      to: inviteeEmail,
      subject,
      html,
      text,
    };
  }

  /**
   * Log email content to console (development only)
   */
  private logEmailToConsole(template: EmailTemplate): void {
    console.log('\n=== EMAIL INVITATION ===');
    console.log('To:', template.to);
    console.log('Subject:', template.subject);
    console.log('\nText Content:');
    console.log(template.text);
    console.log('\n========================\n');
  }

  /**
   * Show browser notification (development only)
   */
  private showEmailNotification(template: EmailTemplate): void {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('📧 Team Invitation Sent', {
          body: `Invitation sent to ${template.to}`,
          icon: '/placeholder-logo.png',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('📧 Team Invitation Sent', {
              body: `Invitation sent to ${template.to}`,
              icon: '/placeholder-logo.png',
            });
          }
        });
      }
    }
  }

  /**
   * Send reminder email for pending invitations
   */
  async sendInvitationReminder(
    inviterName: string,
    teamName: string,
    inviteeEmail: string,
    inviteLink: string,
    daysLeft: number
  ): Promise<boolean> {
    const subject = `Reminder: Join ${teamName} - ${daysLeft} days left`;
    
    const text = `
Hi there!

This is a friendly reminder that ${inviterName} has invited you to join "${teamName}" on the P2P Trading Platform.

Your invitation expires in ${daysLeft} day(s). Don't miss out on this opportunity!

Click here to accept: ${inviteLink}

Best regards,
P2P Trading Platform Team
    `.trim();

    console.log('📧 Sending reminder email to:', inviteeEmail);
    console.log('Subject:', subject);
    console.log('Days left:', daysLeft);

    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 500));

    return true;
  }

  /**
   * Send welcome email after joining team
   */
  async sendWelcomeEmail(
    memberName: string,
    memberEmail: string,
    teamName: string,
    teamOwner: string,
    dashboardLink: string
  ): Promise<boolean> {
    const subject = `Welcome to ${teamName}! 🎉`;
    
    const text = `
Hi ${memberName}!

Welcome to "${teamName}"! You've successfully joined the team managed by ${teamOwner}.

Here's what you can do next:

1. Visit your dashboard: ${dashboardLink}
2. Complete your profile setup
3. Connect your exchange account (if not done already)
4. Start collaborating with your team

We're excited to have you on board!

Best regards,
P2P Trading Platform Team
    `.trim();

    console.log('📧 Sending welcome email to:', memberEmail);
    console.log('Subject:', subject);

    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 500));

    return true;
  }
}
