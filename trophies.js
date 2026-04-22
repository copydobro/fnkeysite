/**
 * Trophies Interaction Logic
 * Handles unique game-like animations for each social proof trophy.
 */

document.addEventListener('DOMContentLoaded', () => {
    const trophies = document.querySelectorAll('.sp-trophy');

    const animationMap = {
        'trophy-rocket': 'is-launched',
        'trophy-cup': 'is-jumping',
        'trophy-star': 'is-shining',
        'trophy-disk': 'is-vibrating'
    };

    trophies.forEach(trophy => {
        trophy.addEventListener('click', () => {
            // Find which animation class to apply
            let animClass = '';
            for (const [key, value] of Object.entries(animationMap)) {
                if (trophy.classList.contains(key)) {
                    animClass = value;
                    break;
                }
            }

            if (!animClass || trophy.classList.contains(animClass)) return;

            // Trigger animation
            trophy.classList.add(animClass);

            // Listen for the end of animation on the SVG element
            const svg = trophy.querySelector('svg');
            const handleAnimationEnd = () => {
                trophy.classList.remove(animClass);
                svg.removeEventListener('animationend', handleAnimationEnd);
            };

            svg.addEventListener('animationend', handleAnimationEnd);
            
            // Safety timeout (in case animationend doesn't fire)
            setTimeout(() => {
                if (trophy.classList.contains(animClass)) {
                    trophy.classList.remove(animClass);
                }
            }, 2000);
        });
    });
});
