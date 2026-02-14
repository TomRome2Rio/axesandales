import React from 'react';
import { DISCORD_INVITE_URL } from '../constants';

interface WelcomeViewProps {
  onNavigate: (page: 'membership' | 'home' | 'about') => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Hero */}
      <div className="bg-neutral-800 rounded-xl p-8 border border-neutral-700 shadow-xl text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-900/50 border-2 border-green-600 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-amber-500">Welcome to Axes &amp; Ales!</h1>
        <p className="text-neutral-400 text-sm">Your account has been created. Here's everything you need to know.</p>
      </div>

      {/* Come Along for Free */}
      <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700 shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-2 h-8 bg-green-600 rounded-full inline-block"></span>
          You're Welcome Right Away
        </h2>
        <p className="text-neutral-300 leading-relaxed">
          You don't need a membership to come along — <span className="text-white font-medium">the club is free to attend</span>. Just turn up any Tuesday night at the Thornbury Bowls Club, find a game, and join in. No sign-up fee, no pressure.
        </p>
        <div className="bg-neutral-900/50 rounded-lg p-4 border border-neutral-700 space-y-2">
          <p className="text-sm text-white font-medium">What you can do right now:</p>
          <ul className="space-y-1.5 text-sm text-neutral-300">
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Come along to the club any Tuesday night and play
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Browse the dashboard to see what tables and terrain are booked
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Join our Discord and Facebook to organise games and meet other players
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Use the club's terrain and tables on the night (first come, first served)
            </li>
          </ul>
        </div>
      </div>

      {/* Membership — Optional but Helpful */}
      <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700 shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-2 h-8 bg-amber-600 rounded-full inline-block"></span>
          Want to Book Tables? Get a Membership
        </h2>
        <p className="text-neutral-300 leading-relaxed">
          Membership is completely optional — but if you'd like to <span className="text-white font-medium">reserve a table and terrain in advance</span>, you'll need an active membership. It's just <span className="text-amber-400 font-bold">$60 per year</span> and every cent goes back into running the club.
        </p>
        <div className="bg-neutral-900/50 rounded-lg p-4 border border-neutral-700 space-y-3">
          <p className="text-sm text-white font-medium">How it works:</p>
          <ol className="space-y-2.5 text-sm text-neutral-300 list-none">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-600/20 border border-amber-700/50 flex items-center justify-center text-amber-400 font-bold text-xs">1</span>
              <span>Head to the <button onClick={() => onNavigate('membership')} className="text-amber-400 hover:text-amber-300 underline font-medium">Membership &amp; Payment</button> page and pay via PayPal (credit/debit cards also accepted).</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-600/20 border border-amber-700/50 flex items-center justify-center text-amber-400 font-bold text-xs">2</span>
              <span>Include the email address you signed up with so we can match your payment.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-600/20 border border-amber-700/50 flex items-center justify-center text-amber-400 font-bold text-xs">3</span>
              <span>A committee member will activate your membership — this is done manually so <span className="text-white font-medium">it won't be instant</span>, but we'll get to it as soon as we can.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-600/20 border border-amber-700/50 flex items-center justify-center text-amber-400 font-bold text-xs">4</span>
              <span>Once activated, you'll be able to book tables and terrain through the dashboard.</span>
            </li>
          </ol>
        </div>
      </div>

      {/* Already Paid? */}
      <div className="bg-neutral-800 rounded-xl p-6 border border-amber-700/40 shadow-xl space-y-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-2 h-8 bg-amber-600 rounded-full inline-block"></span>
          Already a Paying Member?
        </h2>
        <p className="text-neutral-300 leading-relaxed">
          If you've already paid for your membership but have only just created an account on this site, don't worry — we just need to link your payment to your new account. This is done manually by the committee and <span className="text-white font-medium">can take a few days</span>.
        </p>
        <p className="text-neutral-300 leading-relaxed">
          If it's been a while, feel free to nudge us on <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline">Discord</a> or email <a href="mailto:axesandalescommittee@gmail.com" className="text-amber-400 hover:text-amber-300 underline">axesandalescommittee@gmail.com</a>.
        </p>
      </div>

      {/* What's Next */}
      <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700 shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-2 h-8 bg-amber-600 rounded-full inline-block"></span>
          Get Started
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg shadow-amber-900/20 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" /></svg>
            View Table Bookings
          </button>
          <button
            onClick={() => onNavigate('membership')}
            className="inline-flex items-center gap-2 bg-neutral-700 hover:bg-neutral-600 text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
          >
            Pay for Membership
          </button>
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
            </svg>
            Join Discord
          </a>
        </div>
      </div>
    </div>
  );
};
