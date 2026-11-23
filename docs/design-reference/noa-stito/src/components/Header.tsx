import React, { useState } from 'react';
import { ScreenId } from '../types';
import { CITIES } from '../mockData';

interface HeaderProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  onBack?: () => void;
  selectedCity: string;
  onSelectCity: (city: string) => void;
  onOpenContact: () => void;
  myOutingsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  onBack,
  selectedCity,
  onSelectCity,
  onOpenContact,
  myOutingsCount = 2,
}) => {
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [copiedShareToast, setCopiedShareToast] = useState(false);

  const subpageTitles: Partial<Record<ScreenId, string>> = {
    'outing-detail': 'Sorties',
    'organise-outing': 'Organiser',
    invitations: 'Invitations',
    'create-club': 'Créer Club',
    settings: 'Réglages',
    onboarding: 'Bienvenue',
  };

  const isSubpage = Boolean(subpageTitles[currentScreen]);

  const navLinks: { id: ScreenId; label: string; icon: string; badge?: number }[] = [
    { id: 'accueil', label: 'Accueil', icon: 'explore' },
    { id: 'mes-sorties', label: 'Mes sorties', icon: 'calendar_today', badge: myOutingsCount },
    { id: 'clubs', label: 'Clubs', icon: 'groups' },
    { id: 'organise-outing', label: 'Organiser', icon: 'add_circle' },
    { id: 'invitations', label: 'Invitations', icon: 'mail' },
  ];

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedShareToast(true);
    setTimeout(() => setCopiedShareToast(false), 2200);
  };

  return (
    <>
      {copiedShareToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-ink text-white px-4 py-1.5 rounded-full text-xs font-sans font-medium shadow-xl border border-sand-divider/40 animate-in fade-in duration-150">
          Lien de la sortie copié dans le presse-papier !
        </div>
      )}

      {/* Top Precision Architectural Header */}
      <header className="fixed top-0 inset-x-0 z-50 pt-safe bg-[#FAF9F6]/90 backdrop-blur-md border-b hairline-border transition-colors">
        <div className="h-14 px-4 sm:px-6 max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* LEFT ZONE */}
          <div className="flex items-center gap-3">
            {isSubpage ? (
              <button
                className="touch-interactive h-10 -ml-1.5 px-2 flex items-center gap-1 text-on-surface cursor-pointer group"
                onClick={onBack || (() => onNavigate('accueil'))}
                aria-label="Retour"
              >
                <span className="material-symbols-outlined text-[20px] font-light group-hover:-translate-x-0.5 transition-transform">
                  arrow_back
                </span>
                <span className="font-sans text-[13px] tracking-tight font-medium">
                  {subpageTitles[currentScreen]}
                </span>
              </button>
            ) : (
              <div
                className="touch-interactive flex items-center gap-2 cursor-pointer"
                onClick={() => onNavigate('accueil')}
              >
                <div className="w-6 h-6 rounded-sm bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[15px] font-light">
                    directions_run
                  </span>
                </div>
                <span className="font-display font-bold text-[16px] tracking-tight text-on-surface">
                  GRPD
                </span>
                <span className="text-outline/40 text-[13px] hidden sm:inline">/</span>
                <span className="hidden sm:inline font-display text-[10px] tracking-[0.16em] uppercase font-bold text-ink-muted">
                  Maroc
                </span>
              </div>
            )}

            {/* City indicator on subpage */}
            {isSubpage && (
              <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-sand-divider">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span className="font-display text-[11px] font-semibold tracking-[0.14em] uppercase text-on-surface">
                  {selectedCity}
                </span>
              </div>
            )}
          </div>

          {/* DESKTOP NAVIGATION LINKS */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = currentScreen === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`px-3.5 py-1.5 rounded-full font-sans text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white shadow-2xs font-bold'
                      : 'text-ink-muted hover:text-ink hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{link.icon}</span>
                  <span>{link.label}</span>
                  {link.badge && link.badge > 0 && link.id === 'mes-sorties' && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-primary text-white'
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <button
              onClick={onOpenContact}
              className="px-3.5 py-1.5 rounded-full font-sans text-xs font-semibold text-ink-muted hover:text-ink hover:bg-surface-container transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[16px]">contact_support</span>
              <span>Contact</span>
            </button>
          </nav>

          {/* RIGHT ACTION ZONE */}
          <div className="flex items-center gap-2">
            {/* City dropdown */}
            {!isSubpage && (
              <div className="relative">
                <button
                  className="touch-interactive flex items-center gap-1 px-2.5 py-1 rounded-full border border-sand-divider hover:border-brand/40 text-ink text-xs font-display font-semibold transition-colors cursor-pointer bg-sand-card/70"
                  onClick={() => setShowCityPicker(!showCityPicker)}
                  title="Changer de ville"
                >
                  <span className="material-symbols-outlined text-[15px] text-primary">location_on</span>
                  <span>{selectedCity}</span>
                  <span className="material-symbols-outlined text-[15px] text-ink-muted">
                    {showCityPicker ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {showCityPicker && (
                  <div className="absolute top-10 right-0 w-44 bg-white rounded-2xl shadow-xl border hairline-border p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1 text-[10px] font-display uppercase tracking-wider text-outline font-bold">
                      Villes actives
                    </div>
                    {CITIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          onSelectCity(c);
                          setShowCityPicker(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-sans flex items-center justify-between transition-colors cursor-pointer ${
                          selectedCity === c
                            ? 'bg-secondary-container/40 text-primary font-bold'
                            : 'text-on-surface hover:bg-surface-container-low'
                        }`}
                      >
                        <span>{c}</span>
                        {selectedCity === c && (
                          <span className="material-symbols-outlined text-[16px] text-primary">check</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subpage Share Action */}
            {isSubpage && (
              <button
                onClick={handleShare}
                aria-label="Partager"
                className="touch-interactive w-8 h-8 rounded-full border border-outline-hairline flex items-center justify-center text-on-surface hover:border-on-surface transition-colors cursor-pointer"
                title="Partager le lien"
              >
                <span className="material-symbols-outlined text-[17px]">ios_share</span>
              </button>
            )}

            {/* Notification Bell */}
            <button
              aria-label="Notifications"
              className="touch-interactive w-8 h-8 rounded-full flex items-center justify-center text-ink hover:text-brand relative cursor-pointer"
              onClick={() => setShowNotificationToast(true)}
              id="btn-notification"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand ring-2 ring-sand"></span>
            </button>

            {/* User Profile Avatar with Monocle Initial "Y" */}
            <button
              onClick={() => onNavigate('profil')}
              aria-label="Profil"
              className="touch-interactive w-8 h-8 rounded-full border border-ink/15 overflow-hidden flex items-center justify-center bg-sand-muted text-ink font-display text-[13px] font-semibold cursor-pointer hover:border-brand transition-colors"
              type="button"
            >
              <span>Y</span>
            </button>

            {/* Mobile Menu Hamburger (Visible on small screens) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface cursor-pointer"
              aria-label="Menu principal"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Out Drawer Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden animate-in fade-in duration-150">
          <div className="fixed top-14 left-0 right-0 bg-white border-b hairline-border shadow-2xl p-5 space-y-4 animate-in slide-in-from-top duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b hairline-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-sm bg-primary flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[16px]">directions_run</span>
                </div>
                <div>
                  <span className="font-display font-bold text-on-surface text-sm">GRPD Maroc</span>
                  <span className="text-[10px] text-outline block font-sans">Casablanca & Régions</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-primary bg-secondary-container/50 px-2.5 py-0.5 rounded-full font-display">
                {selectedCity}
              </span>
            </div>

            <div className="space-y-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => {
                    onNavigate(link.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-sans font-semibold flex items-center justify-between transition-colors ${
                    currentScreen === link.id
                      ? 'bg-primary text-white font-bold shadow-xs'
                      : 'text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px]">{link.icon}</span>
                    <span>{link.label}</span>
                  </div>
                  {link.badge && link.badge > 0 && link.id === 'mes-sorties' && (
                    <span className="px-2 py-0.5 rounded bg-primary text-white text-[10px] font-bold font-display">
                      {link.badge}
                    </span>
                  )}
                </button>
              ))}

              <button
                onClick={() => {
                  onNavigate('create-club');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-sans font-semibold flex items-center gap-2.5 transition-colors ${
                  currentScreen === 'create-club'
                    ? 'bg-primary text-white font-bold shadow-xs'
                    : 'text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">group_add</span>
                <span>Créer un club</span>
              </button>

              <button
                onClick={() => {
                  onOpenContact();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-sans font-semibold flex items-center gap-2.5 text-primary hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">contact_support</span>
                <span>Nous contacter / Support</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {showNotificationToast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl border hairline-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold font-display text-sm">
                <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                <span>Notifications</span>
              </div>
              <button
                onClick={() => setShowNotificationToast(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="bg-[#FAF9F6] border hairline-border rounded-xl p-3 space-y-1">
              <p className="text-xs font-bold font-display text-on-surface">Rappel de sortie</p>
              <p className="text-xs font-sans text-on-surface-variant leading-relaxed">
                Votre sortie <strong className="text-primary font-semibold">Footing matinal & Sunrise</strong> est confirmée pour dimanche à 06:45 au Phare d'El Hank.
              </p>
            </div>
            <button
              onClick={() => {
                setShowNotificationToast(false);
                onNavigate('outing-detail');
              }}
              className="w-full h-10 rounded-xl bg-primary text-white font-display text-xs font-bold transition-all cursor-pointer hover:bg-brand-dark"
            >
              Voir la sortie
            </button>
          </div>
        </div>
      )}
    </>
  );
};
