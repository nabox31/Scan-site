// Admin page - Manage series, chapters, and upload images

// Simple password protection
const ADMIN_PASSWORD = 'admin123'; // Change this to your desired password

let selectedFiles = [];

document.addEventListener('DOMContentLoaded', () => {
  // Check password
  const isLoggedIn = sessionStorage.getItem('admin_logged_in');
  if (!isLoggedIn) {
    const password = prompt('Enter admin password:');
    if (password !== ADMIN_PASSWORD) {
      alert('Incorrect password');
      window.location.href = '../index.html';
      return;
    }
    sessionStorage.setItem('admin_logged_in', 'true');
  }
  
  if (!window.db) {
    showToast('Database not connected. Check configuration.', 'error');
    return;
  }
  
  loadSeriesDropdowns();
  loadManageSeries();
  setupEventListeners();
});

function setupEventListeners() {
  // Series form
  document.getElementById('series-form').addEventListener('submit', handleCreateSeries);
  
  // Chapter form
  document.getElementById('chapter-form').addEventListener('submit', handleCreateChapter);
  
  // Upload form
  document.getElementById('upload-form').addEventListener('submit', handleUploadImages);
  
  // Upload zone
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');
  
  uploadZone.addEventListener('click', () => fileInput.click());
  
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });
  
  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });
  
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });
  
  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });
  
  // Series/chapter dropdowns
  document.getElementById('chapter-series').addEventListener('change', loadChaptersForSeries);
  document.getElementById('upload-series').addEventListener('change', loadChaptersForUpload);
  document.getElementById('manage-series').addEventListener('change', loadChaptersForManage);
  document.getElementById('manage-chapter').addEventListener('change', loadChapterImagesForManage);
}

async function loadSeriesDropdowns() {
  try {
    const { data: series, error } = await window.db
      .from('series')
      .select('id, title')
      .order('title');
    
    if (error) throw error;
    
    const options = series?.map(s => `<option value="${s.id}">${s.title}</option>`).join('') || 
                    '<option value="">No series available</option>';
    
    document.getElementById('chapter-series').innerHTML = '<option value="">Select series...</option>' + options;
    document.getElementById('upload-series').innerHTML = '<option value="">Select series...</option>' + options;
    document.getElementById('manage-series').innerHTML = '<option value="">Select series...</option>' + options;
    
  } catch (err) {
    console.error('Error loading series:', err);
    showToast('Error loading series list', 'error');
  }
}

async function loadManageSeries() {
  const container = document.getElementById('manage-series-list');
  
  try {
    const { data: series, error } = await window.db
      .from('series')
      .select(`
        *,
        chapters:chapters(
          id,
          chapter_number,
          title,
          images:chapter_images(count)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    if (!series || series.length === 0) {
      container.innerHTML = getEmptyStateHTML('No series created yet');
      return;
    }
    
    container.innerHTML = series.map(s => {
      const chapterCount = s.chapters?.length || 0;
      const imageCount = s.chapters?.reduce((sum, ch) => sum + (ch.images?.[0]?.count || 0), 0) || 0;
      
      return `
        <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <h3 style="font-size: 1rem; margin-bottom: 4px;">${s.title}</h3>
              <p style="font-size: 0.8125rem; color: var(--text-muted);">
                ${chapterCount} chapters · ${imageCount} images
              </p>
            </div>
            <button onclick="deleteSeries('${s.id}')" class="btn btn-danger btn-sm">Delete</button>
          </div>
          ${s.chapters?.length > 0 ? `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">
              <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 8px;">Chapters:</p>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${s.chapters.map(ch => `
                  <span style="background: var(--bg-secondary); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">
                    Ch.${ch.chapter_number} (${ch.images?.[0]?.count || 0} img)
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
    
  } catch (err) {
    console.error('Error loading series:', err);
    container.innerHTML = getEmptyStateHTML('Failed to load series');
  }
}

async function handleCreateSeries(e) {
  e.preventDefault();
  
  const title = document.getElementById('series-title').value.trim();
  const description = document.getElementById('series-desc').value.trim();
  const coverUrl = document.getElementById('series-cover').value.trim() || null;
  
  if (!title) {
    showToast('Title is required', 'error');
    return;
  }
  
  try {
    const { error } = await window.db
      .from('series')
      .insert([{ title, description, cover_url: coverUrl, chapter_count: 0 }]);
    
    if (error) throw error;
    
    showToast('Series created successfully!');
    document.getElementById('series-form').reset();
    loadSeriesDropdowns();
    loadManageSeries();
    
  } catch (err) {
    console.error('Error creating series:', err);
    showToast('Error creating series: ' + err.message, 'error');
  }
}

async function handleCreateChapter(e) {
  e.preventDefault();
  
  const seriesId = document.getElementById('chapter-series').value;
  const chapterNumber = parseFloat(document.getElementById('chapter-number').value);
  const title = document.getElementById('chapter-title').value.trim() || null;
  
  if (!seriesId || !chapterNumber) {
    showToast('Series and chapter number are required', 'error');
    return;
  }
  
  try {
    const { error } = await window.db
      .from('chapters')
      .insert([{ series_id: seriesId, chapter_number: chapterNumber, title }]);
    
    if (error) throw error;
    
    // Update chapter count
    await window.db.rpc('update_chapter_count', { series_id: seriesId });
    
    showToast('Chapter created successfully!');
    document.getElementById('chapter-form').reset();
    loadManageSeries();
    
  } catch (err) {
    console.error('Error creating chapter:', err);
    showToast('Error creating chapter: ' + err.message, 'error');
  }
}

async function loadChaptersForUpload() {
  const seriesId = document.getElementById('upload-series').value;
  const chapterSelect = document.getElementById('upload-chapter');
  
  if (!seriesId) {
    chapterSelect.innerHTML = '<option value="">Select a series first</option>';
    chapterSelect.disabled = true;
    return;
  }
  
  try {
    const { data: chapters, error } = await window.db
      .from('chapters')
      .select('id, chapter_number, title')
      .eq('series_id', seriesId)
      .order('chapter_number');
    
    if (error) throw error;
    
    const options = chapters?.map(ch => 
      `<option value="${ch.id}">Chapter ${ch.chapter_number}${ch.title ? ': ' + ch.title : ''}</option>`
    ).join('') || '<option value="">No chapters found</option>';
    
    chapterSelect.innerHTML = '<option value="">Select chapter...</option>' + options;
    chapterSelect.disabled = false;
    
  } catch (err) {
    console.error('Error loading chapters:', err);
    chapterSelect.innerHTML = '<option value="">Error loading chapters</option>';
  }
}

async function loadChaptersForSeries() {
  const seriesId = document.getElementById('chapter-series').value;
  const suggestionEl = document.getElementById('chapter-suggestion');
  
  if (!seriesId) {
    suggestionEl.textContent = '';
    return;
  }
  
  try {
    const { data: chapters, error } = await window.db
      .from('chapters')
      .select('chapter_number')
      .eq('series_id', seriesId)
      .order('chapter_number');
    
    if (error) throw error;
    
    if (!chapters || chapters.length === 0) {
      suggestionEl.textContent = '💡 Suggested: Chapter 1';
      document.getElementById('chapter-number').value = 1;
      return;
    }
    
    // Find the highest chapter number and suggest next
    const highestChapter = Math.max(...chapters.map(c => parseFloat(c.chapter_number)));
    const suggestedNext = Math.floor(highestChapter) + 1;
    
    suggestionEl.textContent = `💡 Latest: Chapter ${highestChapter} | Suggested next: Chapter ${suggestedNext}`;
    document.getElementById('chapter-number').value = suggestedNext;
    
  } catch (err) {
    console.error('Error loading chapters for suggestion:', err);
    suggestionEl.textContent = '';
  }
}

function handleFiles(files) {
  selectedFiles = Array.from(files).sort((a, b) => a.name.localeCompare(b.name));
  
  const previewContainer = document.getElementById('image-previews');
  const uploadBtn = document.getElementById('upload-btn');
  
  if (selectedFiles.length === 0) {
    previewContainer.classList.add('hidden');
    uploadBtn.disabled = true;
    return;
  }
  
  previewContainer.innerHTML = selectedFiles.map((file, index) => {
    const url = URL.createObjectURL(file);
    return `
      <div class="image-preview-item" data-index="${index}">
        <img src="${url}" alt="Preview ${index + 1}">
        <span class="image-preview-order">${index + 1}</span>
        <button type="button" class="image-preview-remove" onclick="removeFile(${index})">×</button>
      </div>
    `;
  }).join('');
  
  previewContainer.classList.remove('hidden');
  uploadBtn.disabled = false;
}

window.removeFile = function(index) {
  selectedFiles.splice(index, 1);
  handleFiles(selectedFiles);
};

async function handleUploadImages(e) {
  e.preventDefault();
  
  const chapterId = document.getElementById('upload-chapter').value;
  const uploadBtn = document.getElementById('upload-btn');
  
  if (!chapterId || selectedFiles.length === 0) {
    showToast('Please select a chapter and images', 'error');
    return;
  }
  
  uploadBtn.disabled = true;
  uploadBtn.textContent = `Uploading 0/${selectedFiles.length}...`;
  
  try {
    // Get existing images count
    const { data: existingImages, error: countError } = await window.db
      .from('chapter_images')
      .select('id')
      .eq('chapter_id', chapterId);
    
    if (countError) throw countError;
    
    const startPageNumber = (existingImages?.length || 0) + 1;
    
    const uploadedUrls = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${i}.${fileExt}`;
      const filePath = `chapters/${chapterId}/${fileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await window.db.storage
        .from('comics')
        .upload(filePath, file, { contentType: file.type });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = window.db.storage
        .from('comics')
        .getPublicUrl(filePath);
      
      uploadedUrls.push({
        chapter_id: chapterId,
        image_url: urlData.publicUrl,
        page_number: startPageNumber + i
      });
      
      uploadBtn.textContent = `Uploading ${i + 1}/${selectedFiles.length}...`;
    }
    
    // Save to database
    const { error: dbError } = await window.db
      .from('chapter_images')
      .insert(uploadedUrls);
    
    if (dbError) throw dbError;
    
    showToast(`Successfully uploaded ${selectedFiles.length} images!`);
    
    // Reset form
    selectedFiles = [];
    document.getElementById('upload-form').reset();
    document.getElementById('image-previews').classList.add('hidden');
    document.getElementById('upload-chapter').disabled = true;
    document.getElementById('upload-chapter').innerHTML = '<option value="">Select a series first</option>';
    loadManageSeries();
    
  } catch (err) {
    console.error('Error uploading images:', err);
    showToast('Error uploading: ' + err.message, 'error');
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Upload Images';
  }
}

window.deleteSeries = async function(seriesId) {
  if (!confirm('Are you sure? This will delete the series and all its chapters/images.')) {
    return;
  }
  
  try {
    // Delete series (cascades to chapters and images)
    const { error } = await window.db
      .from('series')
      .delete()
      .eq('id', seriesId);
    
    if (error) throw error;
    
    showToast('Series deleted successfully');
    loadSeriesDropdowns();
    loadManageSeries();
    
  } catch (err) {
    console.error('Error deleting series:', err);
    showToast('Error deleting series', 'error');
  }
};

// Load chapters for the manage images section
async function loadChaptersForManage() {
  const seriesId = document.getElementById('manage-series').value;
  const chapterSelect = document.getElementById('manage-chapter');
  const imagesGrid = document.getElementById('manage-images-grid');
  const imagesInfo = document.getElementById('manage-images-info');
  
  // Reset
  imagesGrid.classList.add('hidden');
  imagesGrid.innerHTML = '';
  imagesInfo.style.display = 'none';
  
  if (!seriesId) {
    chapterSelect.innerHTML = '<option value="">Select a series first</option>';
    chapterSelect.disabled = true;
    return;
  }
  
  try {
    const { data: chapters, error } = await window.db
      .from('chapters')
      .select('id, chapter_number, title')
      .eq('series_id', seriesId)
      .order('chapter_number');
    
    if (error) throw error;
    
    const options = chapters?.map(ch => 
      `<option value="${ch.id}">Chapter ${ch.chapter_number}${ch.title ? ': ' + ch.title : ''}</option>`
    ).join('') || '<option value="">No chapters found</option>';
    
    chapterSelect.innerHTML = '<option value="">Select chapter...</option>' + options;
    chapterSelect.disabled = false;
    
  } catch (err) {
    console.error('Error loading chapters:', err);
    chapterSelect.innerHTML = '<option value="">Error loading chapters</option>';
  }
}

// Load images for the selected chapter in manage section
async function loadChapterImagesForManage() {
  const chapterId = document.getElementById('manage-chapter').value;
  const imagesGrid = document.getElementById('manage-images-grid');
  const imagesInfo = document.getElementById('manage-images-info');
  
  if (!chapterId) {
    imagesGrid.classList.add('hidden');
    imagesGrid.innerHTML = '';
    imagesInfo.style.display = 'none';
    return;
  }
  
  try {
    const { data: images, error } = await window.db
      .from('chapter_images')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('page_number');
    
    if (error) throw error;
    
    if (!images || images.length === 0) {
      imagesGrid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center;">No images in this chapter</p>';
      imagesGrid.classList.remove('hidden');
      imagesInfo.style.display = 'none';
      return;
    }
    
    imagesGrid.innerHTML = images.map((img, index) => `
      <div class="image-preview-item">
        <img src="${img.image_url}" alt="Page ${img.page_number}">
        <span class="image-preview-order">${img.page_number}</span>
        <button type="button" class="image-preview-remove" onclick="deleteImage('${img.id}', ${img.page_number}, '${chapterId}')">×</button>
      </div>
    `).join('');
    
    imagesGrid.classList.remove('hidden');
    imagesInfo.style.display = 'block';
    
  } catch (err) {
    console.error('Error loading images:', err);
    showToast('Error loading images', 'error');
  }
}

// Delete a specific image and reorder remaining pages
window.deleteImage = async function(imageId, pageNumber, chapterId) {
  if (!confirm(`Delete page ${pageNumber}? This cannot be undone.`)) {
    return;
  }
  
  try {
    // Delete the image
    const { error: deleteError } = await window.db
      .from('chapter_images')
      .delete()
      .eq('id', imageId);
    
    if (deleteError) throw deleteError;
    
    // Get remaining images to reorder
    const { data: remainingImages, error: fetchError } = await window.db
      .from('chapter_images')
      .select('id, page_number')
      .eq('chapter_id', chapterId)
      .order('page_number');
    
    if (fetchError) throw fetchError;
    
    // Reorder page numbers if needed
    if (remainingImages && remainingImages.length > 0) {
      const updates = remainingImages.map((img, index) => ({
        id: img.id,
        page_number: index + 1
      }));
      
      const { error: updateError } = await window.db
        .from('chapter_images')
        .upsert(updates);
      
      if (updateError) throw updateError;
    }
    
    showToast(`Page ${pageNumber} deleted. Images reordered.`);
    loadChapterImagesForManage();
    loadManageSeries();
    
  } catch (err) {
    console.error('Error deleting image:', err);
    showToast('Error deleting image: ' + err.message, 'error');
  }
};

