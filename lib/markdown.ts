// ═══════════════════════════════════════════════════════════════════
// SHARED MARKDOWN UTILITIES
// Used by both CMS preview and article display
// ═══════════════════════════════════════════════════════════════════

/**
 * Convert markdown string to HTML
 * Supports: headings, bold, italic, quotes, links, code, hr
 */
export function markdownToHtml(markdown: string): string {
  let html = markdown
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Headings
    .replace(/^### (.*$)/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="md-h2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="md-h1">$1</h1>')
    // Bold & Italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Blockquotes
    .replace(/^> (.*$)/gm, '<blockquote class="md-quote">$1</blockquote>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="md-hr" />')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="md-link" target="_blank" rel="noopener noreferrer">$1</a>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="md-p">')
    .replace(/\n/g, '<br />');
  
  // Wrap in paragraph
  html = '<p class="md-p">' + html + '</p>';
  // Remove empty paragraphs
  html = html.replace(/<p class="md-p"><\/p>/g, '');
  // Merge consecutive blockquotes
  html = html.replace(/<\/blockquote>\s*<br \/>\s*<blockquote class="md-quote">/g, '<br />');
  
  return html;
}

/**
 * CSS styles for markdown content (to be used in style tag or CSS-in-JS)
 * These should match both CMS preview and article display
 */
export const markdownStyles = `
  .prose-markdown {
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 1.125rem;
    line-height: 1.8;
    color: var(--text-tertiary);
  }
  
  .prose-markdown .md-h1 {
    font-size: 2rem;
    font-weight: 300;
    color: var(--text-primary);
    margin-top: 3rem;
    margin-bottom: 1.5rem;
    line-height: 1.3;
  }
  
  .prose-markdown .md-h2 {
    font-size: 1.5rem;
    font-weight: 300;
    color: var(--text-primary);
    margin-top: 2.5rem;
    margin-bottom: 1rem;
    line-height: 1.4;
  }
  
  .prose-markdown .md-h3 {
    font-size: 1.25rem;
    font-weight: 400;
    color: var(--text-secondary);
    margin-top: 2rem;
    margin-bottom: 0.75rem;
    line-height: 1.4;
  }
  
  .prose-markdown .md-p {
    margin-bottom: 1.5rem;
  }
  
  .prose-markdown .md-quote {
    border-left: 2px solid var(--accent-gold);
    padding-left: 1.5rem;
    margin: 2rem 0;
    font-style: italic;
    color: var(--text-secondary);
  }
  
  .prose-markdown .md-hr {
    border: none;
    border-top: 1px solid var(--border-secondary);
    margin: 3rem 0;
  }
  
  .prose-markdown .md-link {
    color: var(--accent-gold);
    text-decoration: underline;
    text-underline-offset: 3px;
    transition: opacity 0.2s;
  }
  
  .prose-markdown .md-link:hover {
    opacity: 0.7;
  }
  
  .prose-markdown .md-code {
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 0.9em;
    background-color: var(--bg-elevated);
    padding: 0.2em 0.4em;
    border-radius: 4px;
    color: var(--accent-gold);
  }
  
  .prose-markdown strong {
    font-weight: 600;
    color: var(--text-secondary);
  }
  
  .prose-markdown em {
    font-style: italic;
  }
`;

/**
 * Detect if content is markdown or legacy ContentBlock format
 */
export function isMarkdownContent(content: string | unknown[]): content is string {
  return typeof content === 'string';
}
