/**
 * Parses a BibTeX string and returns an array of publication objects.
 * Supports @inproceedings, @article, @misc, @phdthesis, etc.
 * Custom fields:
 * highlight = "Oral" | "Spotlight" | "Best Paper" | any string
 * note      = "project_url=https://..."  (used to pass project URL)
 */
export function parseBib(bibText) {
  const entries = [];
  // Adjusted regex: Group 1 now captures the entry type (e.g., 'article', 'phdthesis')
  const entryRegex = /@(\w+)\s*\{([^,]+),([^@]*)/g;
  let match;

  while ((match = entryRegex.exec(bibText)) !== null) {
    const type = match[1].toLowerCase();
    const key = match[2].trim();
    const body = match[3];

    const get = (field) => {
      const re = new RegExp(`\\b${field}\\s*=\\s*(?:\\{([\\s\\S]*?)\\}|\\"([\\s\\S]*?)\\"|([^,\\s}]+))`, 'i');
      const m = body.match(re);
      if (!m) return '';
      const val = m[1] ?? m[2] ?? m[3] ?? '';
      return val.replace(/\s+/g, ' ').trim();
    };

    const title = get('title');
    if (!title) continue;

    const rawAuthors = get('author');
    const authors = rawAuthors
      .split(/\s+and\s+/i)
      .map(author => {
        const parts = author.split(',');
        if (parts.length === 2) {
          return `${parts[1].trim()} ${parts[0].trim()}`;
        }
        return author.trim();
      })
      .join(', ');

    // The 'school' field is standard for theses
    let venue = get('booktitle') || get('journal') || get('publisher') || get('institution') || get('school') || '';

    // Automatically format thesis types for the UI
    if (type === 'phdthesis') {
      venue = venue ? `PhD Thesis, ${venue}` : 'PhD Thesis';
    } else if (type === 'mastersthesis') {
      venue = venue ? `Master's Thesis, ${venue}` : `Master's Thesis`;
    }

    const year = parseInt(get('year')) || new Date().getFullYear();
    const highlight = get('highlight') || '';
    const pdf_url = get('url') || '';

    const noteRaw = get('note');
    const projectMatch = noteRaw.match(/project_url=(\S+)/);
    const project_url = projectMatch ? projectMatch[1] : '';
    const selected = get('selected').toLowerCase() === 'true';

    let bibtex = match[0].trim();
    if (!bibtex.endsWith('}')) {
      const lastBrace = bibtex.lastIndexOf('}');
      if (lastBrace !== -1) bibtex = bibtex.substring(0, lastBrace + 1);
    }
    bibtex = bibtex.replace(/\s*(selected|highlight)\s*=\s*(?:\{[\s\S]*?\}|"[^"]*"|[^,}\s]+)\s*,?/gi, '');
    bibtex = bibtex.replace(/,\s*\}/g, '\n}');
    bibtex = bibtex.replace(/\n\s*\n/g, '\n');

    entries.push({ key, title, authors, venue, year, highlight, pdf_url, project_url, bibtex, selected });
  }

  entries.sort((a, b) => b.year - a.year);
  return entries;
}