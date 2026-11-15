// Add or update artists here. Each artist needs:
//   slug: lowercase, no spaces, matches their images/artists/<slug>/ folder
//   name, role: shown in their header
//   bio: replace the placeholder text once the artist sends their own
//   portrait: path to a headshot photo — leave as null until they send one
//   photos: list of their work, already in images/artists/<slug>/
// After adding photos, run make-thumbs.ps1 so the site has small previews of them.
const ARTISTS = [
  {
    slug: 'chief',
    name: 'Chief',
    role: 'Custom sleeves · black & grey and color',
    bio: 'PLACEHOLDER BIO — replace with Chief\'s own words: background, years tattooing, specialty, notable work.',
    portrait: null,
    photos: [
      'images/artists/chief/1.jpg', 'images/artists/chief/2.jpg', 'images/artists/chief/3.jpg', 'images/artists/chief/4.jpg',
      'images/artists/chief/5.jpg', 'images/artists/chief/6.jpg', 'images/artists/chief/7.jpg', 'images/artists/chief/8.jpg'
    ]
  },
  {
    slug: 'fernando',
    name: 'Fernando',
    role: 'Black & grey realism',
    bio: 'PLACEHOLDER BIO — replace with Fernando\'s own words: background, years tattooing, specialty, notable work.',
    portrait: null,
    photos: [
      'images/artists/fernando/1.jpg', 'images/artists/fernando/2.jpg', 'images/artists/fernando/3.jpg', 'images/artists/fernando/4.jpg',
      'images/artists/fernando/5.jpg', 'images/artists/fernando/6.jpg', 'images/artists/fernando/7.jpg', 'images/artists/fernando/8.jpg'
    ]
  },
  {
    slug: 'nyah',
    name: 'Nyah',
    role: 'Fine line & illustrative',
    bio: 'PLACEHOLDER BIO — replace with Nyah\'s own words: background, years tattooing, specialty, notable work.',
    portrait: null,
    photos: [
      'images/artists/nyah/1.jpg', 'images/artists/nyah/2.jpg', 'images/artists/nyah/3.jpg', 'images/artists/nyah/4.jpg',
      'images/artists/nyah/5.jpg', 'images/artists/nyah/6.jpg', 'images/artists/nyah/7.jpg', 'images/artists/nyah/8.jpg'
    ]
  },
  {
    slug: 'veronika',
    name: 'Veronika',
    role: 'Watercolor color work & florals',
    bio: 'PLACEHOLDER BIO — replace with Veronika\'s own words: background, years tattooing, specialty, notable work.',
    portrait: null,
    photos: [
      'images/artists/veronika/1.jpg', 'images/artists/veronika/2.jpg', 'images/artists/veronika/3.jpg', 'images/artists/veronika/4.jpg',
      'images/artists/veronika/5.jpg', 'images/artists/veronika/6.jpg', 'images/artists/veronika/7.jpg', 'images/artists/veronika/8.jpg'
    ]
  },
  {
    slug: 'jessi',
    name: 'Jessi',
    role: 'Illustrative color & red-and-black',
    bio: 'PLACEHOLDER BIO — replace with Jessi\'s own words: background, years tattooing, specialty, notable work.',
    portrait: null,
    photos: [
      'images/artists/jessi/1.jpg', 'images/artists/jessi/2.jpg', 'images/artists/jessi/3.jpg', 'images/artists/jessi/4.jpg',
      'images/artists/jessi/5.jpg', 'images/artists/jessi/6.jpg', 'images/artists/jessi/7.jpg', 'images/artists/jessi/8.jpg'
    ]
  },
  {
    slug: 'batu',
    name: 'Batu',
    role: 'Portraits & black and grey realism',
    bio: 'PLACEHOLDER BIO — replace with Batu\'s own words: background, years tattooing, specialty, notable work.',
    portrait: null,
    photos: [
      'images/artists/batu/1.jpg', 'images/artists/batu/2.jpg', 'images/artists/batu/3.jpg', 'images/artists/batu/4.jpg',
      'images/artists/batu/5.jpg', 'images/artists/batu/6.jpg', 'images/artists/batu/7.jpg', 'images/artists/batu/8.jpg'
    ]
  },
  {
    slug: 'mani',
    name: 'Mani',
    role: 'Large-scale black & grey and color realism',
    bio: 'PLACEHOLDER BIO — replace with Mani\'s own words: background, years tattooing, specialty, notable work.',
    portrait: null,
    photos: [
      'images/artists/mani/1.jpg', 'images/artists/mani/2.jpg', 'images/artists/mani/3.jpg', 'images/artists/mani/4.jpg',
      'images/artists/mani/5.jpg', 'images/artists/mani/6.jpg', 'images/artists/mani/7.jpg', 'images/artists/mani/8.jpg'
    ]
  }
];

// Small preview of a photo (images/thumbs/...), made by make-thumbs.ps1.
// Pages show the preview and keep the full photo for the lightbox.
function thumbOf(src) {
  return src.replace('images/artists/', 'images/thumbs/');
}

// <img> markup for a preview that falls back to the full photo if the
// preview hasn't been generated yet.
function thumbImg(src, alt, extra) {
  return '<img src="' + thumbOf(src) + '" data-full="' + src + '" alt="' + (alt || '') + '" loading="lazy" decoding="async"' +
    ' onerror="this.onerror=null;this.src=this.getAttribute(\'data-full\')"' + (extra ? ' ' + extra : '') + '>';
}
