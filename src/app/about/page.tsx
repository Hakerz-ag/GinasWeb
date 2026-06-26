import LayoutShell from '@/components/LayoutShell';

export default function AboutPage() {
  return (
    <LayoutShell>
      <section className="max-w-4xl mx-auto py-20 px-4">
        <h1 className="text-4xl font-extrabold text-green-900 mb-4">About Gina's Tennis World</h1>
        <p className="text-gray-700 mb-6">
          Gina's Tennis World is a family-focused indoor tennis club in Berkeley Heights, NJ. We offer
          junior and adult clinics, private lessons, and court rentals year-round. Our mission is to
          provide welcoming, high-quality instruction and a supportive community for players of all ages and levels.
        </p>
        <h2 className="text-2xl font-bold text-green-900 mt-6 mb-2">Our Approach</h2>
        <p className="text-gray-700 mb-4">
          We emphasize skill development, sportsmanship, and fun. Our ACE Attack training system
          provides real-time feedback to help players accelerate improvement. We also offer family-friendly
          programming to encourage multi-generational participation.
        </p>
        <h2 className="text-2xl font-bold text-green-900 mt-6 mb-2">Get In Touch</h2>
        <p className="text-gray-700">
          Phone: (908) 555-0123
        </p>
      </section>
    </LayoutShell>
  );
}
