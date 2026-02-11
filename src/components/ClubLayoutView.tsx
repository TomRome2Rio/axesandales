import React from 'react';

export const ClubLayoutView: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700 shadow-xl">
        <h1 className="text-2xl font-bold text-amber-500 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-amber-600 rounded-full inline-block"></span>
          Club Layout
        </h1>
        <p className="text-neutral-400 text-sm mb-4">
          Overview of the table layout at Thornbury Bowls Club.
        </p>
        <div className="rounded-lg overflow-hidden border border-neutral-700">
          <img
            src={`${import.meta.env.BASE_URL}images/club-layout.jpg`}
            alt="Axes & Ales Club Layout"
            className="w-full h-auto"
          />
        </div>
      </div>
    </div>
  );
};
