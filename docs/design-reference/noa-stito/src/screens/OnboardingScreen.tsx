import React, { useState } from 'react';
import { ScreenId, OutingItem } from '../types';
import { IMAGES, ALL_OUTINGS } from '../mockData';

interface OnboardingScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onSelectOuting: (outing: OutingItem) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onNavigate,
  onSelectOuting,
}) => {
  const [participatingToast, setParticipatingToast] = useState<string | null>(null);

  const handleJoinSessionA = () => {
    setParticipatingToast('🎉 Inscription confirmée pour la marche à la Corniche Aïn Diab !');
    setTimeout(() => setParticipatingToast(null), 3000);
  };

  const handleSelectOutingB = () => {
    const outing = ALL_OUTINGS.find((o) => o.location.includes('Anfa Park')) || ALL_OUTINGS[0];
    onSelectOuting(outing);
    onNavigate('outing-detail');
  };

  return (
    <div className="flex flex-col w-full pb-28 md:pb-16 pt-16 md:pt-20 px-4 md:px-8 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Toast Alert */}
      {participatingToast && (
        <div className="fixed top-16 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 z-50 pointer-events-none transition-all duration-300 flex items-center justify-between px-4 py-3 rounded-xl bg-brand text-white shadow-xl border border-sand-divider/40">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="font-display text-xs uppercase tracking-wider font-semibold">
              {participatingToast}
            </span>
          </div>
        </div>
      )}

      {/* Status & Coastal Telemetry Strip */}
      <section className="px-4 py-2.5 bg-sand-card rounded-2xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand"></span>
          <span className="font-display text-[11px] uppercase tracking-[0.14em] text-ink font-bold">
            Casablanca · Maroc
          </span>
        </div>
        <div className="flex items-center gap-2 text-ink-muted font-display text-[11px] font-semibold">
          <span>24 MAI</span>
          <span className="opacity-40">/</span>
          <span className="flex items-center gap-1 text-brand">
            <span className="material-symbols-outlined text-[14px]">air</span>
            21°C · Brise marine
          </span>
        </div>
      </section>

      {/* Editorial Salutation */}
      <header className="pb-6 flex flex-col gap-1.5 border-b hairline-border mb-6">
        <div className="flex items-center gap-2">
          <span className="font-display text-[10px] uppercase tracking-[0.16em] text-brand font-bold">
            Premier Pas · Étape Initiale
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
          Bienvenue, Karim.
        </h1>
        <p className="font-sans text-sm sm:text-base text-ink-muted leading-relaxed max-w-2xl mt-1">
          Prêt pour ta première foulée ou balade collective à Casablanca ? Aucun chrono, aucune pression : simplement le plaisir du grand air.
        </p>
      </header>

      {/* 2-Column Responsive Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* LEFT COLUMN: Visual Break, 3 Steps & Recommandations (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          {/* Visual Break: Moroccan Coast Morning Mood */}
          <section className="relative w-full h-52 sm:h-60 rounded-2xl overflow-hidden bg-sand-muted shadow-[0_2px_12px_rgba(17,19,17,0.03)] border hairline-border group">
            <img
              src={IMAGES.oceanMorningMood}
              alt="Littoral de Casablanca au lever du soleil"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand/90 via-brand/30 to-transparent flex flex-col justify-end p-5 text-white">
              <span className="font-display text-[10px] uppercase tracking-[0.16em] text-white/80 font-bold mb-1">
                Atmosphère du littoral
              </span>
              <p className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                Rejoins un collectif à ciel ouvert.
              </p>
            </div>
          </section>

          {/* Editorial Process: 3 Temps */}
          <section className="p-5 bg-sand-card rounded-2xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b hairline-border">
              <span className="font-display text-[10px] uppercase tracking-[0.14em] text-ink-muted font-bold">
                Mécanique de bienvenue
              </span>
              <span className="font-display text-xs text-brand font-bold uppercase tracking-wider">
                03 ÉTAPES
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Step 01 */}
              <div className="flex items-start gap-3.5">
                <span className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-display text-xs font-bold shrink-0 border border-brand/15">
                  01
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-sm font-bold uppercase tracking-tight text-ink">
                      Choisir
                    </h3>
                    <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                  </div>
                  <p className="font-sans text-xs text-ink-muted mt-0.5 leading-relaxed">
                    Un groupe accueillant selon ton allure, ton énergie ou ton quartier casablancais.
                  </p>
                </div>
              </div>

              {/* Step 02 */}
              <div className="flex items-start gap-3.5">
                <span className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-display text-xs font-bold shrink-0 border border-brand/15">
                  02
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-sm font-bold uppercase tracking-tight text-ink">
                      Rejoindre
                    </h3>
                    <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                  </div>
                  <p className="font-sans text-xs text-ink-muted mt-0.5 leading-relaxed">
                    En 1 clic, entièrement gratuit, sans engagement ni abonnement préalable.
                  </p>
                </div>
              </div>

              {/* Step 03 */}
              <div className="flex items-start gap-3.5">
                <span className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-display text-xs font-bold shrink-0 border border-brand/15">
                  03
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-sm font-bold uppercase tracking-tight text-ink">
                      Marcher ou courir
                    </h3>
                    <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                  </div>
                  <p className="font-sans text-xs text-ink-muted mt-0.5 leading-relaxed">
                    Accueil bienveillant sur place, le regard tourné vers l'Atlantique ou les oliviers du parc.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('accueil')}
              className="w-full h-11 bg-brand hover:bg-brand-dark text-white font-display text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <span>Explorer les sorties de la semaine</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </section>

          {/* Section: Sorties Idéales Pour Débuter */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between px-1">
              <div>
                <span className="font-display text-[10px] uppercase tracking-[0.14em] text-ink-muted font-bold block">
                  Recommandations novices
                </span>
                <h3 className="font-display text-xl font-bold text-ink mt-0.5 tracking-tight">
                  Première sortie sans stress
                </h3>
              </div>
              <span className="font-display text-xs text-brand font-bold uppercase">
                2 SESSIONS
              </span>
            </div>

            {/* Session A: Corniche Aïn Diab */}
            <article className="p-5 bg-sand-card rounded-2xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] space-y-3.5">
              <div className="flex items-center justify-between text-xs font-display">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand"></span>
                  <span className="font-bold text-brand uppercase tracking-wider">
                    SAMEDI · 09:00
                  </span>
                </div>
                <span className="uppercase tracking-wider font-semibold text-ink-muted text-[10px]">
                  Niveau Accessible
                </span>
              </div>

              <div>
                <h4 className="font-display text-lg font-bold text-ink leading-tight">
                  Marche découverte & rythme libre
                </h4>
                <p className="font-sans text-xs text-ink-muted mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-brand">location_on</span>
                  Corniche Aïn Diab · Plage Lalla Meryem
                </p>
              </div>

              {/* Fragment image */}
              <div className="relative w-full h-28 rounded-xl overflow-hidden bg-sand-muted border hairline-border">
                <img
                  src={IMAGES.runningShoesPromenade}
                  alt="Chaussures de sport sur la corniche"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2.5 py-0.5 bg-black/60 backdrop-blur-md rounded text-white font-display text-[10px] uppercase font-bold tracking-wider">
                  Capitaine : Yacine B.
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1 overflow-hidden">
                    <span className="inline-block h-6 w-6 rounded-full bg-brand text-white font-display text-[9px] flex items-center justify-center font-bold ring-2 ring-white">
                      YB
                    </span>
                    <span className="inline-block h-6 w-6 rounded-full bg-sand-muted text-ink font-display text-[9px] flex items-center justify-center font-semibold ring-2 ring-white border hairline-border">
                      SA
                    </span>
                    <span className="inline-block h-6 w-6 rounded-full bg-sand-muted text-ink-muted font-display text-[9px] flex items-center justify-center ring-2 ring-white border hairline-border">
                      +10
                    </span>
                  </div>
                  <span className="font-sans text-xs text-ink-muted">12 inscrits · 6 places</span>
                </div>
                <button
                  type="button"
                  onClick={handleJoinSessionA}
                  className="h-9 px-4 bg-brand hover:bg-brand-dark text-white font-display text-xs uppercase tracking-wider font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  Je participe
                </button>
              </div>
            </article>

            {/* Session B: Anfa Park Sunset */}
            <article className="p-5 bg-sand-card rounded-2xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] space-y-3.5">
              <div className="flex items-center justify-between text-xs font-display">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand"></span>
                  <span className="font-bold text-brand uppercase tracking-wider">
                    DIMANCHE · 18:00
                  </span>
                </div>
                <span className="uppercase tracking-wider font-semibold text-ink-muted text-[10px]">
                  Accès Libre
                </span>
              </div>

              <div>
                <h4 className="font-display text-lg font-bold text-ink leading-tight">
                  Marche collective au coucher du soleil
                </h4>
                <p className="font-sans text-xs text-ink-muted mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-brand">park</span>
                  Anfa Park · Grande Esplanade Centrale
                </p>
              </div>

              <div className="flex items-center gap-3 text-ink-muted font-display text-xs py-1">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">straighten</span>
                  4,5 km
                </span>
                <span className="opacity-40">/</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">pace</span>
                  Allure paisible
                </span>
                <span className="opacity-40">/</span>
                <span className="text-brand font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">local_cafe</span>
                  Thé offert
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="font-sans text-xs text-ink-muted italic">
                  Ouvert à tous sans réservation
                </span>
                <button
                  type="button"
                  onClick={handleSelectOutingB}
                  className="h-9 px-4 bg-[#FAF9F6] hover:bg-sand-muted border hairline-border text-ink font-display text-xs uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer"
                >
                  Détails
                </button>
              </div>
            </article>
          </section>
        </div>

        {/* RIGHT COLUMN: Route Teaser Map, Clubs Recommandés & Charter (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          {/* Interactive Route Teaser Map */}
          <section className="bg-sand-card rounded-2xl p-4 border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-display text-[10px] uppercase tracking-[0.14em] text-ink-muted font-bold">
                Territoire d'action
              </span>
              <span className="font-display text-xs text-brand font-bold uppercase">
                ANFA & CORNICHE
              </span>
            </div>

            <div
              className="w-full h-44 rounded-xl bg-cover bg-center relative overflow-hidden flex flex-col justify-between p-3 border hairline-border shadow-inner"
              style={{ backgroundImage: `url('${IMAGES.routeTeaserMap}')` }}
            >
              <div className="self-start px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-lg text-brand font-display text-[11px] font-bold flex items-center gap-1.5 shadow-xs border border-brand/10">
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse"></span>
                <span>Points de RDV balisés</span>
              </div>
              <div className="self-end px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-lg font-display text-[10px] uppercase font-bold text-ink shadow-xs">
                Plan d'accès officiel
              </div>
            </div>
          </section>

          {/* Section: Clubs Recommandés */}
          <section className="bg-sand-card rounded-2xl p-5 border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-display text-[10px] uppercase tracking-[0.14em] text-ink-muted font-bold block">
                  Collectifs locaux
                </span>
                <h3 className="font-display text-lg font-bold text-ink mt-0.5 tracking-tight">
                  Clubs recommandés
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('clubs')}
                className="font-display text-xs text-brand uppercase font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
              >
                Tous
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>

            <div className="space-y-3">
              {/* Club 1: Les pas de Casa */}
              <div className="p-3 bg-[#FAF9F6] rounded-xl flex items-center justify-between border hairline-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center font-display text-sm font-bold shrink-0">
                    PC
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-display text-sm font-bold text-ink truncate">
                        Les pas de Casa
                      </h4>
                      <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                    </div>
                    <p className="font-sans text-xs text-ink-muted truncate">
                      Marche & conversation libre · 48 membres
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('clubs')}
                  className="h-8 px-3 ml-2 shrink-0 bg-white hover:bg-sand-muted border hairline-border text-ink font-display text-xs uppercase font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Découvrir
                </button>
              </div>

              {/* Club 2: Anfa Strollers */}
              <div className="p-3 bg-[#FAF9F6] rounded-xl flex items-center justify-between border hairline-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-sand-muted text-ink flex items-center justify-center font-display text-sm font-bold shrink-0 border hairline-border">
                    AS
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-display text-sm font-bold text-ink truncate">
                        Anfa Strollers
                      </h4>
                    </div>
                    <p className="font-sans text-xs text-ink-muted truncate">
                      Promenade urbaine & bien-être · 180 membres
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('clubs')}
                  className="h-8 px-3 ml-2 shrink-0 bg-white hover:bg-sand-muted border hairline-border text-ink font-display text-xs uppercase font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Découvrir
                </button>
              </div>
            </div>
          </section>

          {/* Kind Charter Footer Area */}
          <footer className="p-5 bg-sand-card rounded-2xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] flex flex-col items-center text-center gap-2">
            <div className="w-11 h-11 rounded-xl bg-brand/10 border border-brand/15 text-brand flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">volunteer_activism</span>
            </div>
            <h4 className="font-display text-base font-bold text-ink mt-1">
              Une question sur le fonctionnement ?
            </h4>
            <p className="font-sans text-xs text-ink-muted max-w-xs leading-relaxed">
              GRPD repose sur la bienveillance active : chacun avance à son rythme, personne n'est laissé derrière.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="mt-1 font-display text-xs text-brand font-bold uppercase tracking-wider flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>Lire la charte bienveillante</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};
