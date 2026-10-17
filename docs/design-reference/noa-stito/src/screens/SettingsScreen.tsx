import React, { useState } from 'react';
import { ScreenId } from '../types';

interface SettingsScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onOpenContact: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate, onOpenContact }) => {
  const [reminders, setReminders] = useState(true);
  const [districtAlerts, setDistrictAlerts] = useState(true);
  const [clubActivity, setClubActivity] = useState(true);
  const [weeklyRecap, setWeeklyRecap] = useState(false);
  const [chronoShare, setChronoShare] = useState(false);
  const [audience, setAudience] = useState<'private' | 'public'>('private');
  const [city, setCity] = useState('Casablanca');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSave = () => {
    showToast('Préférences et foulées synchronisées');
  };

  const handleGpsModal = () => {
    showToast('Configuration du rayon de sécurité : 400m actif');
  };

  const handleRgpdExport = () => {
    showToast('Archive RGPD envoyée à ton adresse e-mail');
  };

  const handleCharter = () => {
    showToast('Ouverture de la charte de convivialité...');
  };

  const handleGuides = () => {
    onOpenContact();
  };

  const handleConfirmDeletion = () => {
    if (window.confirm("Es-tu certain de vouloir effacer définitivement tes foulées et données d'Atelier ?")) {
      showToast('Demande de suppression enregistrée');
    }
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
          <span className="font-display text-[11px] text-white/70">0.12s</span>
        </div>
      )}

      {/* Editorial Section Title & Subhead */}
      <section className="pb-6 flex flex-col gap-1.5 border-b hairline-border mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-brand"></span>
            <span className="font-display text-[10px] uppercase tracking-[0.14em] text-ink-muted font-bold">
              Atelier Système / Config 04
            </span>
          </div>
          <span className="font-display text-[11px] text-ink-muted font-semibold">FR · CAS</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink uppercase mt-1">
          Réglages
        </h1>
        <p className="font-sans text-sm text-ink-muted max-w-lg leading-relaxed">
          Configure tes seuils d'alerte, affine la visibilité de tes foulées et préserve la sérénité de ton espace personnel.
        </p>
      </section>

      {/* Form sections */}
      <div className="flex flex-col gap-6">
        {/* Section 01: Notifications & Alertes */}
        <section className="bg-sand-card rounded-2xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] overflow-hidden">
          <div className="px-5 py-3 bg-[#FAF9F6] border-b hairline-border flex items-center justify-between">
            <span className="font-display text-[11px] font-bold text-brand uppercase tracking-wider">
              01 / Notifications & Alertes
            </span>
            <span className="font-display text-[11px] text-ink-muted">Push · In-App</span>
          </div>

          {/* 1.1 Rappels de départ */}
          <div className="px-5 py-4 flex items-start justify-between gap-4 border-b hairline-border">
            <div className="flex-1 min-w-0 pr-2">
              <span className="font-display text-[15px] font-bold text-ink uppercase block leading-snug">
                Rappels de départ
              </span>
              <p className="font-sans text-xs text-ink-muted mt-1">
                Alerte discrète 2h avant le rassemblement de tes sorties programmées.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={reminders}
              onClick={() => {
                setReminders(!reminders);
                showToast(!reminders ? 'Rappels activés' : 'Rappels désactivés');
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ${
                reminders ? 'bg-brand' : 'bg-sand-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${
                  reminders ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 1.2 Sorties de quartier */}
          <div className="px-5 py-4 flex items-start justify-between gap-4 border-b hairline-border">
            <div className="flex-1 min-w-0 pr-2">
              <span className="font-display text-[15px] font-bold text-ink uppercase block leading-snug">
                Sorties de quartier
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                <span className="font-display text-[10px] uppercase font-bold text-brand">
                  Casablanca · Anfa & Racine
                </span>
              </div>
              <p className="font-sans text-xs text-ink-muted mt-1">
                Notification dès qu'un rassemblement matinal est proposé dans ton rayon de marche.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={districtAlerts}
              onClick={() => {
                setDistrictAlerts(!districtAlerts);
                showToast(!districtAlerts ? 'Alertes quartier activées' : 'Alertes quartier désactivées');
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ${
                districtAlerts ? 'bg-brand' : 'bg-sand-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${
                  districtAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 1.3 Activité de tes clubs */}
          <div className="px-5 py-4 flex items-start justify-between gap-4 border-b hairline-border">
            <div className="flex-1 min-w-0 pr-2">
              <span className="font-display text-[15px] font-bold text-ink uppercase block leading-snug">
                Activité de tes clubs
              </span>
              <p className="font-display text-[11px] text-ink-muted mt-0.5 font-semibold">
                Les pas de Casa / Casa Runners
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={clubActivity}
              onClick={() => {
                setClubActivity(!clubActivity);
                showToast(!clubActivity ? 'Activité club activée' : 'Activité club désactivée');
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ${
                clubActivity ? 'bg-brand' : 'bg-sand-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${
                  clubActivity ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 1.4 Résumé hebdomadaire */}
          <div className="px-5 py-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 pr-2">
              <span className="font-display text-[15px] font-bold text-ink uppercase block leading-snug">
                Résumé hebdomadaire
              </span>
              <p className="font-sans text-xs text-ink-muted mt-0.5">
                Édition papier numérique chaque vendredi soir (bilan kilométrique et récits).
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={weeklyRecap}
              onClick={() => {
                setWeeklyRecap(!weeklyRecap);
                showToast(!weeklyRecap ? 'Résumé hebdo activé' : 'Résumé hebdo désactivé');
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ${
                weeklyRecap ? 'bg-brand' : 'bg-sand-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${
                  weeklyRecap ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </section>

        {/* Section 02: Confidentialité & Localisation */}
        <section className="bg-sand-card rounded-2xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] overflow-hidden">
          <div className="px-5 py-3 bg-[#FAF9F6] border-b hairline-border flex items-center justify-between">
            <span className="font-display text-[11px] font-bold text-brand uppercase tracking-wider">
              02 / Confidentialité & Localisation
            </span>
            <span className="font-display text-[11px] text-ink-muted">Précision • GPS</span>
          </div>

          {/* Row Link: Masquage point GPS */}
          <button
            type="button"
            onClick={handleGpsModal}
            className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 border-b hairline-border hover:bg-[#FAF9F6] transition-colors cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <span className="font-display text-[15px] font-bold text-ink uppercase block">
                Masquage du point GPS exact
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                <span className="font-display text-[11px] text-ink-muted font-medium">
                  Activé pour les non-membres (flou 400m de sécurité)
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-ink-muted text-[20px]">chevron_right</span>
          </button>

          {/* Row: Visibilité annuaire */}
          <div className="px-5 py-4 border-b hairline-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display text-[15px] font-bold text-ink uppercase">
                Visibilité dans l'annuaire
              </span>
              <span className="font-display text-[10px] text-brand font-bold uppercase tracking-wider">
                {audience === 'private' ? 'Cercle restreint' : 'Ouvert à tous'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setAudience('private')}
                className={`py-2.5 px-3 rounded-xl text-left transition-all cursor-pointer ${
                  audience === 'private'
                    ? 'bg-brand text-white shadow-xs'
                    : 'bg-[#FAF9F6] text-ink border hairline-border hover:bg-sand-muted'
                }`}
              >
                <span className="font-display text-[10px] uppercase font-bold block opacity-80">
                  Privé
                </span>
                <span className="font-display text-xs font-semibold block mt-0.5">
                  Clubs uniquement
                </span>
              </button>
              <button
                type="button"
                onClick={() => setAudience('public')}
                className={`py-2.5 px-3 rounded-xl text-left transition-all cursor-pointer ${
                  audience === 'public'
                    ? 'bg-brand text-white shadow-xs'
                    : 'bg-[#FAF9F6] text-ink border hairline-border hover:bg-sand-muted'
                }`}
              >
                <span className="font-display text-[10px] uppercase font-bold block opacity-80">
                  Public
                </span>
                <span className="font-display text-xs font-semibold block mt-0.5">
                  Toute la communauté
                </span>
              </button>
            </div>
          </div>

          {/* Row: Partage d'allure et statistiques */}
          <div className="px-5 py-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 pr-2">
              <span className="font-display text-[15px] font-bold text-ink uppercase block leading-snug">
                Partage d'allure et statistiques
              </span>
              <p className="font-sans text-xs text-ink-muted mt-1 leading-relaxed">
                Philosophie Atelier : Zéro chrono imposé. Seuls tes pas cumulés sont visibles.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={chronoShare}
              onClick={() => {
                setChronoShare(!chronoShare);
                showToast(!chronoShare ? 'Statistiques partagées' : 'Statistiques masquées');
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ${
                chronoShare ? 'bg-brand' : 'bg-sand-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${
                  chronoShare ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </section>

        {/* Section 03: Préférences Sportives & Allure */}
        <section className="bg-sand-card rounded-2xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] overflow-hidden">
          <div className="px-5 py-3 bg-[#FAF9F6] border-b hairline-border flex items-center justify-between">
            <span className="font-display text-[11px] font-bold text-brand uppercase tracking-wider">
              03 / Préférences Sportives
            </span>
            <span className="font-display text-[11px] text-ink-muted">Rythme & Ancrage</span>
          </div>

          {/* City Setting */}
          <div className="px-5 py-4 border-b hairline-border space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-display text-[15px] text-ink font-bold uppercase" htmlFor="city-input">
                Ville de référence
              </label>
              <span className="font-display text-[11px] text-ink-muted">Ma/Casablanca</span>
            </div>
            <div className="relative flex items-center">
              <input
                id="city-input"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-[#FAF9F6] text-ink font-display text-sm font-semibold px-3.5 py-2.5 rounded-xl border hairline-border focus:outline-none focus:border-brand uppercase tracking-tight"
              />
              <span className="absolute right-3 font-display text-[10px] text-brand uppercase font-bold">
                Actif
              </span>
            </div>
          </div>

          {/* Discipline Setting */}
          <div className="px-5 py-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display text-[15px] text-ink font-bold uppercase">
                Discipline favorite
              </span>
              <span className="font-display text-[10px] text-brand font-bold uppercase tracking-wider">
                Édition Active
              </span>
            </div>
            <div className="p-3 bg-[#FAF9F6] rounded-xl border hairline-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center border border-brand/15">
                  <span className="material-symbols-outlined text-[20px]">nordic_walking</span>
                </div>
                <div>
                  <span className="font-display text-sm font-bold text-ink uppercase block">
                    Marche active & conversation
                  </span>
                  <span className="font-sans text-xs text-ink-muted">
                    Allure 5.5 - 6.2 km/h • Débit fluide
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => showToast('Discipline ajustée')}
                className="font-display text-[11px] uppercase tracking-wider text-brand font-bold hover:underline cursor-pointer"
              >
                Ajuster
              </button>
            </div>
          </div>
        </section>

        {/* Section 04: Compte & Support */}
        <section className="bg-sand-card rounded-2xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] overflow-hidden">
          <div className="px-5 py-3 bg-[#FAF9F6] border-b hairline-border flex items-center justify-between">
            <span className="font-display text-[11px] font-bold text-brand uppercase tracking-wider">
              04 / Compte & Éthique
            </span>
            <span className="font-display text-[11px] text-ink-muted">RGPD & Bulles</span>
          </div>

          {/* RGPD Export */}
          <button
            type="button"
            onClick={handleRgpdExport}
            className="w-full text-left px-5 py-3.5 flex items-center justify-between hover:bg-[#FAF9F6] transition-colors border-b hairline-border cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-ink-muted text-[20px]">download</span>
              <span className="font-display text-sm font-bold text-ink uppercase">
                Exporter mes données personnelles (RGPD)
              </span>
            </div>
            <span className="font-display text-xs text-brand font-bold">.JSON</span>
          </button>

          {/* Charter */}
          <button
            type="button"
            onClick={handleCharter}
            className="w-full text-left px-5 py-3.5 flex items-center justify-between hover:bg-[#FAF9F6] transition-colors border-b hairline-border cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-ink-muted text-[20px]">verified_user</span>
              <span className="font-display text-sm font-bold text-ink uppercase">
                Charte de convivialité et sécurité
              </span>
            </div>
            <span className="material-symbols-outlined text-ink-muted text-[18px]">open_in_new</span>
          </button>

          {/* Guides Support */}
          <button
            type="button"
            onClick={handleGuides}
            className="w-full text-left px-5 py-3.5 flex items-center justify-between hover:bg-[#FAF9F6] transition-colors border-b hairline-border cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-ink-muted text-[20px]">forum</span>
              <span className="font-display text-sm font-bold text-ink uppercase">
                Contacter les guides de communauté
              </span>
            </div>
            <span className="font-display text-[11px] text-brand uppercase font-bold">Atelier Hub</span>
          </button>

          {/* Build Info */}
          <div className="px-5 py-3.5 bg-[#FAF9F6] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-display text-[10px] text-ink-muted uppercase tracking-wider font-semibold">
                Empreinte logicielle
              </span>
              <span className="font-display text-xs text-ink font-bold mt-0.5">
                GRPD Atelier v1.2.0 (Build 48)
              </span>
            </div>
            <span className="font-display text-[10px] text-brand uppercase font-bold">
              Stable / CAS-01
            </span>
          </div>
        </section>

        {/* Section 05: Primary Actions & Danger Zone */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="w-full h-12 bg-brand hover:bg-brand-dark text-white rounded-xl font-display text-xs uppercase tracking-[0.14em] font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">check</span>
            <span>Enregistrer les modifications</span>
          </button>

          <div className="flex flex-col items-center justify-center pt-2">
            <button
              type="button"
              onClick={handleConfirmDeletion}
              className="font-display text-[11px] uppercase tracking-wider text-red-600 hover:text-red-700 transition-colors py-2 px-3 font-bold cursor-pointer"
            >
              Supprimer mon compte et mes traces
            </button>
            <span className="font-sans text-xs text-ink-muted text-center mt-0.5">
              Cette action dissoudra irréversiblement ton profil et tes départs enregistrés.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
