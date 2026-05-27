/**
 * Parses a BibTeX string and returns an array of publication objects.
 * Supports @inproceedings, @article, @misc, etc.
 * Custom fields:
 *   highlight = "Oral" | "Spotlight" | "Best Paper" | any string
 *   note      = "project_url=https://..."  (used to pass project URL)
 */
export function parseBib(bibText) {
  const entries = [];
  const entryRegex = /@\w+\s*\{([^,]+),([^@]*)/g;
  let match;

  while ((match = entryRegex.exec(bibText)) !== null) {
    const key = match[1].trim();
    const body = match[2];

    const get = (field) => {
      const re = new RegExp(`\\b${field}\\s*=\\s*[{"]([\\s\\S]*?)["}}](?:\\s*[,}])`, 'i');
      const m = body.match(re);
      return m ? m[1].replace(/\s+/g, ' ').trim() : '';
    };

    const title = get('title');
    if (!title) continue;

    const authors = get('author').replace(/ and /gi, ', ');
    const venue = get('booktitle') || get('journal') || get('publisher') || '';
    const year = parseInt(get('year')) || new Date().getFullYear();
    const highlight = get('highlight') || '';
    const pdf_url = get('url') || '';

    // project_url stored in note as "project_url=..."
    const noteRaw = get('note');
    const projectMatch = noteRaw.match(/project_url=(\S+)/);
    const project_url = projectMatch ? projectMatch[1] : '';

    // Reconstruct bibtex snippet for display
    const bibtex = match[0].trim();

    entries.push({ key, title, authors, venue, year, highlight, pdf_url, project_url, bibtex });
  }

  // Sort by year descending
  entries.sort((a, b) => b.year - a.year);
  return entries;
}