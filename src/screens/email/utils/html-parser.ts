/**
 * Simple HTML to text parser to extract readable content from HTML emails
 */
export function parseHtmlContent(html: string): string {
  if (!html) return '';
  
  // Remove DOCTYPE, HTML, HEAD sections
  let content = html.replace(/<head[\s\S]*?<\/head>/gi, '')
                   .replace(/<style[\s\S]*?<\/style>/gi, '')
                   .replace(/<script[\s\S]*?<\/script>/gi, '');
  
  // Replace common tags with line breaks or spacing
  content = content
    .replace(/<\/div>|<\/p>|<\/h[1-6]>|<br\s*\/?>/gi, '\n')
    .replace(/<li>/gi, '\n• ')
    .replace(/<hr\s*\/?>/gi, '\n-------------------------\n')
    .replace(/<tr>/gi, '\n')
    .replace(/<\/td>|<\/th>/gi, '  ');
  
  // Remove all remaining HTML tags
  content = content.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  content = content
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Remove excessive whitespace
  content = content
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/  +/g, ' ')
    .trim();
  
  return content;
} 