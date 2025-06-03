document.addEventListener('DOMContentLoaded', () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // optional: remove if you want repeated animation
        }
      });
    }, {
      threshold: 0.2
    });
  
    const targets = document.querySelectorAll('.course-card');
    targets.forEach(target => observer.observe(target));
  });