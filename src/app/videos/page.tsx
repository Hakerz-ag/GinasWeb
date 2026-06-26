'use client';

import LayoutShell from '@/components/LayoutShell';
import { videos } from '@/data/videos';
import { Play, Filter } from 'lucide-react';
import { useState } from 'react';

export default function VideosPage() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'instructional' | 'featured' | 'intro'>('all');

  const filtered = filter === 'all' ? videos : videos.filter((v) => v.category === filter);

  return (
    <LayoutShell>
      {/* Header */}
      <section className="bg-gradient-to-br from-green-900 to-green-800 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
            Instructional <span className="text-yellow-400">Videos</span>
          </h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">
            Learn from Gina and her team. Watch expert tips on strokes, footwork, strategy, and more.
            New videos added regularly!
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 overflow-x-auto">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          {(['all', 'intro', 'featured', 'instructional'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                filter === cat
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
              }`}
            >
              {cat === 'all' ? 'All Videos' : cat === 'intro' ? 'Intro' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Videos Grid */}
      <section className="bg-green-50 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((video) => (
              <div key={video.id} className="card overflow-hidden group">
                <div className="relative aspect-video">
                  {playingId === video.id ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  ) : (
                    <button
                      onClick={() => setPlayingId(video.id)}
                      className="w-full h-full relative"
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
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
                  <h3 className="font-bold text-green-900">{video.title}</h3>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">{video.description}</p>
                  <span className="inline-block mt-2 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full capitalize">
                    {video.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </LayoutShell>
  );
}