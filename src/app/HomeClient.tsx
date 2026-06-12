'use client';

import Link from 'next/link';
import LayoutShell from '@/components/LayoutShell';
import { videos, introVideo, featuredVideos, instructionalVideos } from '@/data/videos';
import { staff } from '@/data/staff';
import { useAuth } from '@/context/AuthContext';
import {
  Play,
  Calendar,
  Users,
  Trophy,
  ChevronRight,
  Star,
  MapPin,
  Zap,
  Target,
  ArrowRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function HomeClient() {
  const { isAuthenticated } = useAuth();
  const [showIntro, setShowIntro] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);

  const galleryImages = [
    { src: '/IMG_0566.jpeg', alt: 'Families enjoying tennis together' },
    { src: '/IMG_0651.jpeg', alt: 'Kids learning and having fun on court' },
    { src: '/IMG_1156.jpeg', alt: 'Family tennis time at Gina\'s' },
    { src: '/IMG_1171.jpeg', alt: 'Juniors developing their skills' },
    { src: '/IMG_1241.jpeg', alt: 'Parents and kids on the court' },
    { src: '/IMG_1312.jpeg', alt: 'Community and connection through tennis' },
    { src: '/IMG_1595.jpeg', alt: 'Family fun at Gina\'s Tennis World' },
    { src: '/IMG_1599.jpg', alt: 'Next generation of tennis players' },
    { src: '/IMG_8764.JPG', alt: 'Making memories on the court' },
  ];

  const reviews = [
    { name: 'Sarah M.', role: 'Adult Clinic Student', text: 'Gina\'s Tennis World has completely transformed my game. The coaches are patient, knowledgeable, and truly care about every student\'s progress. I went from a complete beginner to playing competitive matches in just one season!' },
    { name: 'David R.', role: 'Parent of Junior Student', text: 'My daughter has been taking junior clinics here for two years and absolutely loves it. The coaches make learning fun while still pushing the kids to improve. Best tennis program in the area!' },
    { name: 'Maria L.', role: 'Court Rental Customer', text: 'The indoor courts are always in great condition. Booking is easy and the 30-week contract gives us a guaranteed spot every week. It\'s our family\'s go-to for tennis year-round.' },
    { name: 'Tom K.', role: 'Adult Intermediate Student', text: 'Wendy\'s intermediate clinics are fantastic. She breaks down strategy in a way that finally clicked for me. My doubles game has improved dramatically since I started training here.' },
    { name: 'Jennifer P.', role: 'Parent of Junior Student', text: 'Phil makes every lesson fun for the kids. My son used to dread sports activities, but now he counts down the days until tennis class. The junior program here is truly special.' },
    { name: 'Mike H.', role: 'Adult Beginner Student', text: 'I was nervous to start tennis in my 40s, but the beginner clinic was so welcoming. No judgment, great instruction, and I met some wonderful people. Highly recommend!' },
  ];

  // Auto-rotate carousels
  useEffect(() => {
    const galleryTimer = setInterval(() => {
      setGalleryIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
    }, 4000);
    const reviewTimer = setInterval(() => {
      setReviewIndex((prev) => (prev === reviews.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => { clearInterval(galleryTimer); clearInterval(reviewTimer); };
  }, [galleryImages.length, reviews.length]);

  return (
    <LayoutShell>
      {/* ===== HERO SECTION ===== */}
      <section className="relative bg-gradient-to-br from-green-900 via-green-800 to-green-900 overflow-hidden">
        {/* Decorative tennis ball pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full border-4 border-yellow-400" />
          <div className="absolute top-40 right-20 w-24 h-24 rounded-full border-4 border-yellow-400" />
          <div className="absolute bottom-20 left-1/3 w-20 h-20 rounded-full border-4 border-yellow-400" />
          <div className="absolute bottom-40 right-10 w-16 h-16 rounded-full border-4 border-yellow-400" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
                <Star className="w-4 h-4" />
                Spring 2026 Clinic Signups Now Open!
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
                Welcome to{' '}
                <span className="text-yellow-400">Gina's</span>
                <br />
                Tennis World
              </h1>
              <p className="mt-4 text-green-200 text-lg md:text-xl leading-relaxed max-w-lg">
                Indoor tennis club in Berkeley Heights, NJ. Clinics for all ages, court rentals,
                and the exclusive <strong className="text-yellow-400">ACE Attack</strong> training
                system — the first and only one in New Jersey.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href={isAuthenticated ? '/classes' : '/register'} className="btn-yellow text-base">
                  <Calendar className="w-5 h-5 inline mr-2" />
                  Schedule a Class
                </Link>
                <Link href={isAuthenticated ? '/book' : '/register'} className="btn-yellow text-base">
                  <MapPin className="w-5 h-5 inline mr-2" />
                  Book a Court
                </Link>
              </div>
            </div>

            {/* Intro Video Card */}
            <div className="relative">
              <div className="bg-green-800/50 backdrop-blur-sm rounded-3xl p-4 border border-green-700/50">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
                  {showIntro ? (
                    introVideo.localVideo ? (
                      <video
                        src={introVideo.localVideo}
                        title={introVideo.title}
                        autoPlay
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <iframe
                        src={`https://www.youtube.com/embed/${introVideo.youtubeId}?autoplay=1`}
                        title={introVideo.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    )
                  ) : (
                    <button
                      onClick={() => setShowIntro(true)}
                      className="w-full h-full group relative"
                    >
                      {introVideo.localVideo ? (
                        <video
                          src={introVideo.localVideo}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={introVideo.thumbnail}
                          alt={introVideo.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                          <Play className="w-8 h-8 text-green-900 ml-1" fill="currentColor" />
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <span className="inline-block bg-yellow-500 text-green-900 text-xs font-bold px-3 py-1 rounded-full mb-2">
                          🎬 INTRO VIDEO
                        </span>
                        <p className="text-white font-semibold text-lg">
                          {introVideo.title}
                        </p>
                        <p className="text-green-200 text-sm mt-1">
                          A special welcome message from Gina for new guests
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES STRIP ===== */}
      <section className="bg-yellow-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { icon: Users, label: 'Junior Clinics', sub: 'Ages 6-17' },
              { icon: Users, label: 'Adult Clinics', sub: 'All skill levels' },
              { icon: Target, label: 'Private Lessons', sub: '1-on-1 coaching' },
              { icon: Calendar, label: 'Court Rentals', sub: 'Year-round indoor' },
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center gap-1 py-2">
                <f.icon className="w-6 h-6 text-green-900" />
                <p className="font-bold text-green-900 text-sm">{f.label}</p>
                <p className="text-green-800 text-xs">{f.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== GALLERY & REVIEWS ===== */}
      <section className="bg-green-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Image Carousel */}
            <div>
              <div className="text-center md:text-left mb-6">
                <span className="inline-block bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
                  Gallery
                </span>
                <h2 className="section-heading">Our Community</h2>
                <p className="section-subheading">Families making memories at Gina's Tennis World</p>
              </div>
              <div className="relative">
                <div className="overflow-hidden rounded-2xl shadow-lg">
                  <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${galleryIndex * 100}%)` }}
                  >
                    {galleryImages.map((img, idx) => (
                      <div key={idx} className="w-full shrink-0">
                        <div className="aspect-[4/3] bg-green-200 relative">
                          <img
                            src={img.src}
                            alt={img.alt}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                            <p className="text-white font-semibold text-sm">{img.alt}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setGalleryIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-green-900 rotate-180" />
                </button>
                <button
                  onClick={() => setGalleryIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-green-900" />
                </button>
                <div className="flex justify-center gap-2 mt-4">
                  {galleryImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setGalleryIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        idx === galleryIndex ? 'bg-green-600' : 'bg-green-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Reviews Carousel */}
            <div>
              <div className="text-center md:text-left mb-6">
                <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
                  Reviews
                </span>
                <h2 className="section-heading">What Our Players Say</h2>
                <p className="section-subheading">Trusted by families across Berkeley Heights</p>
              </div>
              <div className="relative">
                <div className="overflow-hidden rounded-2xl">
                  <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${reviewIndex * 100}%)` }}
                  >
                    {reviews.map((review, idx) => (
                      <div key={idx} className="w-full shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 md:p-8">
                          <div className="flex items-center gap-1 mb-3">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            ))}
                          </div>
                          <p className="text-gray-700 leading-relaxed mb-4 text-sm md:text-base">
                            &ldquo;{review.text}&rdquo;
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="font-bold text-green-700">{review.name.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-green-900 text-sm">{review.name}</p>
                              <p className="text-xs text-gray-500">{review.role}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setReviewIndex((prev) => (prev === 0 ? reviews.length - 1 : prev - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-green-900 rotate-180" />
                </button>
                <button
                  onClick={() => setReviewIndex((prev) => (prev === reviews.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-green-900" />
                </button>
                <div className="flex justify-center gap-2 mt-4">
                  {reviews.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setReviewIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        idx === reviewIndex ? 'bg-yellow-500' : 'bg-yellow-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== VIDEO FEATURE SECTION ===== */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
              Video Feature
            </span>
            <h2 className="section-heading">Learn from the Experts</h2>
            <p className="section-subheading max-w-2xl mx-auto">
              Watch instructional videos from Gina and her team. Improve your game with
              expert tips on strokes, footwork, and strategy.
            </p>
          </div>

          {/* Featured Videos — Use Your Legs & How To Run Your Opponent */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {featuredVideos.map((video) => (
              <VideoCard key={video.id} video={video} featured />
            ))}
          </div>

          {/* Instructional Videos Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {instructionalVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/videos"
              className="btn-secondary inline-flex items-center gap-2"
            >
              View All Videos
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== ACE ATTACK SECTION ===== */}
      <section className="bg-gradient-to-br from-green-800 to-green-900 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block bg-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                ⚡ Exclusive in New Jersey
              </span>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
                ACE Attack <span className="text-yellow-400">Training System</span>
              </h2>
              <p className="text-green-200 text-lg leading-relaxed mb-6">
                Gina's Tennis World is the <strong className="text-yellow-400">first and only</strong> facility
                in New Jersey to offer the ACE Attack training system. This cutting-edge technology
                provides real-time feedback and targeted drills to accelerate your improvement.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Real-time stroke analysis',
                  'Targeted power training',
                  'Precision placement drills',
                  'Game-situation simulations',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-green-100">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center shrink-0">
                      <Trophy className="w-3.5 h-3.5 text-green-900" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/classes" className="btn-yellow">
                Try ACE Attack
                <ArrowRight className="w-5 h-5 inline ml-2" />
              </Link>
            </div>
            <div className="bg-green-700/50 rounded-3xl p-4 border border-green-600/50">
              <div className="aspect-video rounded-2xl overflow-hidden bg-green-900">
                <video
                  src="/videos/the-ace-attack.mp4"
                  title="ACE Attack Training System"
                  controls
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROGRAMS SECTION ===== */}
      <section className="bg-green-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
              Programs
            </span>
            <h2 className="section-heading">Clinics & Classes for Everyone</h2>
            <p className="section-subheading max-w-2xl mx-auto">
              Whether you&apos;re picking up a racquet for the first time or competing in tournaments,
              we have a program for you.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Junior Clinics',
                desc: 'Fun, structured programs for kids ages 6-17. Learn fundamentals, develop competitive skills, and build a love for the game.',
                icon: '🎾',
                color: 'bg-green-600',
              },
              {
                title: 'Adult Clinics',
                desc: 'Beginner through advanced. Improve your strokes, strategy, and fitness in a supportive group environment.',
                icon: '💪',
                color: 'bg-green-700',
              },
              {
                title: 'Private Lessons',
                desc: 'One-on-one instruction tailored to your specific needs. Fastest way to improve your game.',
                icon: '🎯',
                color: 'bg-green-800',
              },
              {
                title: 'Court Rentals',
                desc: 'Book our indoor courts for practice, parties, or events. Year-round availability.',
                icon: '🏟️',
                color: 'bg-green-600',
              },
            ].map((program) => (
              <div
                key={program.title}
                className="card p-6"
              >
                <div className="text-3xl mb-3">{program.icon}</div>
                <h3 className="font-bold text-green-900 text-lg mb-2">
                  {program.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">{program.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STAFF SECTION ===== */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
              Our Team
            </span>
            <h2 className="section-heading">Meet Our Staff</h2>
            <p className="section-subheading max-w-2xl mx-auto">
              Our experienced instructors are passionate about helping you improve your game.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {staff.map((member) => (
              <div key={member.id} className="card p-6 text-center">
                <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden border-3 border-green-200">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-green-100 flex items-center justify-center">
                      <span className="text-3xl font-bold text-green-700">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-green-900 text-lg">{member.name}</h3>
                <p className="text-yellow-600 font-semibold text-sm mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{member.bio}</p>
                {member.certifications && (
                  <div className="mt-3 flex flex-wrap justify-center gap-1">
                    {member.certifications.map((cert) => (
                      <span
                        key={cert}
                        className="inline-block bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/staff" className="btn-secondary inline-flex items-center gap-2">
              Learn More About Our Team
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== NEW COURT SECTION ===== */}
      <section className="bg-gradient-to-r from-yellow-400 to-yellow-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-green-900 mb-3">
            🏗️ New Court Opening September 2026!
          </h2>
          <p className="text-green-800 text-lg mb-6 max-w-2xl mx-auto">
            Gina's Tennis World is expanding! Construction is underway for Court 3.
            Grand opening planned for September 2026. New morning and evening slots will be available!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/book" className="btn-primary">
              Reserve Court Time
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="bg-green-900 py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Ready to Get on the Court?
          </h2>
          <p className="text-green-200 text-lg mb-8 max-w-2xl mx-auto">
            Spring 2026 clinic signups are now being accepted. New students will be placed on a
            waitlist for available openings. Sign up today!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href={isAuthenticated ? '/classes' : '/register'} className="btn-yellow text-lg">
              Sign Up for Clinics
            </Link>
            <Link href={isAuthenticated ? '/book' : '/register'} className="btn-yellow text-lg">
              Book a Court
            </Link>
          </div>
        </div>
      </section>
    </LayoutShell>
  );
}

function VideoCard({
  video,
  featured = false,
}: {
  video: { id: string; title: string; description: string; youtubeId?: string; localVideo?: string; thumbnail: string; category: string };
  featured?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const isLocal = !!video.localVideo;

  return (
    <div className={`card overflow-hidden group ${featured ? '' : ''}`}>
      <div className={`relative ${featured ? 'aspect-video' : 'aspect-video'}`}>
        {playing ? (
          isLocal ? (
            <video
              src={video.localVideo}
              title={video.title}
              autoPlay
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <iframe
              src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          )
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="w-full h-full relative"
          >
            {isLocal ? (
              <video
                src={video.localVideo}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                muted
                preload="metadata"
              />
            ) : (
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            )}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="w-14 h-14 bg-yellow-500 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 text-green-900 ml-0.5" fill="currentColor" />
              </div>
            </div>
            {video.category === 'featured' && (
              <span className="absolute top-3 left-3 bg-yellow-500 text-green-900 text-xs font-bold px-2 py-1 rounded-full">
                ⭐ Featured
              </span>
            )}
            {video.category === 'intro' && (
              <span className="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                🎬 Intro
              </span>
            )}
          </button>
        )}
      </div>
      <div className="p-4">
        <h3 className={`font-bold text-green-900 ${featured ? 'text-lg' : 'text-sm'}`}>
          {video.title}
        </h3>
        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{video.description}</p>
      </div>
    </div>
  );
}