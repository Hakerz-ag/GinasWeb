'use client';

import LayoutShell from '@/components/LayoutShell';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Trophy, Star, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function StudentOfTheMonthPage() {
  const [spotlights, setSpotlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSpotlight()
      .then(res => setSpotlights(res.data || []))
      .catch(err => console.error('Failed to load spotlights:', err))
      .finally(() => setLoading(false));
  }, []);

  const adultSpotlights = spotlights.filter(s => s.is_adult && s.description);
  const teenSpotlights = spotlights.filter(s => !s.is_adult && s.description);

  return (
    <LayoutShell>
      {/* Header */}
      <section className="bg-gradient-to-br from-green-900 to-green-800 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <Trophy className="w-4 h-4" />
            Student Spotlight
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
            Student(s) of the <span className="text-yellow-400">Month</span>
          </h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">
            Celebrating our standout students who demonstrate dedication, improvement, and passion for tennis.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-green-50 py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-green-700 hover:text-green-900 mb-8 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading spotlight...</p>
            </div>
          ) : spotlights.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-700 mb-2">No Spotlight Yet</h2>
              <p className="text-gray-500">Check back soon for our next Student of the Month!</p>
              <Link href="/" className="inline-block mt-6 btn-primary">Return Home</Link>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Adult Spotlight */}
              {adultSpotlights.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-green-900 mb-6 flex items-center gap-2">
                    <Star className="w-6 h-6 text-yellow-500" />
                    Adult Spotlight
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {adultSpotlights.map(s => (
                      <div key={s.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-green-100 hover:shadow-xl transition-shadow">
                        {s.image_path ? (
                          <div className="aspect-[4/3] overflow-hidden">
                            <img
                              src={s.image_path}
                              alt={s.title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="aspect-[4/3] bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                            <Trophy className="w-16 h-16 text-green-400" />
                          </div>
                        )}
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-green-900">{s.title}</h3>
                          {s.description && (
                            <p className="text-gray-600 mt-2 leading-relaxed">{s.description}</p>
                          )}
                          <div className="mt-3 inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                            <Star className="w-3 h-3" /> Adult Spotlight
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Teen Spotlight */}
              {teenSpotlights.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-green-900 mb-6 flex items-center gap-2">
                    <Star className="w-6 h-6 text-yellow-500" />
                    Teen Spotlight
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {teenSpotlights.map(s => (
                      <div key={s.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-blue-100 hover:shadow-xl transition-shadow">
                        {s.image_path ? (
                          <div className="aspect-[4/3] overflow-hidden">
                            <img
                              src={s.image_path}
                              alt={s.title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                            <Trophy className="w-16 h-16 text-blue-400" />
                          </div>
                        )}
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-green-900">{s.title}</h3>
                          {s.description && (
                            <p className="text-gray-600 mt-2 leading-relaxed">{s.description}</p>
                          )}
                          <div className="mt-3 inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                            <Star className="w-3 h-3" /> Teen Spotlight
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 text-center bg-white rounded-2xl p-8 shadow-sm border border-green-100">
            <h3 className="text-xl font-bold text-green-900 mb-2">Want to Be Next Month&apos;s Spotlight?</h3>
            <p className="text-gray-600 mb-4">Join our clinics and show your dedication — you could be our next Student of the Month!</p>
            <Link href="/classes" className="btn-yellow">
              Browse Classes
            </Link>
          </div>
        </div>
      </section>
    </LayoutShell>
  );
}