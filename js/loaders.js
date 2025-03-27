/**
 * Loader utilities for OpenSAT application
 */

// Create a reusable loading overlay element
function createLoadingOverlay(message = 'Loading...', detail = 'Please wait') {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 loading-overlay';
    overlay.id = 'loading-overlay';
    
    overlay.innerHTML = `
        <div class="text-center max-w-sm mx-auto p-6">
            <div class="spinner mx-auto mb-4"></div>
            <p class="font-semibold text-purple-600 text-lg">${message}</p>
            <p class="text-sm text-gray-500 mt-2">${detail}<span class="dots-loader"></span></p>
        </div>
    `;
    
    return overlay;
}

// Show a loading overlay
function showLoading(message = 'Loading...', detail = 'Please wait') {
    // Remove any existing overlay
    hideLoading();
    
    // Create and append the new overlay
    const overlay = createLoadingOverlay(message, detail);
    document.body.appendChild(overlay);
    
    // Force reflow to ensure transitions work
    window.getComputedStyle(overlay).opacity;
    
    return overlay;
}

// Hide the loading overlay with a fade-out animation
function hideLoading(delay = 0) {
    const existing = document.getElementById('loading-overlay');
    
    if (existing) {
        if (delay > 0) {
            setTimeout(() => {
                existing.classList.add('hidden');
                setTimeout(() => {
                    existing.remove();
                }, 300); // match the CSS transition duration
            }, delay);
        } else {
            existing.classList.add('hidden');
            setTimeout(() => {
                existing.remove();
            }, 300); // match the CSS transition duration
        }
    }
}

// Show a loading screen for specific sections
function showSectionLoading(container, message = 'Loading...') {
    // Clear the container
    if (typeof container === 'string') {
        container = document.querySelector(container);
    }
    
    if (!container) return;
    
    // Save original content and clear container
    container.setAttribute('data-original', container.innerHTML);
    container.innerHTML = '';
    
    // Add loading indicator
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-8">
            <div class="spinner mb-4"></div>
            <p class="text-purple-600 font-medium">${message}</p>
        </div>
    `;
    
    return container;
}

// Restore original content after section loading
function restoreSectionContent(container) {
    if (typeof container === 'string') {
        container = document.querySelector(container);
    }
    
    if (!container) return;
    
    const originalContent = container.getAttribute('data-original');
    
    if (originalContent) {
        container.innerHTML = originalContent;
        container.removeAttribute('data-original');
    }
}

// Create skeleton loading placeholders for questions
function createQuestionSkeleton(container) {
    if (typeof container === 'string') {
        container = document.querySelector(container);
    }
    
    if (!container) return;
    
    container.innerHTML = `
        <div class="bg-white rounded-xl shadow-md p-5 mb-4 animate-pulse">
            <div class="h-4 bg-gray-200 rounded w-3/4 mb-4 skeleton"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2 mb-4 skeleton"></div>
            <div class="h-32 bg-gray-200 rounded mb-4 skeleton"></div>
            <div class="space-y-3">
                <div class="h-10 bg-gray-200 rounded skeleton"></div>
                <div class="h-10 bg-gray-200 rounded skeleton"></div>
                <div class="h-10 bg-gray-200 rounded skeleton"></div>
                <div class="h-10 bg-gray-200 rounded skeleton"></div>
            </div>
        </div>
    `;
}

// Export the functions
window.Loaders = {
    showLoading,
    hideLoading,
    showSectionLoading,
    restoreSectionContent,
    createQuestionSkeleton
};
