// ============================================
// MAIN JAVASCRIPT
// ============================================

// CSRF Token Helper
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Get CSRF token for AJAX requests
function getCSRFToken() {
    return getCookie('csrftoken');
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('TRACKED initialized');
});

document.addEventListener('DOMContentLoaded', function() {
    const userMenu = document.querySelector('.user-menu');
    const toggle = document.querySelector('.user-menu-toggle');
    const dropdown = document.querySelector('.user-dropdown');
    
    if (!toggle || !userMenu) return;
    
    toggle.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = userMenu.classList.toggle('active');
        toggle.setAttribute('aria-expanded', isOpen);
        dropdown.setAttribute('aria-hidden', !isOpen);
    });
    
    // Close when clicking outside
    document.addEventListener('click', function(e) {
        if (!userMenu.contains(e.target)) {
            userMenu.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            dropdown.setAttribute('aria-hidden', 'true');
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && userMenu.classList.contains('active')) {
            userMenu.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            dropdown.setAttribute('aria-hidden', 'true');
        }
    });
});