'use client';

import LayoutShell from '@/components/LayoutShell';
import { staff } from '@/data/staff';
import { Award, Star } from 'lucide-react';

export default function StaffPage() {
  return (
    <LayoutShell>
      {/* Header */}
      <section className="bg-gradient-to-br from-green-900 to-green-800 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
            Our <span className="text-yellow-400">Staff</span>
          </h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">
            Meet the experienced team behind Gina's Tennis World. Our instructors are passionate
            about helping you improve your game.
          </p>
        </div>
      </section>

      {/* Staff Grid */}
      <section className="bg-green-50 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {staff.map((member) => (
              <div key={member.id} className="card overflow-hidden">
                <div className="bg-gradient-to-br from-green-600 to-green-700 p-8 text-center">
                  <div className="w-28 h-28 rounded-full mx-auto mb-4 overflow-hidden border-4 border-white/30">
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/20 flex items-center justify-center">
                        <span className="text-5xl font-bold text-white">{member.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-white">{member.name}</h3>
                  <p className="text-yellow-400 font-semibold mt-1">{member.role}</p>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 leading-relaxed mb-4">{member.bio}</p>
                  {member.certifications && (
                    <div className="space-y-2">
                      {member.certifications.map((cert) => (
                        <div key={cert} className="flex items-center gap-2 text-sm">
                          <Award className="w-4 h-4 text-yellow-500" />
                          <span className="text-gray-700">{cert}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-heading">Why Train With Us?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '🏆',
                title: 'Experienced Pros',
                desc: 'USPTA and PTR certified instructors with decades of teaching experience.',
              },
              {
                icon: '⚡',
                title: 'ACE Attack System',
                desc: 'The first and only ACE Attack training system in New Jersey.',
              },
              {
                icon: '🎾',
                title: 'Indoor Courts',
                desc: 'Play year-round on our indoor courts — rain or shine, hot or cold.',
              },
              {
                icon: '👥',
                title: 'Small Class Sizes',
                desc: 'Personalized attention with limited class sizes for maximum improvement.',
              },
            ].map((item) => (
              <div key={item.title} className="text-center p-6">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-green-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </LayoutShell>
  );
}