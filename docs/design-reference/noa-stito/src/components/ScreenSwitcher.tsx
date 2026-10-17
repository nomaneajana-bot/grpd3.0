import React, { useState } from 'react';
import { ScreenId } from '../types';

interface ScreenSwitcherProps {
  currentScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
}

export const ScreenSwitcher: React.FC<ScreenSwitcherProps> = ({
  currentScreen,
  onSelectScreen,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const screens: { id: ScreenId; name: string; number: number; icon: string }[] = [
    { id: 'accueil', name: 'Accueil (On sort ?)', number: 1, icon: 'explore' },
    { id: 'onboarding', name: 'Accueil Nouveau Membre (Bienvenue)', number: 2, icon: 'waving_hand' },
    { id: 'outing-detail', name: 'Outing Detail (Marche & Sortie)', number: 3, icon: 'directions_walk' },
    { id: 'mes-sorties', name: 'Mes Sorties & Désistement', number: 4, icon: 'calendar_month' },
    { id: 'clubs', name: 'Clubs (Les pas de Casa)', number: 5, icon: 'groups' },
    { id: 'organise-outing', name: 'Planifier une sortie', number: 6, icon: 'edit_calendar' },
    { id: 'invitations', name: 'Invitations & Validation (Sarah)', number: 7, icon: 'mail' },
    { id: 'create-club', name: 'Fonder un club (Métropoles)', number: 8, icon: 'add_circle' },
    { id: 'profil', name: 'Profil & Cadence (Yasmine S.)', number: 9, icon: 'person' },
    { id: 'settings', name: 'Réglages & Confidentialité', number: 10, icon: 'tune' },
    { id: 'contact', name: 'Support & Charte bienveillante', number: 11, icon: 'contact_support' },
  ];

  return (
    <div className="fixed top-20 right-3 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sand-card/90 backdrop-blur-md border hairline-border shadow-[0_4px_16px_rgba(17,19,17,0.08)] text-brand text-xs font-semibold hover:bg-white transition-all cursor-pointer"
          title="Sélecteur rapide d'écran"
        >
          <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
          <span className="font-display text-[10px] uppercase tracking-wider font-bold">Écrans (11)</span>
          <span className="material-symbols-outlined text-[16px]">layers</span>
        </button>
      ) : (
        <div className="bg-sand-card/95 backdrop-blur-xl border hairline-border rounded-2xl p-3 shadow-2xl w-64 max-h-[80vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b hairline-border">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-brand text-[18px]">devices</span>
              <span className="font-display text-xs font-bold uppercase tracking-wider text-ink">
                Écrans de l'app
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 rounded-full hover:bg-sand-muted flex items-center justify-center text-ink-muted cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>

          <div className="space-y-1">
            {screens.map((s) => {
              const isCurrent = currentScreen === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    onSelectScreen(s.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-brand text-white font-bold shadow-xs'
                      : 'hover:bg-[#FAF9F6] text-ink'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold font-display ${
                      isCurrent
                        ? 'bg-white/20 text-white'
                        : 'bg-sand-muted text-ink-muted'
                    }`}
                  >
                    {s.number}
                  </span>
                  <span className="material-symbols-outlined text-[16px] shrink-0">
                    {s.icon}
                  </span>
                  <span className="truncate font-sans font-medium">{s.name}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t hairline-border text-[10px] text-ink-muted text-center font-sans">
            Harmonie visuelle Google Stitch
          </div>
        </div>
      )}
    </div>
  );
};
