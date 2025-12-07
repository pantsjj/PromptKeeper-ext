document.addEventListener('DOMContentLoaded', () => {
    // Handle chrome:// links
    const chromeLinks = document.querySelectorAll('.chrome-link');
    
    chromeLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const url = link.dataset.url;
            
            // Try to open using tabs API (works if this is an extension page)
            if (chrome && chrome.tabs && chrome.tabs.create) {
                chrome.tabs.create({ url: url });
            } else {
                // Fallback: Copy to clipboard
                navigator.clipboard.writeText(url).then(() => {
                    const originalText = link.textContent;
                    link.textContent = 'Copied! ✅';
                    setTimeout(() => link.textContent = originalText, 1500);
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                    alert(`Could not open. Please copy: ${url}`);
                });
            }
        });
    });
});
