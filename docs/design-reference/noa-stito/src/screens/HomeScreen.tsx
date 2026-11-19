import React, { useState } from 'react';
import { ScreenId, OutingItem } from '../types';
import { ALL_OUTINGS } from '../mockData';

interface HomeScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onSelectOuting: (outing: OutingItem) => void;
  outingsCount: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  onSelectOuting,
  outingsCount,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'walk' | 'dynamic_walk' | 'run'>('all');
  const [viewMode, setViewMode] = useState<'regular' | 'onboarding'>('regular');

  const heroOuting = ALL_OUTINGS[1]; // Footing matinal & Sunrise

  // Filter nearby outings
  const nearbyOutings = ALL_OUTINGS.filter((o) => {
    if (activeFilter === 'all') return o.id !== heroOuting.id;
    if (activeFilter === 'walk') return o.discipline === 'Marche';
    if (activeFilter === 'dynamic_walk') return o.discipline === 'M. dynamique';
    if (activeFilter === 'run') return o.discipline === 'Course';
    return true;
  });

  return (
    <div className="flex flex-col w-full pb-28 md:pb-16 pt-16 md:pt-20 px-4 md:px-8 max-w-6xl mx-auto animate-in fade-in duration-200">
      {/* 1. Editorial Header */}
      <section className="pt-2 pb-5 flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-sand-divider mb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-sans text-[11px] uppercase tracking-[0.14em] text-ink-muted font-medium">
              Vendredi 24 mai · Casablanca
            </span>
            <span className="text-sand-divider hidden sm:inline">·</span>
            <span className="text-[12px] font-display font-medium text-brand tracking-tight flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">wb_sunny</span>
              <span>Météo · 19°C Brise côtière</span>
            </span>
          </div>

          <h1 className="font-display text-[36px] sm:text-[42px] font-bold tracking-tighter text-ink mt-1.5 leading-none">
            On sort ?
          </h1>
        </div>

        {/* View mode toggle pill (Member vs Discovery) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'regular' ? 'onboarding' : 'regular')}
            className="text-xs font-sans font-medium px-3 py-1 rounded-full border border-sand-divider hover:border-brand/40 text-ink-muted hover:text-ink transition-colors cursor-pointer bg-sand-card/70 flex items-center gap-1.5"
            title="Basculer entre vue habituée et vue accueil débutant"
          >
            <span className="material-symbols-outlined text-[16px] text-brand">
              {viewMode === 'regular' ? 'school' : 'directions_run'}
            </span>
            <span>{viewMode === 'regular' ? 'Guide débutant' : 'Vue habituée'}</span>
          </button>
        </div>
      </section>

      {/* Onboarding Banner (if selected) */}
      {viewMode === 'onboarding' && (
        <section className="bg-sand-card rounded-[14px] p-5 border border-sand-divider shadow-sm space-y-4 mb-7 animate-in fade-in duration-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-brand">
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                groups_3
              </span>
              <span className="font-display text-xs font-bold uppercase tracking-wider">
                Bienvenue sur GRPD Maroc
              </span>
            </div>
            <h2 className="font-display text-xl font-bold text-ink">Rejoins ta première sortie</h2>
            <p className="font-sans text-sm text-ink-muted">
              Des groupes ouverts à Casablanca pour marcher ou courir à ton allure, sans chrono ni pression.
            </p>
          </div>

          <div className="bg-sand-muted/50 rounded-xl p-4 border border-sand-divider">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col space-y-0.5">
                <span className="font-display text-xs font-bold text-brand uppercase tracking-wider">
                  01. CHOISIR
                </span>
                <span className="font-sans text-sm text-ink font-semibold">Ton groupe & allure</span>
                <span className="text-xs text-ink-muted">Marche, papotage ou foulée</span>
              </div>
              <div className="flex flex-col space-y-0.5 border-t sm:border-t-0 sm:border-l border-sand-divider pt-2 sm:pt-0 sm:pl-3">
                <span className="font-display text-xs font-bold text-brand uppercase tracking-wider">
                  02. VALIDER
                </span>
                <span className="font-sans text-sm text-ink font-semibold">En un seul clic</span>
                <span className="text-xs text-ink-muted">Gratuit et sans engagement</span>
              </div>
              <div className="flex flex-col space-y-0.5 border-t sm:border-t-0 sm:border-l border-sand-divider pt-2 sm:pt-0 sm:pl-3">
                <span className="font-display text-xs font-bold text-brand uppercase tracking-wider">
                  03. BOUGER
                </span>
                <span className="font-sans text-sm text-ink font-semibold">Ensemble sur place</span>
                <span className="text-xs text-ink-muted">Accueil chaleureux garanti</span>
              </div>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between">
            <span className="font-sans text-xs text-ink-muted">
              Découvre la sélection de sorties douces et collectifs de quartier
            </span>
            <button
              onClick={() => onNavigate('onboarding')}
              className="px-3.5 py-1.5 rounded-lg bg-brand hover:bg-brand-dark text-white font-display text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Guide complet</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          </div>
        </section>
      )}

      {/* 2. Responsive 12-Column Flexible Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* LEFT COLUMN: Hero Confirmed Outing + Organiser Banner (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          {/* Framed Editorial Card */}
          <article className="bg-sand-card rounded-[14px] border border-sand-divider/80 overflow-hidden shadow-[0_2px_12px_rgba(17,19,17,0.03)] group">
            {/* Image container with precise aspect ratio and gradient */}
            <div className="relative w-full h-52 sm:h-60 overflow-hidden bg-sand-muted">
              <img
                className="w-full h-full object-cover object-center filter saturate-[0.92] contrast-[1.03] transform group-hover:scale-105 transition-transform duration-700 ease-out"
                alt="Muted golden sunrise over the Atlantic Ocean along the Corniche Ouest in Casablanca"
                src={heroOuting.heroImage}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent"></div>

              {/* Minimal top status with radar pulse */}
              <div className="absolute top-3.5 left-3.5 flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="status-dot-pulse absolute inline-flex h-full w-full rounded-full bg-brand"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
                </span>
                <span className="font-sans text-[11px] font-semibold text-brand tracking-tight">
                  Inscrit·e
                </span>
              </div>

              {/* Bottom overlay labels */}
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                <div className="flex items-center gap-1.5 font-sans text-[12px] font-medium tracking-tight">
                  <span className="material-symbols-outlined text-[15px] opacity-80">schedule</span>
                  <span>Départ 06:45 <span className="opacity-60">·</span> RDV 06:35</span>
                </div>
                <span className="font-display text-[11px] font-medium tracking-wider uppercase opacity-90">
                  Course
                </span>
              </div>
            </div>

            {/* Body specs with refined typography */}
            <div className="p-5 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-[21px] sm:text-[23px] font-bold tracking-tighter text-ink leading-tight">
                    Footing matinal & Sunrise
                  </h2>
                  <p className="font-sans text-[13px] text-ink-muted mt-1 tracking-tight">
                    <span className="font-semibold text-ink">Casa Runners Club</span>
                    <span className="mx-1.5 text-ink-subtle">·</span>
                    Phare d'El Hank, Corniche Ouest
                  </p>
                </div>
              </div>

              {/* Clean metric divider */}
              <div className="mt-4 pt-3.5 border-t border-sand-divider flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1 overflow-hidden">
                    <span className="w-5 h-5 rounded-full bg-sand-muted border border-white text-[9px] font-display font-semibold flex items-center justify-center text-ink-muted">
                      Y
                    </span>
                    <span className="w-5 h-5 rounded-full bg-sand-muted border border-white text-[9px] font-display font-semibold flex items-center justify-center text-ink-muted">
                      S
                    </span>
                    <span className="w-5 h-5 rounded-full bg-sand-muted border border-white text-[9px] font-display font-semibold flex items-center justify-center text-ink-muted">
                      M
                    </span>
                  </div>
                  <span className="font-sans text-ink-muted text-[12px]">
                    14 participants confirmés
                  </span>
                </div>
                <span className="font-display text-[12px] font-medium text-ink-muted">
                  7,5 km · 5:45/km
                </span>
              </div>

              {/* Primary Action with high craft */}
              <button
                onClick={() => {
                  onSelectOuting(heroOuting);
                  onNavigate('outing-detail');
                }}
                className="touch-interactive mt-4 w-full h-11 rounded-[10px] bg-brand hover:bg-brand-dark text-white font-sans text-[14px] font-medium flex items-center justify-center gap-2 tracking-tight group cursor-pointer shadow-sm transition-all"
                type="button"
              >
                <span>Voir la sortie</span>
                <span className="material-symbols-outlined text-[17px] transition-transform duration-200 group-hover:translate-x-0.5">
                  arrow_forward
                </span>
              </button>
            </div>
          </article>

          {/* Kinetic Minimalist Stats Bar */}
          <section className="bg-sand-card rounded-[14px] p-4 border border-sand-divider">
            <div className="grid grid-cols-3 text-center divide-x divide-sand-divider">
              <button
                onClick={() => onNavigate('mes-sorties')}
                className="flex flex-col items-center hover:opacity-80 transition-opacity cursor-pointer px-2"
              >
                <span className="font-display text-[26px] font-bold tracking-tighter text-ink leading-none">
                  {outingsCount}
                </span>
                <span className="font-sans text-[11px] text-ink-muted mt-1 uppercase tracking-wider font-medium">
                  à venir
                </span>
              </button>

              <button
                onClick={() => onNavigate('clubs')}
                className="flex flex-col items-center hover:opacity-80 transition-opacity cursor-pointer px-2"
              >
                <span className="font-display text-[26px] font-bold tracking-tighter text-ink leading-none">
                  3
                </span>
                <span className="font-sans text-[11px] text-ink-muted mt-1 uppercase tracking-wider font-medium">
                  clubs
                </span>
              </button>

              <button
                onClick={() => onNavigate('mes-sorties')}
                className="flex flex-col items-center hover:opacity-80 transition-opacity cursor-pointer px-2"
              >
                <span className="font-display text-[26px] font-bold tracking-tighter text-ink leading-none">
                  12
                </span>
                <span className="font-sans text-[11px] text-ink-muted mt-1 uppercase tracking-wider font-medium">
                  sorties
                </span>
              </button>
            </div>
          </section>

          {/* Editorial Action Banner: Organiser une sortie */}
          <section>
            <div
              onClick={() => onNavigate('organise-outing')}
              className="p-4 rounded-[12px] border border-sand-divider bg-sand-card/80 hover:bg-sand-card flex items-center justify-between gap-4 group cursor-pointer touch-interactive shadow-2xs transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </div>
                <div className="min-w-0">
                  <h4 className="font-display text-[14px] font-bold text-ink tracking-tight leading-tight">
                    Organiser une sortie
                  </h4>
                  <p className="font-sans text-[12px] text-ink-muted truncate mt-0.5">
                    Propose un parcours et invite ton groupe
                  </p>
                </div>
              </div>
              <span className="font-sans text-[13px] font-semibold text-brand shrink-0 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Créer</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </span>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Editorial Discovery: Sorties à proximité (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Section Header with Linear style */}
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-display text-[19px] sm:text-[21px] font-bold tracking-tighter text-ink">
              Sorties à proximité
            </h2>
            <button
              onClick={() => onNavigate('mes-sorties')}
              className="touch-interactive font-sans text-[12px] text-brand font-semibold flex items-center gap-0.5 group cursor-pointer"
              type="button"
            >
              <span>Tout voir</span>
              <span className="material-symbols-outlined text-[14px] transition-transform group-hover:translate-x-0.5">
                chevron_right
              </span>
            </button>
          </div>

          {/* Filter bar: Crisp textual underlines instead of bulky pills */}
          <div className="flex items-center gap-5 border-b border-sand-divider pb-2 mb-2 overflow-x-auto no-scrollbar">
            <button
              className={`filter-tab touch-interactive font-sans text-[13px] relative pb-2 -mb-2 border-b-2 cursor-pointer transition-colors ${
                activeFilter === 'all'
                  ? 'font-semibold text-ink border-brand'
                  : 'font-medium text-ink-muted hover:text-ink border-transparent'
              }`}
              onClick={() => setActiveFilter('all')}
              type="button"
            >
              Tout
            </button>

            <button
              className={`filter-tab touch-interactive font-sans text-[13px] relative pb-2 -mb-2 border-b-2 cursor-pointer transition-colors ${
                activeFilter === 'walk'
                  ? 'font-semibold text-ink border-brand'
                  : 'font-medium text-ink-muted hover:text-ink border-transparent'
              }`}
              onClick={() => setActiveFilter('walk')}
              type="button"
            >
              Marche
            </button>

            <button
              className={`filter-tab touch-interactive font-sans text-[13px] relative pb-2 -mb-2 border-b-2 cursor-pointer transition-colors ${
                activeFilter === 'dynamic_walk'
                  ? 'font-semibold text-ink border-brand'
                  : 'font-medium text-ink-muted hover:text-ink border-transparent'
              }`}
              onClick={() => setActiveFilter('dynamic_walk')}
              type="button"
            >
              Marche dynamique
            </button>

            <button
              className={`filter-tab touch-interactive font-sans text-[13px] relative pb-2 -mb-2 border-b-2 cursor-pointer transition-colors ${
                activeFilter === 'run'
                  ? 'font-semibold text-ink border-brand'
                  : 'font-medium text-ink-muted hover:text-ink border-transparent'
              }`}
              onClick={() => setActiveFilter('run')}
              type="button"
            >
              Course
            </button>
          </div>

          {/* Outings List: Editorial hairline rows with high contrast typography */}
          <div className="divide-y divide-sand-divider bg-sand-card rounded-[14px] border border-sand-divider px-4 overflow-hidden shadow-2xs">
            {nearbyOutings.map((outing) => (
              <div
                key={outing.id}
                onClick={() => {
                  onSelectOuting(outing);
                  onNavigate('outing-detail');
                }}
                className="outing-row py-4 flex items-center justify-between gap-4 group cursor-pointer touch-interactive"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[12px] font-sans text-ink-muted">
                    <span className="text-brand font-semibold">{outing.discipline}</span>
                    <span>·</span>
                    <span>{outing.dateStr.split(' ')[0]} {outing.dateStr.split(' ')[1]}, {outing.timeStr}</span>
                  </div>

                  <h3 className="font-display text-[16px] font-bold tracking-tight text-ink mt-0.5 group-hover:text-brand transition-colors truncate">
                    {outing.title}
                  </h3>

                  <p className="font-sans text-[12px] text-ink-muted mt-0.5 truncate">
                    {outing.clubName} <span className="opacity-40">/</span> {outing.location}
                  </p>

                  <div className="flex items-center gap-3 mt-1.5 font-sans text-[11px]">
                    <span className="text-ink font-semibold">
                      {outing.distanceKm} km · {outing.paceStr}
                    </span>
                    <span className="text-brand font-medium">
                      {outing.spotsTotal - outing.spotsBooked} places disponibles
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-ink-subtle group-hover:text-ink transition-transform duration-200 group-hover:translate-x-0.5">
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
