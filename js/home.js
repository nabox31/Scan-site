// Home page - Load and display all series

document.addEventListener('DOMContentLoaded', async () => {
  const seriesGrid = document.getElementById('series-grid');
  
  if (!window.db) {
    seriesGrid.innerHTML = getEmptyStateHTML('Database not connected. Check your Supabase configuration.');
    return;
  }
  
  try {
    const { data: series, error } = await window.db
      .from('series')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    if (!series || series.length === 0) {
      seriesGrid.innerHTML = getEmptyStateHTML('No series available yet. Add some from the admin page!');
      return;
    }
    
    seriesGrid.innerHTML = series.map(s => `
      <a href="pages/series.html?id=${s.id}" class="card">
        <div class="card-image">
          <img src="${s.cover_url || 'assets/placeholder.jpg'}" alt="${s.title}" loading="lazy">
        </div>
        <div class="card-content">
          <h3 class="card-title">${s.title}</h3>
          <p class="card-subtitle">${s.chapter_count || 0} chapters</p>
        </div>
      </a>
    `).join('');
    
  } catch (err) {
    console.error('Error loading series:', err);
    seriesGrid.innerHTML = getEmptyStateHTML('Failed to load series. Please try again.');
    showToast('Error loading series', 'error');
  }
});
