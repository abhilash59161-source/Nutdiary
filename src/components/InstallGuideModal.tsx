/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  X, 
  Smartphone, 
  Chrome, 
  Share, 
  PlusSquare, 
  Monitor, 
  HelpCircle,
  DownloadCloud
} from "lucide-react";

interface InstallGuideModalProps {
  onClose: () => void;
}

export default function InstallGuideModal({ onClose }: InstallGuideModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" id="install-guide-modal">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-100 shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-fade-in">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl text-emerald-400">
              <DownloadCloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-md font-black tracking-tight leading-none">Standalone Install Guide</h3>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">Use without Play Store</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow space-y-6">
          <p className="text-xs text-slate-500 leading-relaxed font-normal">
            NutDiary is engineered as a **Progressive Web App (PWA)**. This means you do not need the Google Play Store or Apple App Store to download and use it. You can install it directly onto your Android, iOS, or Desktop home screen in under 10 seconds!
          </p>

          <div className="space-y-4">
            
            {/* ANDROID METHOD */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2.5">
              <span className="text-xs font-black text-slate-800 flex items-center gap-2">
                <Smartphone className="h-4.5 w-4.5 text-emerald-500" />
                1. Android (Chrome) — Recommended
              </span>
              <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 pl-1 leading-relaxed font-normal">
                <li>Launch your mobile <strong className="text-slate-800">Google Chrome</strong> browser.</li>
                <li>Navigate to your hosted application URL.</li>
                <li>Tap the <strong className="text-slate-800">Three vertical dots (Menu)</strong> icon in the top right.</li>
                <li>Select <strong className="text-emerald-600 font-bold">"Add to Home screen"</strong> or <strong className="text-emerald-600 font-bold">"Install app"</strong>.</li>
                <li>Confirm the installation prompt. The app icon will now appear alongside your native apps!</li>
              </ol>
            </div>

            {/* IOS METHOD */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2.5">
              <span className="text-xs font-black text-slate-800 flex items-center gap-2">
                <Smartphone className="h-4.5 w-4.5 text-indigo-500" />
                2. Apple iOS (Safari)
              </span>
              <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 pl-1 leading-relaxed font-normal">
                <li>Launch the native <strong className="text-slate-800">Safari</strong> browser on your iPhone/iPad.</li>
                <li>Navigate to your hosted application URL.</li>
                <li>Tap the <strong className="text-slate-800">Share</strong> icon (square with an up arrow) at the bottom.</li>
                <li>Scroll down the share sheet and select <strong className="text-indigo-600 font-bold">"Add to Home Screen"</strong>.</li>
                <li>Tap <strong className="text-indigo-600 font-bold">Add</strong>. You can now open NutriTrack full-screen, without search bars!</li>
              </ol>
            </div>

            {/* DESKTOP METHOD */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2.5">
              <span className="text-xs font-black text-slate-800 flex items-center gap-2">
                <Monitor className="h-4.5 w-4.5 text-amber-500" />
                3. Desktop (Chrome / Edge)
              </span>
              <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 pl-1 leading-relaxed font-normal">
                <li>Open this site in Chrome, Edge, or Brave.</li>
                <li>Look at the right side of the URL address bar for an <strong className="text-slate-800">"Install" icon</strong> (a computer screen with an arrow).</li>
                <li>Click it and choose <strong className="text-amber-600 font-bold">Install</strong>. This boots NutriTrack in a standalone, lightning-fast desk dock application.</li>
              </ol>
            </div>

          </div>

          <div className="p-4 bg-emerald-50/20 border border-emerald-100/30 rounded-2xl">
            <span className="text-xs font-bold text-emerald-800 block flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 text-emerald-500" /> Standalone Benefits
            </span>
            <p className="text-[10px] text-slate-500 leading-relaxed font-normal mt-1">
              Stand-alone PWA apps consume 90% less device memory/storage than Play Store packages, bypass system overheads, receive instant background updates automatically, and respect your cellular bandwidth limits.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Got it, thanks!
          </button>
        </div>

      </div>
    </div>
  );
}
