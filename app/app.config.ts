export default defineAppConfig({
  brand: {
    name: 'MAXIFIED',
    /**
     * The wordmark artwork. The SVG is used on screen; the PNG is for places that
     * need a raster file, such as search-engine structured data.
     */
    logo: {
      svg: '/images/maxified-final.svg',
      png: '/images/maxified-final-transparent.png',
      width: 1715,
      height: 260
    },
    tagline: 'Built from experience.'
  },
  /**
   * Every photograph on the site. A slot with an empty `src` renders as a labelled
   * "photo to come" plate showing its brief, never as a stand-in image. To go live,
   * drop the file into `public/images/`, set `src`, and confirm `alt` (and `taken`
   * for the progress pair). Export at 1600px on the long edge, portrait orientation.
   * `position` is the CSS object-position used when the frame crops the photo.
   */
  photos: {
    /** The hero's before/after pair. Shoot both the same way so the crops compare honestly. */
    then: {
      src: '',
      alt: 'Maxi at the start of training',
      position: 'center 25%',
      /** When the photo was taken, as you want it shown, e.g. "March 2021". */
      taken: '',
      title: 'Early progress photo',
      brief: 'Your earliest real photo. Front-on, relaxed, the same framing as the current photo.'
    },
    now: {
      src: '',
      alt: 'Maxi today',
      position: 'center 25%',
      taken: '',
      title: 'Current progress photo',
      brief: 'Same pose, distance and light as the early photo, so the two crops compare honestly.'
    },
    /** The story section's two carousels, each in display order. Add or remove entries freely. */
    gallery: {
      /** Where I started: genuine photos from the early days, unedited. */
      then: [
        {
          src: '',
          alt: 'Maxi from the front at the start of training',
          position: 'center 25%',
          title: 'Early front',
          brief: 'A real photo from when you started. A mirror selfie or casual snap is fine. Unedited.'
        },
        {
          src: '',
          alt: 'Maxi side-on at the start of training',
          position: 'center 25%',
          title: 'Early side',
          brief: 'Side-on, from the same period. Unedited.'
        },
        {
          src: '',
          alt: 'Maxi in the first months of training',
          position: 'center 30%',
          title: 'Early days',
          brief: 'Any other genuine photo from your first months, at the gym or in everyday clothes.'
        }
      ],
      /** Where I am now: the current physique. */
      now: [
        {
          src: '',
          alt: 'Maxi in a white tank and black trousers against a plain backdrop',
          position: 'center 20%',
          title: 'Editorial portrait',
          brief: 'Waist-up or three-quarter length. Neutral backdrop, warm side light, white tank, black trousers. Face and physique both visible.'
        },
        {
          src: '',
          alt: 'Maxi from the back, showing back and shoulder development',
          position: 'center 30%',
          title: 'Back',
          brief: 'Relaxed back pose against the same backdrop and light as the portrait.'
        },
        {
          src: '',
          alt: 'Maxi side-on in an open shirt',
          position: 'center 25%',
          title: 'Side profile',
          brief: 'Side-on, open shirt, relaxed stance. Warm directional light from the front.'
        },
        {
          src: '',
          alt: 'Maxi training',
          position: 'center 35%',
          title: 'Training',
          brief: 'Mid-set or between sets, natural light. Real session, not staged.'
        }
      ]
    }
  },
  ui: {
    colors: {
      primary: 'lime',
      neutral: 'sand'
    }
  }
})
