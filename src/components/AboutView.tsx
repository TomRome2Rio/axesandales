import React from 'react';

export const AboutView: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      {/* Hero */}
      <div className="bg-neutral-800 rounded-xl p-8 border border-neutral-700 shadow-xl text-center">
        <h1 className="text-3xl font-bold text-amber-500 mb-2">Axes & Ales Gaming Club</h1>
        <p className="text-neutral-400 text-sm">Northern Suburbs Gamers Club Incorporated</p>
      </div>

      {/* About */}
      <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700 shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-2 h-8 bg-amber-600 rounded-full inline-block"></span>
          About the Club
        </h2>
        <p className="text-neutral-300 leading-relaxed">
          Axes & Ales Gaming Club is a tabletop club based in Melbourne. We meet every Tuesday night at <a href="https://www.google.com/maps?q=27+Ballantyne+St,+Thornbury+VIC+3071" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline">Thornbury Bowls Club</a> and
          play all types of tabletop games from miniature wargames to board games to roleplaying games plus much more.
        </p>
        <p className="text-neutral-300 leading-relaxed">
          We are a social club first. Our main goal is to provide a safe, friendly and inclusive environment. We're all about rolling dice, telling stories, and enjoying the hobby that we all love. 
        </p>
        <p className="text-neutral-300 leading-relaxed">
          The club has a massive collection of terrain organized into themed sets. It's never been so easy to set up a table and even easier to pack away and store.
        </p>
        <p className="text-neutral-300 leading-relaxed">
          So whether you’re here for a narrative campaign or a casual board game, Axes & Ales is a welcoming space to unwind, grab a drink, and play.
        </p>
      </div>

      {/* Looking for a game? */}
      <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700 shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-2 h-8 bg-amber-600 rounded-full inline-block"></span>
          Looking for a game?
        </h2>
        <p className="text-neutral-300 leading-relaxed">
          The best way to coordinate a game at the club is through Discord and our Facebook group
        </p>
        <p className="text-neutral-300 leading-relaxed">
          <div class="social-button-container">
            <a href="https://discord.gg/SKkQYGe" target="_blank" class="social-btn discord-btn">
              <svg class="social-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36">
                <path fill="#fff" d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.09,105.09,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c2.36-24.44-4.27-49.07-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,54,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.23,53,91.1,65.69,84.69,65.69Z"/>
              </svg>
              Join Discord
            </a>
          
            <a href="https://www.facebook.com/groups/axesandales" target="_blank" class="social-btn facebook-btn">
              <svg class="social-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path fill="#fff" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Join Facebook Group
            </a>
          </div>
          So whether you’re here for a narrative campaign or a casual board game, Axes & Ales is a welcoming space to unwind, grab a drink, and play.
        </p>
      </div>

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
            src="https://www.google.com/maps/embed/v1/place?key=AIzaSyB0uwV-U5JjSwBzCV0h7iYwME8FPLVRSQE&q=Thornbury+Bowls+Club,27+Ballantyne+St,Thornbury+VIC+3071,Australia&zoom=15"
            width="100%"
            height="250"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Thornbury Bowls Club location"
          ></iframe>
        </div>
      </div>

      {/* Getting There */}
      <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700 shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-2 h-8 bg-amber-600 rounded-full inline-block"></span>
          Getting There
        </h2>
        <p className="text-neutral-300 leading-relaxed">
          The club meets every Tuesday evening between <span className="text-white font-medium">6:30–11pm</span> at the Thornbury Bowls Club, 27 Ballantyne Street, Thornbury – VIC.
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

      {/* The Committee */}
      <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700 shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-2 h-8 bg-amber-600 rounded-full inline-block"></span>
          The Committee
        </h2>
        <p className="text-neutral-400 text-sm">
          Need to reach the committee? Jump on{' '}
          <a href="https://discord.gg/SKkQYGe" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline">Discord</a>,
          message us on{' '}
          <a href="https://www.facebook.com/groups/axesandales" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline">Facebook</a>,
          or email{' '}
          <a href="mailto:axesandalescommittee@gmail.com" className="text-amber-400 hover:text-amber-300 underline">axesandalescommittee@gmail.com</a>.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
          {[
            { name: 'Glyn', role: 'President' },
            { name: 'Daniel', role: 'Vice President' },
            { name: 'Jason/Dutch Law', role: 'Treasurer' },
            { name: 'Tyrone', role: 'Secretary' },
            { name: 'Jason/GCUGreyArea', role: 'General Committee' },
            { name: 'Scoob', role: 'General Committee' },
            { name: 'Stew', role: 'General Committee' },
            { name: 'Rob/Fodzilla', role: 'General Committee' },
            { name: 'Rob Deakin', role: 'General Committee' },
            { name: 'Enrique/Soulstress', role: 'General Committee' },
            { name: 'Adam', role: 'General Committee' },
            { name: 'Tom', role: 'IT Guy' },
            
          ].map((member) => (
            <div key={member.name} className="bg-neutral-900/50 rounded-lg p-3 border border-neutral-700 text-center">
              <div className="w-10 h-10 rounded-full bg-amber-600/20 border border-amber-700/50 flex items-center justify-center mx-auto mb-2 text-amber-400 font-bold text-sm">
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
              <p className="text-white text-sm font-medium">{member.name}</p>
              <p className="text-neutral-500 text-xs">{member.role}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
