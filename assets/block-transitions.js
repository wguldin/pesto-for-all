// Block Transitions Manager
class BlockTransitions {
  constructor() {
    this.observer = null;
    this.blocks = null;
    this.init();
  }

  init() {
    try {
      this.blocks = document.querySelectorAll('.block, .hero__content');
      const hero = document.querySelector('.hero__content');
      
      // Show first block after hero immediately
      if (hero) {
        const firstBlock = hero.nextElementSibling;
        if (firstBlock && firstBlock.classList.contains('block')) {
          firstBlock.classList.add('is-visible');
          // Also make the text visible immediately
          const blockText = firstBlock.querySelector('.block__text');
          if (blockText) {
            blockText.style.opacity = '1';
            blockText.style.transition = 'none';
          }
        }
      }
      
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });

      this.blocks.forEach(block => {
        this.observer.observe(block);
      });

      // Clean up on page unload
      window.addEventListener('beforeunload', () => this.cleanup());
      
    } catch (error) {
      console.error('Error initializing block transitions:', error);
    }
  }

  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.blockTransitions = new BlockTransitions();
}); 