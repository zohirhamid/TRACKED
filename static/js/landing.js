// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
const body = document.body;

if (mobileMenuToggle && mobileNav) {
    mobileMenuToggle.addEventListener('click', () => {
        const isOpen = mobileMenuToggle.classList.toggle('active');
        mobileNav.classList.toggle('active');
        body.classList.toggle('menu-open');
        
        // Update ARIA attributes
        mobileMenuToggle.setAttribute('aria-expanded', isOpen);
        mobileMenuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
        mobileNav.setAttribute('aria-hidden', !isOpen);
    });
    
    // Close mobile menu when clicking a link
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuToggle.classList.remove('active');
            mobileNav.classList.remove('active');
            body.classList.remove('menu-open');
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
            mobileMenuToggle.setAttribute('aria-label', 'Open menu');
            mobileNav.setAttribute('aria-hidden', 'true');
        });
    });
}

// Mobile Dropdown Toggle
const mobileDropdownToggles = document.querySelectorAll('.mobile-dropdown-toggle');
mobileDropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
        const parent = toggle.closest('.mobile-nav-item');
        const isOpen = parent.classList.toggle('open');
        toggle.setAttribute('aria-expanded', isOpen);
    });
});

// Desktop Dropdown Keyboard Navigation
const navDropdowns = document.querySelectorAll('.nav-item');
navDropdowns.forEach(item => {
    const link = item.querySelector('.nav-link-dropdown');
    const dropdown = item.querySelector('.nav-dropdown');
    
    if (link && dropdown) {
        // Toggle on Enter/Space
        link.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const isExpanded = link.getAttribute('aria-expanded') === 'true';
                link.setAttribute('aria-expanded', !isExpanded);
            }
        });
        
        // Close on Escape
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                link.setAttribute('aria-expanded', 'false');
                link.focus();
            }
        });
    }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Add scroll effect to header
const header = document.querySelector('.header');

if (header) {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.step, .preview-image').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Set active nav link based on current section
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

const setActiveLink = () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.pageYOffset >= sectionTop) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
};

window.addEventListener('scroll', setActiveLink);
setActiveLink();