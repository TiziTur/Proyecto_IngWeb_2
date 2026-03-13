const stats = document.querySelectorAll('.stat-number');

const animateNumber = (el) => {
    const target = Number(el.dataset.target || 0);
    let value = 0;
    const step = Math.max(1, Math.floor(target / 40));

    const timer = setInterval(() => {
        value += step;
        if (value >= target) {
            el.textContent = String(target);
            clearInterval(timer);
            return;
        }
        el.textContent = String(value);
    }, 24);
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            animateNumber(entry.target);
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.4 });

stats.forEach((el) => observer.observe(el));

document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
        const id = link.getAttribute('href');
        if (!id || id === '#') {
            return;
        }

        const target = document.querySelector(id);
        if (!target) {
            return;
        }

        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});
