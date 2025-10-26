// Gallery JavaScript
let prompts = [];
let filteredPrompts = [];
let lastDataHash = '';
let searchQuery = '';

// Load data from JSON file
async function loadData() {
    try {
        const response = await fetch('data/prompts.json');
        const data = await response.json();
        
        // Check if data changed to prevent unnecessary re-render
        const currentHash = JSON.stringify(data);
        if (currentHash !== lastDataHash) {
            prompts = data;
            lastDataHash = currentHash;
            applySearch();
        }
    } catch (error) {
        console.error('Error loading data:', error);
        prompts = [];
        applySearch();
    }
}

// Search functionality
function applySearch() {
    const query = searchQuery.toLowerCase().trim();
    
    if (!query) {
        filteredPrompts = prompts;
        document.getElementById('searchInfo').classList.remove('show');
    } else {
        filteredPrompts = prompts.filter(p => 
            p.title.toLowerCase().includes(query) || 
            p.prompt.toLowerCase().includes(query)
        );
        
        const searchInfo = document.getElementById('searchInfo');
        searchInfo.textContent = `Ditemukan ${filteredPrompts.length} dari ${prompts.length} prompt`;
        searchInfo.classList.add('show');
    }
    
    renderGallery();
}

// Search input handler
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');

searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    applySearch();
    
    // Show/hide clear button
    if (searchQuery) {
        clearSearchBtn.style.display = 'flex';
    } else {
        clearSearchBtn.style.display = 'none';
    }
});

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    applySearch();
});

// Show toast notification
function showToast(message, icon = '✓') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    
    toastMessage.textContent = message;
    toastIcon.textContent = icon;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// Copy to clipboard
function copyToClipboard(text, button, isTitle = false) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.innerHTML;
        const originalClass = button.className;
        
        button.innerHTML = isTitle ? '✓ Tersalin!' : '<span>✓</span><span>Tersalin!</span>';
        button.classList.add('copied');
        
        showToast(isTitle ? 'Judul tersalin!' : 'Prompt tersalin!', '✓');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.className = originalClass;
        }, 2000);
    }).catch(err => {
        console.error('Copy failed:', err);
        showToast('Gagal menyalin!', '✗');
    });
}

// Get image dimensions to calculate proper display size
function getImageDimensions(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
            // Calculate aspect ratio preserving width/height
            const aspectRatio = this.width / this.height;
            let width = 180;
            let height = 270;
            
            if (aspectRatio > (width / height)) {
                // Wider image
                height = width / aspectRatio;
            } else {
                // Taller image
                width = height * aspectRatio;
            }
            
            resolve({ width: Math.round(width), height: Math.round(height) });
        };
        img.onerror = () => resolve({ width: 180, height: 270 });
        img.src = src;
    });
}

// Render gallery
async function renderGallery() {
    const container = document.getElementById('galleryGrid');
    
    if (filteredPrompts.length === 0 && searchQuery) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <h2>Tidak Ditemukan</h2>
                <p>Tidak ada prompt yang cocok dengan pencarian "${escapeHtml(searchQuery)}"</p>
            </div>
        `;
        return;
    }
    
    if (filteredPrompts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎨</div>
                <h2>Belum Ada Prompt</h2>
                <p>Mulai tambahkan prompt pertama Anda melalui CMS</p>
                <a href="https://www.chapteria.com" class="cms-link">➕ Buka Chapteria</a>
            </div>
        `;
        return;
    }

    // Build HTML for all cards
    const cardsHTML = await Promise.all(filteredPrompts.map(async (p, index) => {
        const imagePath = `images/${p.image}`;
        const dimensions = await getImageDimensions(imagePath);
        
        return `
            <div class="prompt-card">
                <div class="thumbnail" style="width: ${dimensions.width}px; height: ${dimensions.height}px;">
                    <img src="${imagePath}" alt="${escapeHtml(p.title)}" loading="lazy">
                </div>
                <div class="prompt-content">
                    <div class="title-section">
                        <div class="prompt-title">${escapeHtml(p.title)}</div>
                        <button class="copy-title-btn" onclick='copyToClipboard(${JSON.stringify(p.title)}, this, true)'>
                            📋 Salin Judul
                        </button>
                    </div>
                    <div class="prompt-text-section">
                        <div class="prompt-text">${escapeHtml(p.prompt)}</div>
                    </div>
                    <button class="copy-prompt-btn" onclick='copyToClipboard(${JSON.stringify(p.prompt)}, this)'>
                        <span>📋</span>
                        <span>Salin Prompt</span>
                    </button>
                </div>
            </div>
        `;
    }));
    
    container.innerHTML = cardsHTML.join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Check for updates every 5 seconds (reduced from 3 to prevent flicker)
let updateInterval;
function startAutoUpdate() {
    updateInterval = setInterval(() => {
        loadData();
    }, 5000);
}

// Stop auto-update when page is hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearInterval(updateInterval);
    } else {
        startAutoUpdate();
    }
});

// Initialize
loadData();
startAutoUpdate();