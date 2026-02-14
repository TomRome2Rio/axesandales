import React from 'react';

export const LocationView: React.FC = () => {
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Location */}
      <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700 shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-2 h-8 bg-amber-600 rounded-full inline-block"></span>
          Location
        </h2>
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div>
            <p className="text-neutral-300 font-medium">Thornbury Bowls Club</p>
            <p className="text-neutral-400 text-sm">27 Ballantyne St, Thornbury VIC 3071</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-neutral-300 font-medium">Every Tuesday Night</p>
          </div>
        </div>
        <div className="rounded-lg overflow-hidden border border-neutral-700 mt-2">
          <iframe
            src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY}&q=Thornbury+Bowls+Club,27+Ballantyne+St,Thornbury+VIC+3071,Australia&zoom=15`}
            width="100%"
            height="250"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Thornbury Bowls Club location"
          ></iframe>
        </div>

        {/* TBC image */}
        <div className="rounded-lg overflow-hidden border border-neutral-700 mt-2">
          <img
            src={`${import.meta.env.BASE_URL}images/AA-TBC.jpg`}
            alt="Thornbury Bowls Club"
            className="w-full h-auto object-cover"
          />
        </div>
      </div>

      {/* Getting There */}
      <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700 shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-2 h-8 bg-amber-600 rounded-full inline-block"></span>
          Getting There
        </h2>
        <p className="text-neutral-300 leading-relaxed">
          The club meets every Tuesday evening between <span className="text-white font-medium">6:30–10:30pm</span> at the Thornbury Bowls Club, 27 Ballantyne Street, Thornbury – VIC.
        </p>
        <div className="bg-neutral-900/50 rounded-lg p-4 border border-neutral-700 space-y-4">
          {/* Parking */}
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
            </svg>
            <div>
              <p className="text-white font-medium text-sm">Parking</p>
              <p className="text-neutral-400 text-sm">Limited time parking is available in Ballantyne St. More parking is available in Stott Street along the railway line.</p>
            </div>
          </div>
          {/* Tram */}
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 5h8m-4-10v2m-6 8h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v4a2 2 0 002 2zm-2 2l2 4h8l2-4" />
            </svg>
            <div>
              <p className="text-white font-medium text-sm">By Tram</p>
              <p className="text-neutral-400 text-sm">The 86 tram line runs along High Street. If you're heading out of the city, get off at Ballantyne/High Street (Stop 39) or if you are heading into the city get off Gooch St/High St (Stop 39) and take a short stroll up Ballantyne Street.</p>
            </div>
          </div>
          {/* Train */}
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17l-5 5m0 0l5-5m-5 5V4m16 14l-5 5m0 0l5-5m-5 5V4M4 4h16" />
            </svg>
            <div>
              <p className="text-white font-medium text-sm">By Train</p>
              <p className="text-neutral-400 text-sm">The Thornbury Bowls Club is on the Mernda Railway line. The closest station is Thornbury Railway Station — about a 5 minute walk to the bowls club.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
