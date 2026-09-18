(() => {
    'use strict';

    const config = {
            animationDuration: 650,
            introDuration: 520,
            revealThreshold: 0.12,
            revealDistance: 22,
            transitionDuration: 220,
            pressDuration: 180,
            storageKey: 'spammapp-visit-count',
        };

        const state = {
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            pageName: getCurrentPageName(),
            isLeaving: false,
            observer: null,
        };

        function getCurrentPageName() {
            const path = window.location.pathname.split('/').pop();
            return path || 'index.html';
        }

        function select(selector, parent = document) {
            return parent.querySelector(selector);
        }

        function selectAll(selector, parent = document) {
            return Array.from(parent.querySelectorAll(selector));
        }

        function isElement(value) {
            return value instanceof Element;
        }

        function isInternalPageLink(link) {
            if (!link || !link.href) {
                return false;
            }

            if (link.hasAttribute('download')) {
                return false;
            }

            if (link.target && link.target !== '_self') {
                return false;
            }

            const destination = new URL(link.href, window.location.href);
            return destination.origin === window.location.origin
                && destination.pathname !== window.location.pathname;
        }

        function animate(element, keyframes, options = {}) {
            if (!isElement(element) || state.reducedMotion || !element.animate) {
                return null;
            }

            return element.animate(keyframes, {
                duration: config.animationDuration,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                fill: 'both',
                ...options,
            });
        }

        function animateOnce(element, keyframes, options = {}) {
            if (!isElement(element) || element.dataset.animationComplete === 'true') {
                return null;
            }

            element.dataset.animationComplete = 'true';
            return animate(element, keyframes, options);
        }

        function markCurrentNavigation() {
            selectAll('nav a').forEach((link) => {
                const destination = new URL(link.href, window.location.href);
                const destinationName = destination.pathname.split('/').pop() || 'index.html';

                if (destinationName === state.pageName) {
                    link.setAttribute('aria-current', 'page');
                } else {
                    link.removeAttribute('aria-current');
                }
            });
        }

        function animateHeader() {
            const header = select('header');

            animate(header, [
                { opacity: 0, transform: 'translateY(-12px)' },
                { opacity: 1, transform: 'translateY(0)' },
            ], {
                duration: config.introDuration,
            });
        }

        function animatePageIntro() {
            const intro = select('.hero, .page-intro');

            animate(intro, [
                { opacity: 0, transform: 'translateY(16px)' },
                { opacity: 1, transform: 'translateY(0)' },
            ], {
                delay: 90,
                duration: config.introDuration,
            });
        }

        function getRevealItems() {
            return selectAll([
                '.intro-grid',
                '.feature-card',
                '.download-panel',
                '.story-section',
                '.contact-card',
                '.support-note',
                '.download-details',
                '.release-history',
                '.form-section',
                'footer',
            ].join(', '));
        }

        function revealElement(element, index = 0) {
            if (!isElement(element)) {
                return;
            }

            animateOnce(element, [
                { opacity: 0, transform: `translateY(${config.revealDistance}px)` },
                { opacity: 1, transform: 'translateY(0)' },
            ], {
                delay: Math.min(index * 55, 280),
                duration: config.animationDuration,
            });
        }

        function revealEverything(items) {
            items.forEach((element) => {
                element.style.opacity = '1';
                element.dataset.animationComplete = 'true';
            });
        }

        function setupRevealObserver() {
            const items = getRevealItems();

            if (items.length === 0) {
                return;
            }

            if (state.reducedMotion || !('IntersectionObserver' in window)) {
                revealEverything(items);
                return;
            }

            state.observer = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    revealElement(entry.target, Number(entry.target.dataset.revealIndex));
                    observer.unobserve(entry.target);
                });
            }, {
                threshold: config.revealThreshold,
            });

            items.forEach((element, index) => {
                element.dataset.revealIndex = String(index);
                element.style.opacity = '0';
                state.observer.observe(element);
            });
        }

        function setupNavigationTransitions() {
            selectAll('a').forEach((link) => {
                if (!isInternalPageLink(link)) {
                    return;
                }

                link.addEventListener('click', (event) => {
                    if (state.reducedMotion || state.isLeaving || event.defaultPrevented) {
                        return;
                    }

                    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                        return;
                    }

                    event.preventDefault();
                    state.isLeaving = true;

                    const destination = link.href;
                    const transition = animate(document.body, [
                        { opacity: 1 },
                        { opacity: 0.35 },
                    ], {
                        duration: config.transitionDuration,
                        easing: 'ease-in',
                    });

                    if (transition) {
                        transition.finished.then(() => {
                            window.location.assign(destination);
                        });
                    } else {
                        window.location.assign(destination);
                    }
                });
            });
        }

        function setupPressFeedback() {
            selectAll('a, button').forEach((element) => {
                element.addEventListener('pointerdown', () => {
                    animate(element, [
                        { transform: 'scale(1)' },
                        { transform: 'scale(0.97)' },
                        { transform: 'scale(1)' },
                    ], {
                        duration: config.pressDuration,
                        easing: 'ease-out',
                    });
                });
            });
        }

        function setupKeyboardFeedback() {
            selectAll('a, button').forEach((element) => {
                element.addEventListener('keydown', (event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') {
                        return;
                    }

                    animate(element, [
                        { transform: 'scale(1)' },
                        { transform: 'scale(0.97)' },
                        { transform: 'scale(1)' },
                    ], {
                        duration: config.pressDuration,
                    });
                });
            });
        }

        function setupLogoInteraction() {
            const logo = select('nav li:first-child a');

            if (!logo) {
                return;
            }

            logo.addEventListener('mouseenter', () => {
                animate(select('img', logo), [
                    { transform: 'rotate(0deg) scale(1)' },
                    { transform: 'rotate(-8deg) scale(1.08)' },
                    { transform: 'rotate(0deg) scale(1)' },
                ], {
                    duration: 420,
                });
            });
        }

        function setupCardHover() {
            selectAll('.feature-card, .contact-card').forEach((card) => {
                card.addEventListener('mouseenter', () => {
                    animate(card, [
                        { transform: 'translateY(0)' },
                        { transform: 'translateY(-4px)' },
                    ], {
                        duration: 220,
                        easing: 'ease-out',
                        fill: 'forwards',
                    });
                });

                card.addEventListener('mouseleave', () => {
                    animate(card, [
                        { transform: 'translateY(-4px)' },
                        { transform: 'translateY(0)' },
                    ], {
                        duration: 220,
                        easing: 'ease-out',
                        fill: 'forwards',
                    });
                });
            });
        }

        function setupFormFeedback() {
            const form = select('form');

            if (!form) {
                return;
            }

            form.addEventListener('submit', (event) => {
                const invalidFields = selectAll(':invalid', form);

                if (invalidFields.length === 0) {
                    return;
                }

                event.preventDefault();
                invalidFields[0].focus();
                animate(invalidFields[0], [
                    { transform: 'translateX(0)' },
                    { transform: 'translateX(-6px)' },
                    { transform: 'translateX(6px)' },
                    { transform: 'translateX(0)' },
                ], {
                    duration: 260,
                    easing: 'ease-in-out',
                });
            });

            selectAll('input, textarea', form).forEach((field) => {
                field.addEventListener('blur', () => {
                    if (field.checkValidity()) {
                        field.removeAttribute('aria-invalid');
                    } else {
                        field.setAttribute('aria-invalid', 'true');
                    }
                });

                field.addEventListener('input', () => {
                    if (field.checkValidity()) {
                        field.removeAttribute('aria-invalid');
                    }
                });
            });
        }

        function setupDownloadFeedback() {
            selectAll('a[download]').forEach((downloadLink) => {
                downloadLink.addEventListener('click', () => {
                    const originalContent = downloadLink.innerHTML;

                    downloadLink.setAttribute('aria-label', 'Download started');
                    downloadLink.textContent = 'Download started';

                    animate(downloadLink, [
                        { transform: 'scale(1)' },
                        { transform: 'scale(1.03)' },
                        { transform: 'scale(1)' },
                    ], {
                        duration: 300,
                        easing: 'ease-out',
                    });

                    window.setTimeout(() => {
                        downloadLink.innerHTML = originalContent;
                        downloadLink.removeAttribute('aria-label');
                    }, 1600);
                });
            });
        }

        function setupSmoothAnchors() {
            selectAll('a[href^="#"]').forEach((link) => {
                link.addEventListener('click', (event) => {
                    const target = select(link.getAttribute('href'));

                    if (!target) {
                        return;
                    }

                    event.preventDefault();
                    target.scrollIntoView({
                        behavior: state.reducedMotion ? 'auto' : 'smooth',
                        block: 'start',
                    });
                    window.history.pushState({}, '', link.href);
                });
            });
        }

        function setupVisibilityRecovery() {
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden && !state.reducedMotion) {
                    animate(select('header'), [
                        { opacity: 0.82 },
                        { opacity: 1 },
                    ], {
                        duration: 300,
                    });
                }
            });
        }

        function recordVisit() {
            try {
                const previousVisits = Number.parseInt(
                    window.sessionStorage.getItem(config.storageKey) || '0',
                    10
                );
                window.sessionStorage.setItem(config.storageKey, String(previousVisits + 1));
            } catch (error) {
                return;
            }
        }

        function setupReducedMotionListener() {
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            const updatePreference = (event) => {
                state.reducedMotion = event.matches;

                if (state.reducedMotion) {
                    revealEverything(getRevealItems());
                }
            };

            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', updatePreference);
            } else if (mediaQuery.addListener) {
                mediaQuery.addListener(updatePreference);
            }
        }

        function initialize() {
            markCurrentNavigation();
            recordVisit();
            animateHeader();
            animatePageIntro();
            setupRevealObserver();
            setupNavigationTransitions();
            setupPressFeedback();
            setupKeyboardFeedback();
            setupLogoInteraction();
            setupCardHover();
            setupFormFeedback();
            setupDownloadFeedback();
            setupSmoothAnchors();
            setupVisibilityRecovery();
            setupReducedMotionListener();
        }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize, { once: true });
    } else {
        initialize();
    }
})();
