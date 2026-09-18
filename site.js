(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    document.querySelectorAll('nav a').forEach((link) => {
        const linkPage = link.getAttribute('href').split('/').pop();
        if (linkPage === currentPage) {
            link.setAttribute('aria-current', 'page');
        }
    });

    if (prefersReducedMotion) {
        return;
    }

    const animate = (element, keyframes, options) => {
        element.animate(keyframes, {
            duration: 650,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'both',
            ...options,
        });
    };

    animate(document.querySelector('header'), [
        { opacity: 0, transform: 'translateY(-12px)' },
        { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 500 });

    const intro = document.querySelector('.hero, .page-intro');
    if (intro) {
        animate(intro, [
            { opacity: 0, transform: 'translateY(16px)' },
            { opacity: 1, transform: 'translateY(0)' },
        ], { delay: 100 });
    }

    const revealItems = document.querySelectorAll(
        '.intro-grid, .feature-card, .download-panel, .story-section, .contact-card, .support-note, .download-details, .release-history, .form-section'
    );

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, currentObserver) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                animate(entry.target, [
                    { opacity: 0, transform: 'translateY(20px)' },
                    { opacity: 1, transform: 'translateY(0)' },
                ], { duration: 700 });
                currentObserver.unobserve(entry.target);
            });
        }, { threshold: 0.12 });

        revealItems.forEach((element) => {
            element.style.opacity = '0';
            observer.observe(element);
        });
    } else {
        revealItems.forEach((element) => {
            element.style.opacity = '1';
        });
    }

    document.querySelectorAll('a, button').forEach((element) => {
        element.addEventListener('pointerdown', () => {
            element.animate([
                { transform: 'scale(1)' },
                { transform: 'scale(0.97)' },
                { transform: 'scale(1)' },
            ], { duration: 180, easing: 'ease-out' });
        });
    });
})();
