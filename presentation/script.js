// Presentation Navigation - SleepMode PM

let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const slideCounter = document.getElementById('slideCounter');
const progressFill = document.getElementById('progressFill');

// Update slide display
function showSlide(n) {
  // Remove active class from all slides
  slides.forEach(slide => {
    slide.classList.remove('active');
  });

  // Ensure slide number is within bounds
  if (n >= totalSlides) {
    currentSlide = totalSlides - 1;
  } else if (n < 0) {
    currentSlide = 0;
  } else {
    currentSlide = n;
  }

  // Show current slide
  slides[currentSlide].classList.add('active');

  // Update counter
  slideCounter.textContent = `${currentSlide + 1} / ${totalSlides}`;

  // Update progress bar
  const progress = ((currentSlide + 1) / totalSlides) * 100;
  progressFill.style.width = `${progress}%`;

  // Update button states
  prevBtn.disabled = currentSlide === 0;
  nextBtn.disabled = currentSlide === totalSlides - 1;
}

// Navigation functions
function nextSlide() {
  showSlide(currentSlide + 1);
}

function prevSlide() {
  showSlide(currentSlide - 1);
}

// Event listeners
prevBtn.addEventListener('click', prevSlide);
nextBtn.addEventListener('click', nextSlide);

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
    e.preventDefault();
    nextSlide();
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    prevSlide();
  } else if (e.key === 'Home') {
    e.preventDefault();
    showSlide(0);
  } else if (e.key === 'End') {
    e.preventDefault();
    showSlide(totalSlides - 1);
  }
});

// Touch/swipe support for mobile
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  const swipeThreshold = 50;
  const diff = touchStartX - touchEndX;

  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0) {
      // Swipe left - next slide
      nextSlide();
    } else {
      // Swipe right - prev slide
      prevSlide();
    }
  }
}

// Initialize
showSlide(0);
