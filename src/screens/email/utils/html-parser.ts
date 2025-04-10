/**
 * Enhanced HTML to text parser to extract readable content from HTML emails
 * with improved formatting for readability
 */
export function parseHtmlContent(html: string): string[] {
  if (!html) return [''];
  
  // Remove DOCTYPE, HTML, HEAD sections
  let content = html.replace(/<head[\s\S]*?<\/head>/gi, '')
                   .replace(/<style[\s\S]*?<\/style>/gi, '')
                   .replace(/<script[\s\S]*?<\/script>/gi, '');
  
  // Preserve links before replacing tags
  content = content.replace(/<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1[^>]*>(.*?)<\/a>/gi, function(match, quote, url, text) {
    // If the link text is just the URL, keep it simple
    if (text.trim() === url.trim() || !text.trim()) {
      return ` ${url} `;
    }
    // For emails, keep email format
    if (url.startsWith('mailto:')) {
      return `${text} (${url.substring(7)}) `;
    }
    // Otherwise show both text and URL for better context
    return `${text} (${url}) `;
  });
  
  // Handle common email formatting
  content = content
    // Add proper line breaks for block elements
    .replace(/<\/div>|<\/p>|<\/h[1-6]>|<br\s*\/?>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    
    // Format lists properly with bullets and indentation
    .replace(/<li\b[^>]*>/gi, '\n • ')
    .replace(/<\/li>/gi, '')
    .replace(/<ul\b[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol\b[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    
    // Format tables
    .replace(/<tr\b[^>]*>/gi, '\n')
    .replace(/<td\b[^>]*>|<th\b[^>]*>/gi, '   ')
    .replace(/<\/td>|<\/th>/gi, '   ')
    
    // Format special elements
    .replace(/<hr\s*\/?>/gi, '\n-------------------------\n')
    .replace(/<blockquote\b[^>]*>/gi, '\n> ')
    .replace(/<\/blockquote>/gi, '\n')
    
    // Emphasize headings
    .replace(/<h1\b[^>]*>/gi, '\n\n')
    .replace(/<h2\b[^>]*>/gi, '\n\n')
    .replace(/<h3\b[^>]*>/gi, '\n\n')
    .replace(/<h4\b[^>]*>/gi, '\n\n')
    .replace(/<h5\b[^>]*>/gi, '\n\n')
    .replace(/<h6\b[^>]*>/gi, '\n\n');
  
  // Handle inline elements with potential formatting (bold, underlined, etc.)
  content = content
    .replace(/<b\b[^>]*>|<strong\b[^>]*>/gi, '**')
    .replace(/<\/b>|<\/strong>/gi, '**')
    .replace(/<i\b[^>]*>|<em\b[^>]*>/gi, '_')
    .replace(/<\/i>|<\/em>/gi, '_')
    .replace(/<u\b[^>]*>/gi, '_')
    .replace(/<\/u>/gi, '_')
    .replace(/<s\b[^>]*>|<strike\b[^>]*>|<del\b[^>]*>/gi, '~~')
    .replace(/<\/s>|<\/strike>|<\/del>/gi, '~~');
  
  // Remove all remaining HTML tags
  content = content.replace(/<[^>]*>/g, '');
  
  // Preserve email addresses and URLs so they remain clickable
  content = content.replace(/(\S+@\S+\.\S+)/g, ' $1 ');
  content = content.replace(/(https?:\/\/\S+)/g, ' $1 ');
  
  // Decode common HTML entities
  content = content
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&bull;/g, '•')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(Number(dec)));
  
  // Clean up excessive whitespace
  content = content
    .replace(/\n\s*\n\s*\n/g, '\n\n')  // Replace triple line breaks with double
    .replace(/  +/g, ' ')              // Replace multiple spaces with single space
    .replace(/\t+/g, '  ')             // Replace tabs with two spaces
    .replace(/^\s+|\s+$/gm, '')        // Trim start and end of each line
    .trim();                           // Trim the entire string
  
  // Split into paragraphs based on double line breaks and filter out empty ones
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  // If no paragraphs were found, return the whole content as a single paragraph
  return paragraphs.length > 0 ? paragraphs : [content];
} 