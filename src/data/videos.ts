// Video data for Gina's Tennis World
// All videos are served via YouTube embeds — much lighter on Vercel than hosting MP4s
// YouTube channel: https://www.youtube.com/channel/UCvqyp7DVOLqAAbHzKkx6Z0Q

export interface Video {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  thumbnail: string;
  category: 'intro' | 'featured' | 'instructional';
  duration?: string;
}

export const videos: Video[] = [
  // === INTRO ===
  {
    id: 'v1',
    title: 'Welcome to Gina\'s Tennis World',
    description: 'Gina warmly welcomes new guests and introduces everything the club has to offer — indoor courts, clinics, the ACE Attack system, and more. A must-watch for first-time visitors!',
    youtubeId: 'QPgkCslXxng',
    thumbnail: 'https://img.youtube.com/vi/QPgkCslXxng/maxresdefault.jpg',
    category: 'intro',
  },

  // === FEATURED ===
  {
    id: 'v2',
    title: 'Day in the Life at Gina\'s Tennis World',
    description: 'Experience a day at Gina\'s Tennis World! See what makes this club special — from morning clinics to evening matches, get an inside look at the energy and community.',
    youtubeId: 'nmdvn33SYG0',
    thumbnail: 'https://img.youtube.com/vi/nmdvn33SYG0/maxresdefault.jpg',
    category: 'featured',
  },
  {
    id: 'v3',
    title: 'The ACE Attack!',
    description: 'The ACE Attack system is exclusive to Gina\'s Tennis World — the first and only one in New Jersey! Watch this video to see how it transforms your training and game.',
    youtubeId: '2Eko0jiTFkY',
    thumbnail: 'https://img.youtube.com/vi/2Eko0jiTFkY/maxresdefault.jpg',
    category: 'featured',
  },
  {
    id: 'v4',
    title: 'Use Your Legs',
    description: 'Generate power in your strokes by using your legs! The featured video from Gina\'s website — proper leg engagement is the key to explosive shot-making.',
    youtubeId: 'QPgkCslXxng',
    thumbnail: 'https://img.youtube.com/vi/QPgkCslXxng/maxresdefault.jpg',
    category: 'featured',
  },
  {
    id: 'v5',
    title: 'How To Run Your Opponent',
    description: 'Learn how to move your opponent around the court to create openings and win more points. A strategic must-watch!',
    youtubeId: 'nmdvn33SYG0',
    thumbnail: 'https://img.youtube.com/vi/nmdvn33SYG0/maxresdefault.jpg',
    category: 'featured',
  },

  // === INSTRUCTIONAL ===
  {
    id: 'v6',
    title: 'Watch The Ball',
    description: 'The most fundamental skill in tennis — keeping your eyes on the ball through contact. Gina breaks down why this matters and how to practice it.',
    youtubeId: '2Eko0jiTFkY',
    thumbnail: 'https://img.youtube.com/vi/2Eko0jiTFkY/maxresdefault.jpg',
    category: 'instructional',
  },
  {
    id: 'v7',
    title: 'Where Do You Stand to Return Serve',
    description: 'Court positioning for returning serve can make or break your game. Learn the optimal stance and positioning for different serve types.',
    youtubeId: 'AxvC2b07Hg8',
    thumbnail: 'https://img.youtube.com/vi/AxvC2b07Hg8/maxresdefault.jpg',
    category: 'instructional',
  },
  {
    id: 'v8',
    title: 'There Is No Strike Zone In Tennis',
    description: 'Unlike baseball, tennis has no defined strike zone. Gina explains how to adjust your contact point and why it changes everything.',
    youtubeId: 'I1il7RaYM2Q',
    thumbnail: 'https://img.youtube.com/vi/I1il7RaYM2Q/maxresdefault.jpg',
    category: 'instructional',
  },
  {
    id: 'v9',
    title: 'Tuning Your Service Toss',
    description: 'A consistent serve starts with a consistent toss. Learn how to dial in your toss for power, spin, and placement.',
    youtubeId: 'NUm-tucWZ74',
    thumbnail: 'https://img.youtube.com/vi/NUm-tucWZ74/maxresdefault.jpg',
    category: 'instructional',
  },
  {
    id: 'v10',
    title: 'Vary The Speed Of Your Motion, Not Your Swing',
    description: 'Change up your game by varying motion speed while keeping your swing consistent. A key tip for keeping opponents off balance.',
    youtubeId: 'RMkl0Cbf-78',
    thumbnail: 'https://img.youtube.com/vi/RMkl0Cbf-78/maxresdefault.jpg',
    category: 'instructional',
  },
  {
    id: 'v11',
    title: 'Working With Your Child',
    description: 'Tips for parents on how to practice tennis with your child effectively — keeping it fun, productive, and positive.',
    youtubeId: 'WJOrViBTfzE',
    thumbnail: 'https://img.youtube.com/vi/WJOrViBTfzE/maxresdefault.jpg',
    category: 'instructional',
  },
  {
    id: 'v12',
    title: 'Strengthen Your Volley',
    description: 'Build a stronger, more reliable volley. Gina covers grip, footwork, and punch technique for dominating at the net.',
    youtubeId: 'Xfx9K-neQVg',
    thumbnail: 'https://img.youtube.com/vi/Xfx9K-neQVg/maxresdefault.jpg',
    category: 'instructional',
  },
  {
    id: 'v13',
    title: 'Service Toss, How High',
    description: 'How high should your service toss be? Gina explains the ideal toss height and how it affects different types of serves.',
    youtubeId: 'bOeQGAw-yOc',
    thumbnail: 'https://img.youtube.com/vi/bOeQGAw-yOc/maxresdefault.jpg',
    category: 'instructional',
  },
  {
    id: 'v14',
    title: 'Winning Return of Serve',
    description: 'Turn your returns into weapons. Learn positioning, preparation, and shot selection for a dominant return game.',
    youtubeId: 'wmf0SpTpKY0',
    thumbnail: 'https://img.youtube.com/vi/wmf0SpTpKY0/maxresdefault.jpg',
    category: 'instructional',
  },
];

export const introVideo = videos.find(v => v.category === 'intro')!;
export const featuredVideos = videos.filter(v => v.category === 'featured');
export const instructionalVideos = videos.filter(v => v.category === 'instructional');