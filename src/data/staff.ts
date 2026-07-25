export interface StaffMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image?: string;
}

export const staff: StaffMember[] = [
  {
    id: 'gina',
    name: 'Gina',
    role: 'Owner/Head Coach',
    bio: 'Gina played on tour, coached 25 nationally ranked juniors, and still enjoys teaching tennis.',
    image: '/gina.png',
  },
  {
    id: 'wendy',
    name: 'Wendy',
    role: 'Tennis Director/Coach',
    bio: 'Wendy is our go-to person for stringing, registration, customer service and instruction.',
    image: '/wendy.png',
  },
  {
    id: 'phil',
    name: 'Phil',
    role: 'Coach',
    bio: 'Phil has been teaching at Gina\'s Tennis World for over 10 years. He makes learning tennis FUN!',
    image: '/phil.png',
  },
  {
    id: 'gregg',
    name: 'Gregg',
    role: 'Coach',
    bio: 'Gregg brings energy and expertise to every session. Bio coming soon!',
    image: '/gregg.png',
  },
];

export const clubInfo = {
  name: "Gina's Tennis World",
  tagline: 'Indoor Tennis Club — Berkeley Heights, NJ',
  address: '649 Springfield Ave, Berkeley Heights, NJ 07922',
  phone: '908-464-9591',
  email: 'GinasTennisWorld@gmail.com',
  hours: {
    weekdays: '7:00 AM – 10:00 PM',
    weekends: '8:00 AM – 9:00 PM',
  },
  social: {
    facebook: 'https://www.facebook.com/Ginas-Tennis-World-171311616218044/',
    youtube: 'https://www.youtube.com/channel/UCvqyp7DVOLqAAbHzKkx6Z0Q',
    instagram: 'https://www.instagram.com/ginastennisworld',
    tiktok: 'https://www.tiktok.com/@ginastennisworld',
  },
  features: [
    'Indoor courts — play year-round',
    'ACE Attack training system — exclusive in NJ',
    'Ball machine for stroke grooving',
    'Junior & adult clinics',
    'Private & semi-private lessons',
    'Court rentals & contract time',
  ],
};