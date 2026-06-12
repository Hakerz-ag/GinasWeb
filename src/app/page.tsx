import { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: "Gina's Tennis World — Indoor Tennis Club in Berkeley Heights, NJ",
  description:
    'Welcome to Gina\'s Tennis World! Indoor tennis courts, clinics for all ages, ACE Attack training system (exclusive in NJ), and court rentals. Spring 2026 clinic signups now open!',
};

export default function HomePage() {
  return <HomeClient />;
}