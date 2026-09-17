// Testimonial carousel
// The track scrolls natively; the arrows page through it.
//
// Paging is driven by measured card positions rather than by arithmetic on a
// card width, because a card that is only partly in view must become the first
// card of the next page instead of being scrolled past. Anything computed from
// "cards per page x card width" skips that partial card whenever the cards
// don't tile the track exactly.

// Tolerance for sub-pixel layout rounding when deciding "is this card fully visible".
const EPSILON = 2;

class TestimonialCarousel {
  constructor(root) {
    try {
      this.root = root;
      this.track = root.querySelector('[data-stories-track]');
      this.items = this.track ? Array.from(this.track.children) : [];
      this.prevButton = root.querySelector('[data-stories-prev]');
      this.nextButton = root.querySelector('[data-stories-next]');
      this.status = root.querySelector('[data-stories-status]');

      if (!this.track || this.items.length === 0) return;

      this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.positions = [];
      this.statusText = '';

      this.init();
    } catch (error) {
      console.error('Error initializing testimonial carousel:', error);
    }
  }

  init() {
    try {
      if (this.prevButton) {
        this.prevButton.addEventListener('click', () => this.go(-1));
      }
      if (this.nextButton) {
        this.nextButton.addEventListener('click', () => this.go(1));
      }

      this.track.addEventListener('scroll', () => this.onScroll(), { passive: true });

      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => this.measure(), 150);
      });

      this.measure();
    } catch (error) {
      console.error('Error setting up testimonial carousel event listeners:', error);
    }
  }

  // Card edges in the track's scroll coordinate space. These only change on
  // layout, not on scroll, so they're cached rather than remeasured per event.
  measure() {
    const trackRect = this.track.getBoundingClientRect();
    const { scrollLeft } = this.track;

    this.positions = this.items.map((item) => {
      const rect = item.getBoundingClientRect();
      return {
        left: rect.left - trackRect.left + scrollLeft,
        right: rect.right - trackRect.left + scrollLeft,
      };
    });

    this.onScroll();
  }

  go(direction) {
    if (this.positions.length === 0) return;

    const eps = EPSILON;
    const viewLeft = this.track.scrollLeft;
    const viewWidth = this.track.clientWidth;
    const viewRight = viewLeft + viewWidth;
    let target;

    if (direction > 0) {
      // First card not yet fully visible — a partially cut off card leads the
      // next page rather than being skipped over.
      target = this.positions.findIndex((pos) => pos.right > viewRight + eps);
    } else {
      // Last card starting before the current view, then walk back as far as
      // still fits in one screen, so paging back mirrors paging forward.
      target = -1;
      for (let i = this.positions.length - 1; i >= 0; i -= 1) {
        if (this.positions[i].left < viewLeft - eps) {
          target = i;
          break;
        }
      }
      if (target < 0) return;

      const pageEnd = this.positions[target].right;
      while (target > 0 && pageEnd - this.positions[target - 1].left <= viewWidth + eps) {
        target -= 1;
      }
    }

    if (target < 0) return;

    // scrollIntoView honours the track's scroll-padding, which keeps the
    // leading card's offset shadow from being clipped at the scrollport edge.
    this.items[target].scrollIntoView({
      behavior: this.reduceMotion ? 'auto' : 'smooth',
      inline: 'start',
      block: 'nearest',
    });
  }

  onScroll() {
    const maxScroll = this.track.scrollWidth - this.track.clientWidth;

    if (this.prevButton) this.prevButton.disabled = this.track.scrollLeft <= 1;
    if (this.nextButton) this.nextButton.disabled = this.track.scrollLeft >= maxScroll - 1;

    this.updateStatus();
  }

  updateStatus() {
    if (!this.status || this.positions.length === 0) return;

    const eps = EPSILON;
    const viewLeft = this.track.scrollLeft;
    const viewRight = viewLeft + this.track.clientWidth;

    const visible = [];
    this.positions.forEach((pos, i) => {
      if (pos.left >= viewLeft - eps && pos.right <= viewRight + eps) visible.push(i);
    });
    if (visible.length === 0) return;

    const first = visible[0] + 1;
    const last = visible[visible.length - 1] + 1;
    const text = first === last
      ? `Showing story ${first} of ${this.items.length}`
      : `Showing stories ${first}–${last} of ${this.items.length}`;

    if (text !== this.statusText) {
      this.statusText = text;
      this.status.textContent = text;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const viewer = document.querySelector('[data-stories]');
  if (viewer) {
    window.testimonialCarousel = new TestimonialCarousel(viewer);
  }
});
