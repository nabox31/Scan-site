// Series page - Display series info and chapter list

document.addEventListener('DOMContentLoaded', async () => {
  const seriesId = getUrlParam('id');
  const seriesHeader = document.getElementById('series-header');
  const chapterList = document.getElementById('chapter-list');
  
  if (!seriesId) {
    seriesHeader.innerHTML = '<p class="text-muted">No series selected</p>';
    chapterList.innerHTML = '';
    return;
  }
  
  if (!window.db) {
    seriesHeader.innerHTML = getEmptyStateHTML('Database not connected');
    chapterList.innerHTML = '';
    return;
  }
  
  try {
    // Load series details
    const { data: series, error: seriesError } = await window.db
      .from('series')
      .select('*')
      .eq('id', seriesId)
      .single();
    
    if (seriesError) throw seriesError;
    
    seriesHeader.innerHTML = `
      <div class="card" style="display: flex; flex-direction: column;">
        <div style="display: flex; gap: 16px; padding: 16px;">
          <img src="${series.cover_url || '../assets/placeholder.jpg'}" 
               alt="${series.title}" 
               style="width: 120px; height: 160px; object-fit: cover; border-radius: 8px; flex-shrink: 0;">
          <div>
            <h1 style="font-size: 1.5rem; margin-bottom: 8px;">${series.title}</h1>
            <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 8px;">
              ${series.chapter_count || 0} chapters
            </p>
            <p style="color: var(--text-muted); font-size: 0.875rem; line-height: 1.5;">
              ${series.description || 'No description available.'}
            </p>
          </div>
        </div>
      </div>
    `;
    
    // Load chapters
    const { data: chapters, error: chaptersError } = await window.db
      .from('chapters')
      .select('*')
      .eq('series_id', seriesId)
      .order('chapter_number', { ascending: false });
    
    if (chaptersError) throw chaptersError;
    
    if (!chapters || chapters.length === 0) {
      chapterList.innerHTML = getEmptyStateHTML('No chapters available yet');
      return;
    }
    
    chapterList.innerHTML = chapters.map(ch => `
      <a href="reader.html?chapter=${ch.id}&series=${seriesId}" class="chapter-item">
        <div class="chapter-info">
          <span class="chapter-number">Chapter ${ch.chapter_number}${ch.title ? ': ' + ch.title : ''}</span>
          <span class="chapter-date">${formatRelativeTime(ch.created_at)}</span>
        </div>
        <span style="color: var(--text-muted);">→</span>
      </a>
    `).join('');
    
  } catch (err) {
    console.error('Error loading series:', err);
    seriesHeader.innerHTML = getEmptyStateHTML('Failed to load series');
    chapterList.innerHTML = '';
    showToast('Error loading series data', 'error');
  }
});
