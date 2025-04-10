import type { EmailData } from '../types/email';

// Constants
const SENDER_NAMES = [
  'John Smith', 'Emily Johnson', 'Michael Williams', 'David Brown', 'Sarah Jones',
  'Jessica Miller', 'James Davis', 'Jennifer Garcia', 'Robert Martinez', 'Lisa Robinson',
  'William Thompson', 'Elizabeth Lee', 'Christopher Walker', 'Mary Hall', 'Daniel Allen'
];

const COMPANIES = [
  'Acme Inc', 'Tech Solutions', 'Global Services', 'Digital Innovations', 'Creative Designs',
  'Smart Systems', 'Future Technologies', 'Bright Ideas', 'Modern Solutions', 'Strategic Planning'
];

const EMAIL_DOMAINS = [
  'gmail.com', 'outlook.com', 'yahoo.com', 'company.com', 'example.org',
  'mail.com', 'business.net', 'corporate.io', 'enterprise.co', 'professional.biz'
];

const EMAIL_SUBJECTS = [
  'Project Update: {Project}',
  'Meeting Invitation: {Topic}',
  'Weekly Report: {Week}',
  'Important Announcement',
  'Action Required: {Item}',
  'Follow-up on our conversation',
  'Request for Information',
  'Upcoming Event: {Event}',
  'New Opportunity: {Opportunity}',
  'Thank you for your {Thing}',
  'Changes to {System}',
  'Quarterly Review: {Quarter}',
  'Invitation to collaborate on {Project}',
  'Feedback Request: {Topic}',
  'Quick question about {Topic}'
];

const PROJECT_NAMES = [
  'Apollo', 'Orion', 'Phoenix', 'Jupiter', 'Atlas',
  'Quantum', 'Titan', 'Momentum', 'Horizon', 'Genesis'
];

const TOPICS = [
  'Marketing Strategy', 'Product Development', 'Financial Planning', 'Team Building',
  'Customer Success', 'Content Creation', 'Platform Migration', 'Data Analysis',
  'Mobile App Features', 'Resource Planning', 'Budget Allocation', 'Performance Review'
];

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const WEEKS = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];

/**
 * Generate random demo emails for testing when the Gmail API is unavailable
 */
export function generateDemoEmails(page = 1, pageSize = 10): EmailData[] {
  const emails: EmailData[] = [];
  const baseDate = new Date();
  
  for (let i = 0; i < pageSize; i++) {
    // Calculate date (older for higher page numbers)
    const daysAgo = (page - 1) * pageSize + i;
    const date = new Date(baseDate);
    date.setDate(date.getDate() - daysAgo);
    
    // Random sender name and email
    const senderName = SENDER_NAMES[Math.floor(Math.random() * SENDER_NAMES.length)];
    const company = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
    const domain = EMAIL_DOMAINS[Math.floor(Math.random() * EMAIL_DOMAINS.length)];
    const fromEmail = `${senderName.toLowerCase().replace(' ', '.')}@${domain}`;
    
    // Random subject line
    let subject = EMAIL_SUBJECTS[Math.floor(Math.random() * EMAIL_SUBJECTS.length)];
    
    // Replace placeholders in the subject
    if (subject.includes('{Project}')) {
      subject = subject.replace('{Project}', PROJECT_NAMES[Math.floor(Math.random() * PROJECT_NAMES.length)]);
    }
    if (subject.includes('{Topic}')) {
      subject = subject.replace('{Topic}', TOPICS[Math.floor(Math.random() * TOPICS.length)]);
    }
    if (subject.includes('{Week}')) {
      subject = subject.replace('{Week}', WEEKS[Math.floor(Math.random() * WEEKS.length)]);
    }
    if (subject.includes('{Quarter}')) {
      subject = subject.replace('{Quarter}', QUARTERS[Math.floor(Math.random() * QUARTERS.length)]);
    }
    if (subject.includes('{Event}')) {
      subject = subject.replace('{Event}', `${company} ${TOPICS[Math.floor(Math.random() * TOPICS.length)]}`);
    }
    if (subject.includes('{Opportunity}')) {
      subject = subject.replace('{Opportunity}', `${company} Partnership`);
    }
    if (subject.includes('{Thing}')) {
      subject = subject.replace('{Thing}', ['support', 'feedback', 'contribution', 'assistance'][Math.floor(Math.random() * 4)]);
    }
    if (subject.includes('{System}')) {
      subject = subject.replace('{System}', ['reporting system', 'platform', 'workflow', 'process'][Math.floor(Math.random() * 4)]);
    }
    if (subject.includes('{Item}')) {
      subject = subject.replace('{Item}', ['Approval', 'Feedback', 'Document Review', 'Response'][Math.floor(Math.random() * 4)]);
    }
    
    // Generate unique ID
    const uniqueId = `demo-${page}-${i}`;
    
    // Generate a snippet based on the subject
    const snippets = [
      `Hi there, I wanted to follow up on our discussion about ${subject.toLowerCase()}. Let me know your thoughts.`,
      `Please review the attached document for the latest update on ${subject.toLowerCase()}.`,
      `I'm reaching out regarding ${subject.toLowerCase()}. Can we schedule a meeting to discuss?`,
      `As we discussed earlier, here are my thoughts on ${subject.toLowerCase()}.`,
      `Just wanted to check in on the status of ${subject.toLowerCase()}. Do you have any updates?`
    ];
    const snippet = snippets[Math.floor(Math.random() * snippets.length)];
    
    // Create the email object
    emails.push({
      id: uniqueId,
      threadId: uniqueId,
      from: `${senderName} <${fromEmail}>`,
      to: 'me@example.com',
      subject: subject,
      snippet: snippet,
      date: date.toISOString(),
      isUnread: Math.random() > 0.7, // 30% chance of being unread
      hasAttachments: Math.random() > 0.8, // 20% chance of having attachments
      labelIds: ['INBOX'],
    });
  }
  
  return emails;
}

/**
 * Generate a detailed demo email for when an email is viewed
 */
export function generateDemoEmailDetails(emailId: string): EmailData | null {
  try {
    console.log('Generating demo email details for ID:', emailId);
    
    // Extract page and index from the ID
    if (!emailId || typeof emailId !== 'string') {
      console.error('Invalid email ID provided to generateDemoEmailDetails:', emailId);
      return null;
    }
    
    // Ensure the ID starts with 'demo-'
    if (!emailId.startsWith('demo-')) {
      console.error('Email ID does not start with demo- prefix:', emailId);
      return null;
    }
    
    // Remove 'demo-' prefix and split the rest
    const idWithoutPrefix = emailId.substring(5);
    const parts = idWithoutPrefix.split('-');
    
    // Try to extract page and index
    let page, index;
    
    if (parts.length >= 2) {
      // If we have at least two parts, assume the first is page and second is index
      page = parseInt(parts[0], 10);
      index = parseInt(parts[parts.length - 1], 10);
    } else if (parts.length === 1) {
      // If we only have one part, it might be just the index
      page = 1;
      index = parseInt(parts[0], 10);
    } else {
      console.error('Could not parse page and index from email ID:', emailId);
      return null;
    }
    
    if (isNaN(page) || isNaN(index)) {
      console.error('Invalid page or index parsed from email ID:', emailId, 'Page:', page, 'Index:', index);
      // Fallback to default values if parsing failed
      page = 1;
      index = 0;
    }
    
    console.log('Generating demo email for page:', page, 'index:', index);
    
    // Get the base email from the demo emails
    const demoEmails = generateDemoEmails(page, Math.max(index + 1, 10));
    const baseEmail = demoEmails.find(email => 
      email.id === `demo-${page}-${index}` || 
      email.id === emailId ||
      parseInt(email.id.split('-').pop() || '-1', 10) === index
    );
    
    if (!baseEmail) {
      console.error('Could not find matching demo email for id:', emailId);
      // Provide a fallback email rather than returning null
      return createFallbackEmail(emailId, page, index);
    }
    
    // Generate a longer email body
    const body = `
      <div style="font-family: Arial, sans-serif; padding: 16px; color: #333;">
        <p>Hello,</p>
        
        <p>${baseEmail.snippet}</p>
        
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies ultricies, 
        nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl. Vivamus euismod, nunc eget ultricies ultricies,
        nisl nisl aliquet nisl, eget aliquet nisl nisl eget nisl.</p>
        
        <p>Regards,<br>${baseEmail.from.split('<')[0].trim()}</p>
      </div>
    `;
    
    // Return enhanced email with full body
    return {
      ...baseEmail,
      body
    };
  } catch (error) {
    console.error('Error generating demo email details:', error);
    return null;
  }
}

/**
 * Create a fallback email when we can't find a matching demo email
 */
function createFallbackEmail(emailId: string, page: number, index: number): EmailData {
  const date = new Date();
  date.setDate(date.getDate() - ((page - 1) * 10 + index));
  
  return {
    id: emailId,
    threadId: emailId,
    from: "System <system@taskbox.app>",
    to: "me@example.com",
    subject: "Recovered Email",
    snippet: "This is a fallback email generated because the original demo email could not be found.",
    date: date.toISOString(),
    isUnread: false,
    hasAttachments: false,
    labelIds: ['INBOX'],
    body: `
      <div style="font-family: Arial, sans-serif; padding: 16px; color: #333;">
        <p>Hello,</p>
        
        <p>This is a fallback email that was generated because the original email with ID ${emailId} could not be found.</p>
        
        <p>We apologize for any inconvenience this may have caused. This issue has been logged for further investigation.</p>
        
        <p>Regards,<br>TaskBox System</p>
      </div>
    `
  };
} 