import React, { useState } from 'react';
import { ScreenId } from '../types';
import { IMAGES } from '../mockData';

interface ProfileScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onOpenContact: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigate, onOpenContact }) => {
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleToggleReminders = () => {
    setRemindersEnabled(!remindersEnabled);
    showToast(!remindersEnabled ? 'Rappels 2h activés' : 'Rappels désactivés');
  };

  return (
    <div className="flex flex-col w-full pb-28 md:pb-16 pt-16 md:pt-20 px-4 md:px-8 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 z-50 pointer-events-none transition-all duration-300 flex items-center justify-between px-4 py-3 rounded-xl bg-brand text-white shadow-xl border border-sand-divider/40">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="font-display text-xs uppercase tracking-wider font-semibold">
              {toastMessage}
            </span>
          </div>
        </div>
      )}

      {/* Top Auxiliary Sub-Bar: City Context & Gear */}
      <div className="flex items-center justify-between py-2 mb-4">
        <button
          type="button"
          onClick={() => showToast('Métropole actuelle : Casablanca')}
          className="flex items-center gap-1.5 text-ink-muted hover:text-brand transition-colors cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
          <span className="font-display text-[11px] uppercase tracking-widest text-ink font-bold">
            Casablanca
          </span>
          <span className="material-symbols-outlined text-[16px] text-ink-muted">expand_more</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('settings')}
          aria-label="Paramètres rapides"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-sand-card hover:bg-sand-muted border hairline-border transition-colors text-ink cursor-pointer shadow-2xs"
          title="Accéder aux réglages complets"
        >
          <span className="material-symbols-outlined text-[19px]">tune</span>
        </button>
      </div>

      {/* Profile Identity Header */}
      <div className="bg-sand-card rounded-2xl p-5 border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] flex items-start gap-4 mb-6">
        <div className="relative shrink-0">
          <img
            src={IMAGES.yasmineAvatar}
            alt="Portrait de Yasmine S."
            className="w-16 h-16 rounded-full object-cover ring-2 ring-sand-card border hairline-border"
          />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-brand flex items-center justify-center text-white shadow-sm ring-2 ring-white">
            <span className="material-symbols-outlined text-[12px]">verified</span>
          </div>
        </div>

        <div className="flex flex-col justify-center min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h1 className="font-display text-2xl font-bold text-ink tracking-tight truncate">
              Yasmine S.
            </h1>
            <span className="font-display text-[10px] uppercase font-bold text-brand bg-brand/10 border border-brand/15 px-2 py-0.5 rounded-md">
              Actif
            </span>
          </div>
          <p className="font-sans text-xs sm:text-sm text-ink-muted truncate mt-0.5">
            Membre active depuis mars 2024
          </p>
          <div className="flex items-center gap-1 text-ink-muted mt-1.5">
            <span className="material-symbols-outlined text-[14px] text-brand">location_on</span>
            <span className="font-display text-[10px] tracking-wider uppercase font-semibold text-ink-muted">
              Casablanca · Racine
            </span>
          </div>
        </div>
      </div>

      {/* Linear Typographic Telemetry / Counters (Space Grotesk) */}
      <div className="bg-sand-card rounded-2xl p-4 mb-6 border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)]">
        <div className="grid grid-cols-3 gap-2 text-center sm:text-left divide-x divide-sand-divider">
          <div className="flex flex-col px-2">
            <span className="font-display text-2xl sm:text-3xl text-brand tracking-tight font-bold">
              14
            </span>
            <span className="font-display text-[10px] uppercase tracking-wider text-ink-muted mt-0.5 font-bold">
              Sorties
            </span>
          </div>
          <div className="flex flex-col px-2">
            <span className="font-display text-2xl sm:text-3xl text-brand tracking-tight font-bold">
              03
            </span>
            <span className="font-display text-[10px] uppercase tracking-wider text-ink-muted mt-0.5 font-bold">
              Clubs
            </span>
          </div>
          <div className="flex flex-col px-2">
            <div className="flex items-baseline justify-center sm:justify-start gap-0.5">
              <span className="font-display text-2xl sm:text-3xl text-brand tracking-tight font-bold">
                68
              </span>
              <span className="font-display text-xs text-ink-muted uppercase font-bold">km</span>
            </div>
            <span className="font-display text-[10px] uppercase tracking-wider text-ink-muted mt-0.5 font-bold">
              Parcourus
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Responsive Layout on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN: Section 01 Cadence & Section 02 Clubs */}
        <div className="space-y-6">
          {/* Section 1: Athlétisme & Cadence */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-2">
              <span className="font-display text-[10px] uppercase tracking-widest text-ink-muted font-bold">
                01 / Cadence & Rythme
              </span>
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="font-display text-[10px] uppercase text-brand tracking-wider font-bold hover:underline cursor-pointer"
              >
                Modifier
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="bg-sand-card p-4 rounded-xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-ink">
                    Allure de prédilection
                  </span>
                  <span className="font-display text-xs text-brand font-bold">
                    5.5 – 6.0 km/h
                  </span>
                </div>
                <div className="flex items-center justify-between text-ink-muted">
                  <span className="font-sans text-xs">
                    Marche dynamique tempo régulier & allure libre
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-brand">speed</span>
                </div>
              </div>

              <div className="bg-sand-card p-4 rounded-xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-ink">
                    Créneaux habituels
                  </span>
                  <span className="font-display text-[10px] uppercase text-brand bg-brand/10 border border-brand/15 px-2 py-0.5 rounded font-bold">
                    Régulier
                  </span>
                </div>
                <div className="flex items-center justify-between text-ink-muted">
                  <span className="font-sans text-xs">
                    Week-end matin (08h30) & Mercredi soir (19h00)
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-brand">
                    event_available
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Mes Clubs */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-2">
              <span className="font-display text-[10px] uppercase tracking-widest text-ink-muted font-bold">
                02 / Équipes & Collectifs
              </span>
              <span className="font-display text-[10px] uppercase text-brand font-bold">
                Actif
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {/* Club Item 1 */}
              <div
                onClick={() => onNavigate('clubs')}
                className="bg-sand-card p-3.5 rounded-xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] flex items-center justify-between cursor-pointer hover:bg-[#FAF9F6] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shrink-0 font-display font-bold text-xs">
                    LP
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-display text-sm font-bold text-ink truncate">
                        Les pas de Casa
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0"></span>
                    </div>
                    <p className="font-sans text-xs text-ink-muted truncate">
                      Membre administratrice · 48 membres
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[20px] text-ink-muted">
                  chevron_right
                </span>
              </div>

              {/* Club Item 2 */}
              <div
                onClick={() => onNavigate('clubs')}
                className="bg-sand-card p-3.5 rounded-xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] flex items-center justify-between cursor-pointer hover:bg-[#FAF9F6] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-sand-muted text-ink flex items-center justify-center shrink-0 font-display font-bold text-xs border hairline-border">
                    CR
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-display text-sm font-bold text-ink truncate">
                      Casa Runners Club
                    </span>
                    <p className="font-sans text-xs text-ink-muted truncate">
                      Membre coureuse · 420 membres
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[20px] text-ink-muted">
                  chevron_right
                </span>
              </div>

              {/* Discovery Action */}
              <button
                type="button"
                onClick={() => onNavigate('clubs')}
                className="flex items-center justify-between p-3.5 rounded-xl bg-sand-card hover:bg-sand-muted text-brand border hairline-border transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span className="font-display text-xs font-bold uppercase tracking-wider">
                    Explorer d'autres clubs
                  </span>
                </div>
                <span className="font-display text-[10px] uppercase font-bold text-ink-muted">
                  Grand Casablanca →
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Section 03 Réglages & Confidentialité & Disclaimers */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2">
              <span className="font-display text-[10px] uppercase tracking-widest text-ink-muted font-bold">
                03 / Configuration & Vie Privée
              </span>
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="font-display text-[10px] uppercase text-brand tracking-wider font-bold hover:underline cursor-pointer"
              >
                Tous les réglages
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {/* Setting 1: Notification Toggle */}
              <div className="bg-sand-card p-4 rounded-xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] flex items-center justify-between">
                <div className="flex flex-col pr-3">
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-ink">
                    Rappels de départs
                  </span>
                  <span className="font-sans text-xs text-ink-muted mt-0.5">
                    Alerte automatique 2h avant le rassemblement
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={remindersEnabled}
                  onClick={handleToggleReminders}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ${
                    remindersEnabled ? 'bg-brand' : 'bg-sand-muted'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${
                      remindersEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Setting 2: Visibility */}
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="bg-sand-card p-4 rounded-xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] flex items-center justify-between text-left hover:bg-[#FAF9F6] transition-colors cursor-pointer"
              >
                <div className="flex flex-col pr-2">
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-ink">
                    Visibilité du profil
                  </span>
                  <span className="font-sans text-xs text-ink-muted mt-0.5">
                    Réservée exclusivement aux membres de tes clubs
                  </span>
                </div>
                <div className="flex items-center gap-1 text-ink-muted shrink-0">
                  <span className="font-display text-[10px] uppercase font-bold text-brand">
                    Restreint
                  </span>
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </div>
              </button>

              {/* Setting 3: Privacy & Geolocation */}
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="bg-sand-card p-4 rounded-xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] flex items-center justify-between text-left hover:bg-[#FAF9F6] transition-colors cursor-pointer"
              >
                <div className="flex flex-col pr-2">
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-ink">
                    Géolocalisation & masquage
                  </span>
                  <span className="font-sans text-xs text-ink-muted mt-0.5">
                    Point précis révélé uniquement après validation d'inscription
                  </span>
                </div>
                <div className="flex items-center gap-1 text-ink-muted shrink-0">
                  <span className="material-symbols-outlined text-[16px] text-brand">lock</span>
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </div>
              </button>

              {/* Setting 4: Support & Ethics */}
              <button
                type="button"
                onClick={onOpenContact}
                className="bg-sand-card p-4 rounded-xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] flex items-center justify-between text-left hover:bg-[#FAF9F6] transition-colors cursor-pointer"
              >
                <div className="flex flex-col pr-2">
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-ink">
                    Charte de bienveillance & contact
                  </span>
                  <span className="font-sans text-xs text-ink-muted mt-0.5">
                    Assistance technique et protocole d'éthique sportive
                  </span>
                </div>
                <span className="material-symbols-outlined text-[18px] text-ink-muted shrink-0">
                  chevron_right
                </span>
              </button>
            </div>
          </div>

          {/* Bottom Actions & Disclaimers */}
          <div className="bg-sand-card rounded-2xl p-4 border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] flex flex-col items-center gap-3 text-center">
            <button
              type="button"
              onClick={() => showToast('Session active')}
              className="font-display text-xs text-red-600 hover:text-red-700 transition-colors uppercase tracking-wider font-bold py-1 px-4 cursor-pointer"
            >
              Se déconnecter
            </button>
            <div className="flex flex-col items-center gap-0.5 pt-1 border-t hairline-border w-full">
              <span className="font-display text-[10px] text-ink-muted uppercase tracking-widest font-semibold">
                GRPD Atelier v1.2.0 · Build 48
              </span>
              <span className="font-sans text-[11px] text-ink-muted">
                Édition Collective Grand Casablanca
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
