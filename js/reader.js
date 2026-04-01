// Reader page - Vertical scrolling webtoon-style reader

document.addEventListener('DOMContentLoaded', async () => {
  const chapterId = getUrlParam('chapter');
  const seriesId = getUrlParam('series');
  const container = document.getElementById('reader-container');
  const progressBar = document.getElementById('progress-bar');
  const prevBtn = document.getElementById('prev-chapter');
  const nextBtn = document.getElementById('next-chapter');
  const backBtn = document.getElementById('back-to-series');
  
  if (!chapterId || !seriesId) {
    container.innerHTML = getEmptyStateHTML('Invalid chapter or series');
    return;
  }
  
  backBtn.href = `series.html?id=${seriesId}`;
  
  if (!window.db) {
    container.innerHTML = getEmptyStateHTML('Database not connected');
    return;
  }
  
  try {
    // Load current chapter with images
    const { data: chapter, error: chapterError } = await window.db
      .from('chapters')
      .select(`
        *,
        images:chapter_images(
          image_url,
          page_number
        )
      `)
      .eq('id', chapterId)
      .single();
    
    if (chapterError) throw chapterError;
    
    // Sort images by page_number
    const images = chapter.images?.sort((a, b) => a.page_number - b.page_number) || [];
    
    if (images.length === 0) {
      container.innerHTML = getEmptyStateHTML('No images in this chapter');
      return;
    }
    
    // Render images
    container.innerHTML = images.map((img, index) => `
      <div class="reader-image" data-index="${index}">
        <img src="${img.image_url}" 
             alt="Page ${img.page_number}" 
             loading="${index < 3 ? 'eager' : 'lazy'}">
      </div>
    `).join('');
    
    // Load navigation chapters
    const { data: chapters, error: chaptersError } = await window.db
      .from('chapters')
      .select('id, chapter_number')
      .eq('series_id', seriesId)
      .order('chapter_number', { ascending: true });
    
    if (!chaptersError && chapters) {
      const currentIndex = chapters.findIndex(c => c.id === chapterId);
      
      if (currentIndex > 0) {
        prevBtn.href = `reader.html?chapter=${chapters[currentIndex - 1].id}&series=${seriesId}`;
        prevBtn.style.visibility = 'visible';
      }
      
      if (currentIndex < chapters.length - 1) {
        nextBtn.href = `reader.html?chapter=${chapters[currentIndex + 1].id}&series=${seriesId}`;
        nextBtn.style.visibility = 'visible';
      }
    }
    
    // Update progress bar on scroll
    const updateProgress = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      progressBar.style.width = `${Math.min(100, progress)}%`;
    };
    
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
    
    // Setup mobile interactions
    setupMobileReader(prevBtn.href, nextBtn.href, seriesId);
    
  } catch (err) {
    console.error('Error loading chapter:', err);
    container.innerHTML = getEmptyStateHTML('Failed to load chapter');
    showToast('Error loading chapter', 'error');
  }
});

// Mobile reader setup
function setupMobileReader(prevUrl, nextUrl, seriesId) {
  // Setup tap zones
  const tapLeft = document.getElementById('tap-left');
  const tapRight = document.getElementById('tap-right');
  
  if (prevUrl && tapLeft) {
    tapLeft.style.display = 'block';
    tapLeft.addEventListener('click', () => window.location.href = prevUrl);
  } else if (tapLeft) {
    tapLeft.style.display = 'none';
  }
  
  if (nextUrl && tapRight) {
    tapRight.style.display = 'block';
    tapRight.addEventListener('click', () => window.location.href = nextUrl);
  } else if (tapRight) {
    tapRight.style.display = 'none';
  }
  
  // Setup menu navigation
  const menuPrev = document.getElementById('menu-prev');
  const menuNext = document.getElementById('menu-next');
  const menuChapters = document.getElementById('menu-chapters');
  
  if (menuPrev && prevUrl) {
    menuPrev.href = prevUrl;
    menuPrev.style.display = 'flex';
  }
  if (menuNext && nextUrl) {
    menuNext.href = nextUrl;
    menuNext.style.display = 'flex';
  }
  if (menuChapters && seriesId) {
    menuChapters.href = `series.html?id=${seriesId}`;
  }
  
  // Setup swipe gestures
  setupSwipeGestures(prevUrl, nextUrl);
  
  // Show swipe hint on first visit
  showSwipeHint();
}

// Swipe gesture detection
function setupSwipeGestures(prevUrl, nextUrl) {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  const minSwipeDistance = 50;
  
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });
  
  document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
  }, { passive: true });
  
  function handleSwipe() {
    const swipeDistanceX = touchEndX - touchStartX;
    const swipeDistanceY = touchEndY - touchStartY;
    
    // Only trigger if horizontal swipe is greater than vertical
    if (Math.abs(swipeDistanceX) > Math.abs(swipeDistanceY) && Math.abs(swipeDistanceX) > minSwipeDistance) {
      if (swipeDistanceX > 0 && prevUrl) {
        // Swipe right -> go to previous
        window.location.href = prevUrl;
      } else if (swipeDistanceX < 0 && nextUrl) {
        // Swipe left -> go to next
        window.location.href = nextUrl;
      }
    }
  }
}

// Toggle reader menu
window.toggleMenu = function() {
  const menu = document.getElementById('reader-menu');
  if (menu) {
    menu.classList.toggle('show');
  }
};

// Scroll to top
window.scrollToTop = function() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  toggleMenu();
};

// Scroll to bottom
window.scrollToBottom = function() {
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  toggleMenu();
};

// Show swipe hint
function showSwipeHint() {
  const hint = document.getElementById('swipe-hint');
  const hasSeenHint = localStorage.getItem('reader_swipe_hint_seen');
  
  if (hint && !hasSeenHint && window.innerWidth <= 640) {
    hint.classList.add('show');
    
    setTimeout(() => {
      hint.classList.remove('show');
    }, 3000);
    
    localStorage.setItem('reader_swipe_hint_seen', 'true');
  }
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  const menu = document.getElementById('reader-menu');
  const menuBtn = document.getElementById('menu-btn');
  
  if (menu && menu.classList.contains('show') && 
      !menu.contains(e.target) && !menuBtn.contains(e.target)) {
    menu.classList.remove('show');
  }
});
