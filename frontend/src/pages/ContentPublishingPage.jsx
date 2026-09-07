// frontend/src/modules/content/ContentPublishingPage.jsx
import React from 'react';
import { useApp } from '../context/AppContext';
import ContentPublishing from '../modules/contentpublishing/ContentPublishing';

export default function ContentPublishingPage({ onShowNotification }) {
  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
            Command Center / Content
          </p>
          <h1 className="text-lg font-bold text-white">Content Publishing</h1>
        </div>
        <p className="text-[11px] text-slate-400 max-w-md text-right">
          Upload posters, news, and gallery media. Changes sync to the public website.
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <ContentPublishing onShowNotification={onShowNotification} />
      </div>
    </div>
  );
}