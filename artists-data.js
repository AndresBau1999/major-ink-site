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
    bio: "Chief is a Miami tattoo artist who builds custom pieces from the ground up, and sleeves are his specialty. He moves between detailed black and grey realism and bold color, and he's known for cover-ups that turn an old tattoo into a full new piece. If you're planning something big, start with Chief.",
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
    bio: "Fernando Lopez brought his craft from Argentina to Miami, and black and grey realism is his language. His book is full of portraits, religious pieces, animals and architecture with soft shading and real depth. He draws his own designs and also does fine line work.",
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
    bio: "Nyah is a licensed South Florida tattoo artist at Major Ink Studios 2. Her work leans fine line and illustrative, from delicate botanicals and animals to soft color pieces, plus her own flash designs. Outside the chair she paints bodies, does henna, and runs her own clothing line, Dose of Creativity.",
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
    bio: "Veronika is a visual artist and tattoo artist who makes art with meaning, intention and love. Inspired by life in Mexico and Europe, she's known for bright, watercolor-style color: flamingos, phoenixes, florals and fairies, plus clean black and grey and cover-ups. She also paints and sells her artwork under Bohemika Art.",
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
    bio: "Jessi draws an individual sketch for every client, so no two of her tattoos are the same. She works across all styles, but her bold red-and-black and illustrative color pieces stand out, along with clean black and grey.",
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
    bio: "Batu Celik is a Turkish-American artist specializing in portraits, black and grey realism and fine line. He's known for lifelike pet and people portraits and detailed realism sleeves, with pieces that nod to his roots, like Istanbul's Galata Tower.",
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
    bio: "Yasmani Vazquez Perez, Mani to his clients, is a Cuban-American artist based in Miramar. He does large-scale realism in black and grey and full color: chest pieces, sleeves, portraits and hand tattoos. He was an official artist at Ink Mania Fest 2026 in Tampa.",
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
