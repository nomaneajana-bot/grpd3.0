import React, { useState } from 'react';
import { ScreenId, ActivityFormat, OutingItem } from '../types';
import { IMAGES } from '../mockData';

interface OrganiseOutingScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onAddOuting: (newOuting: OutingItem) => void;
}

export const OrganiseOutingScreen: React.FC<OrganiseOutingScreenProps> = ({
  onNavigate,
  onAddOuting,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ActivityFormat>('Marche');
  const [allureLabel, setAllureLabel] = useState('ALLURE LIBRE');
  const [title, setTitle] = useState('Marche & conversation au coucher du soleil');
  const [ambiance, setAmbiance] = useState(
    "Prendre l'air après le travail, discuter à une allure douce et accessible en découvrant un nouveau coin."
  );
  const [pace, setPace] = useState(
    "RDV 18:15 pour l'accueil · Départ 18:30 · Boucle de 4,5 km à allure libre · Clôture vers 19:30 avec thé partagé sur les pelouses."
  );
  const [locationName, setLocationName] = useState('Anfa Park · Grande fontaine sèche');
  const [date, setDate] = useState('Sam. 1 Juin');
  const [year, setYear] = useState('2025');
  const [meetingTime, setMeetingTime] = useState('18:15');
  const [departureTime, setDepartureTime] = useState('18:30');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  const handleSelectFormat = (fmt: ActivityFormat, allure: string) => {
    setSelectedFormat(fmt);
    setAllureLabel(allure);
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsPublished(true);

      const newOuting: OutingItem = {
        id: `outing-${Date.now()}`,
        title,
        clubName: 'Les pas de Casa',
        clubId: 'club-pas-de-casa',
        discipline: selectedFormat,
        subType: selectedFormat === 'Course' ? 'Foulée collective' : 'Marche active',
        dateStr: `${date} ${year}`,
        timeStr: departureTime,
        departureTime,
        meetingTime,
        location: 'Anfa Park',
        city: 'Casablanca',
        meetingPointDetails: locationName,
        distanceKm: selectedFormat === 'Course' ? 7.5 : 4.5,
        paceStr: selectedFormat === 'Course' ? "5'30/km" : '~4 km/h',
        intensityStr: selectedFormat === 'Course' ? 'Modérée' : 'Douce & libre',
        description: ambiance,
        scheduleDetails: pace,
        heroImage: IMAGES.anfaSunset,
        mapImage: IMAGES.anfaParkMapSnippet,
        isRegistered: true,
        statusText: 'Inscrit·e',
        spotsTotal: 25,
        spotsBooked: 1,
        isPublic: visibility === 'public',
        host: {
          name: 'Mehdi Benjelloun',
          role: 'Guide & Créateur',
          avatar: IMAGES.mehdiAvatar,
          verified: true,
        },
      };

      onAddOuting(newOuting);

      setTimeout(() => {
        onNavigate('outing-detail');
      }, 1200);
    }, 900);
  };

  return (
    <div className="flex flex-col w-full pb-28 md:pb-16 pt-16 md:pt-20 px-4 md:px-8 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Sub-header context selector */}
      <div className="py-2 flex items-center justify-between mb-4 bg-sand-card p-3 rounded-xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)]">
        <button
          type="button"
          onClick={() => onNavigate('clubs')}
          className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-[#FAF9F6] text-ink hover:bg-sand-muted transition-colors cursor-pointer border hairline-border"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
          <span className="font-display text-[10px] uppercase tracking-wider text-ink-muted font-bold">
            Groupe :
          </span>
          <span className="font-display text-xs font-bold text-brand">Les pas de Casa</span>
          <span className="material-symbols-outlined text-[16px] text-ink-muted">expand_more</span>
        </button>
        <span className="font-display text-xs text-brand font-bold uppercase tracking-wider">
          ÉDITION 2025
        </span>
      </div>

      {/* Editorial Headline Section */}
      <div className="pt-2 pb-6 flex flex-col gap-1.5 border-b hairline-border mb-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-brand"></span>
          <span className="font-display text-[10px] uppercase tracking-widest text-ink-muted font-bold">
            Atelier Athletic · Casablanca
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight">
          Planifier une sortie.
        </h1>
        <p className="font-sans text-sm text-ink-muted max-w-md leading-relaxed">
          Partage un itinéraire, fixe un rendez-vous et bouge avec ton groupe en bord d'Atlantique.
        </p>
      </div>

      <form onSubmit={handlePublish} className="flex flex-col gap-6">
        {/* 2-Column Responsive Layout on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* LEFT COLUMN: Section 01 & Section 02 */}
          <div className="space-y-6">
            {/* SECTION 01: FORMAT & DISCIPLINE */}
            <div className="bg-sand-card p-5 rounded-2xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b hairline-border">
                <span className="font-display text-[10px] uppercase tracking-wider text-ink-muted font-bold">
                  01 / FORMAT & DISCIPLINE
                </span>
                <span className="font-display text-xs text-brand font-bold uppercase tracking-wider">
                  {allureLabel}
                </span>
              </div>

              {/* Segmented Tab Bar */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#FAF9F6] rounded-xl border hairline-border">
                <button
                  type="button"
                  onClick={() => handleSelectFormat('Marche', 'ALLURE LIBRE')}
                  className={`py-2.5 px-2 rounded-lg transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                    selectedFormat === 'Marche'
                      ? 'bg-brand text-white shadow-xs'
                      : 'bg-transparent text-ink-muted hover:text-ink'
                  }`}
                >
                  <span className="font-display text-xs font-bold tracking-tight">Marche</span>
                  <span className="font-display text-[9px] uppercase tracking-widest opacity-80 mt-0.5">
                    Doux
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectFormat('Course', "CADENCE 5'30")}
                  className={`py-2.5 px-2 rounded-lg transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                    selectedFormat === 'Course'
                      ? 'bg-brand text-white shadow-xs'
                      : 'bg-transparent text-ink-muted hover:text-ink'
                  }`}
                >
                  <span className="font-display text-xs font-bold tracking-tight">Course</span>
                  <span className="font-display text-[9px] uppercase tracking-widest opacity-80 mt-0.5">
                    Dynamique
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectFormat('M. dynamique', 'RYTHME 6.5 KM/H')}
                  className={`py-2.5 px-2 rounded-lg transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                    selectedFormat === 'M. dynamique'
                      ? 'bg-brand text-white shadow-xs'
                      : 'bg-transparent text-ink-muted hover:text-ink'
                  }`}
                >
                  <span className="font-display text-xs font-bold tracking-tight">M. Active</span>
                  <span className="font-display text-[9px] uppercase tracking-widest opacity-80 mt-0.5">
                    Soutenu
                  </span>
                </button>
              </div>
            </div>

            {/* SECTION 02: INTITULÉ & AMBIANCE */}
            <div className="bg-sand-card p-5 rounded-2xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b hairline-border">
                <span className="font-display text-[10px] uppercase tracking-wider text-ink-muted font-bold">
                  02 / INTITULÉ & AMBIANCE
                </span>
                <span className="font-display text-[10px] uppercase text-brand font-bold tracking-wider">
                  STYLE ÉDITORIAL
                </span>
              </div>

              {/* Title input */}
              <div className="flex flex-col gap-1.5">
                <label className="font-display text-xs font-bold uppercase tracking-wider text-ink" htmlFor="event-title">
                  Titre de la session
                </label>
                <input
                  id="event-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#FAF9F6] px-3.5 py-3 rounded-xl font-display text-sm font-bold text-ink border hairline-border focus:outline-none focus:border-brand transition-colors"
                  required
                />
              </div>

              {/* Description field */}
              <div className="flex flex-col gap-1.5">
                <label className="font-display text-xs font-bold uppercase tracking-wider text-ink" htmlFor="event-desc">
                  Objectif & ambiance
                </label>
                <textarea
                  id="event-desc"
                  rows={3}
                  value={ambiance}
                  onChange={(e) => setAmbiance(e.target.value)}
                  className="w-full bg-[#FAF9F6] p-3.5 rounded-xl font-sans text-xs text-ink leading-relaxed border hairline-border focus:outline-none focus:border-brand transition-colors resize-none"
                />
              </div>

              {/* Cadence & itinerary schedule */}
              <div className="p-3.5 bg-[#FAF9F6] rounded-xl flex flex-col gap-2 border hairline-border">
                <div className="flex items-center justify-between">
                  <span className="font-display text-[10px] uppercase tracking-wider text-brand font-bold">
                    Déroulé & Rythme programmé
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-brand">timer</span>
                </div>
                <p className="font-sans text-xs text-ink-muted leading-relaxed">
                  {pace}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Section 03 Rendez-vous & Section 04 Visibilité */}
          <div className="space-y-6">
            {/* SECTION 03: RENDEZ-VOUS & DATE */}
            <div className="bg-sand-card p-5 rounded-2xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b hairline-border">
                <span className="font-display text-[10px] uppercase tracking-wider text-ink-muted font-bold">
                  03 / RENDEZ-VOUS & DATE
                </span>
                <span className="font-display text-xs text-brand font-bold uppercase">CASABLANCA</span>
              </div>

              {/* Map snippet */}
              <div className="relative w-full rounded-xl overflow-hidden bg-sand-muted h-44 shadow-xs border hairline-border">
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url('${IMAGES.anfaParkMapSnippet}')` }}
                ></div>
                {/* Tactile Location Banner Pin */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-white/95 backdrop-blur-md p-2.5 rounded-lg flex items-center justify-between shadow-xs border border-sand-divider">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-brand text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[15px]">location_on</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-display text-xs font-bold text-ink truncate">
                        {locationName}
                      </span>
                      <span className="font-display text-[9px] text-ink-muted tracking-wide uppercase truncate">
                        Près de la promenade centrale
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = prompt('Modifier le point de rendez-vous :', locationName);
                      if (updated) setLocationName(updated);
                    }}
                    className="shrink-0 p-1 text-brand hover:text-brand-dark transition-colors cursor-pointer"
                    title="Modifier le point de rendez-vous"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit_location_alt</span>
                  </button>
                </div>
              </div>

              {/* Date & Hours 3-Column Telemetry Deck */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="p-3 bg-[#FAF9F6] rounded-xl border hairline-border flex flex-col justify-between">
                  <span className="font-display text-[10px] uppercase tracking-wider text-ink-muted font-bold">
                    Date
                  </span>
                  <div className="pt-2">
                    <span className="font-display text-xs font-bold text-ink block">{date}</span>
                    <span className="font-display text-[10px] text-ink-muted">{year}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#FAF9F6] rounded-xl border hairline-border flex flex-col justify-between">
                  <span className="font-display text-[10px] uppercase tracking-wider text-ink-muted font-bold">
                    Accueil
                  </span>
                  <div className="pt-2">
                    <span className="font-display text-xs font-bold text-ink block">{meetingTime}</span>
                    <span className="font-sans text-[10px] text-ink-muted">Briefing</span>
                  </div>
                </div>

                <div className="p-3 bg-[#FAF9F6] rounded-xl border hairline-border flex flex-col justify-between">
                  <span className="font-display text-[10px] uppercase tracking-wider text-ink-muted font-bold">
                    Départ
                  </span>
                  <div className="pt-2">
                    <span className="font-display text-xs font-bold text-brand block">{departureTime}</span>
                    <span className="font-display text-[10px] text-brand font-bold">Top départ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 04: VISIBILITÉ */}
            <div className="bg-sand-card p-5 rounded-2xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b hairline-border">
                <span className="font-display text-[10px] uppercase tracking-wider text-ink-muted font-bold">
                  04 / VISIBILITÉ DE LA SORTIE
                </span>
                <span className="font-display text-xs text-brand font-bold uppercase">ACCÈS</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {/* Option A: Publique */}
                <div
                  onClick={() => setVisibility('public')}
                  className={`cursor-pointer p-3.5 rounded-xl transition-all flex items-start justify-between border ${
                    visibility === 'public'
                      ? 'bg-brand/5 border-brand ring-1 ring-brand'
                      : 'bg-[#FAF9F6] border-sand-divider hover:border-brand/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 shrink-0 ${
                        visibility === 'public' ? 'bg-brand text-white' : 'bg-sand-muted'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-xs font-bold uppercase tracking-wide text-ink">
                          Publique
                        </span>
                        <span className="font-display text-[9px] px-1.5 py-0.5 rounded bg-brand/10 text-brand font-bold tracking-wider uppercase">
                          OUVERT
                        </span>
                      </div>
                      <p className="font-sans text-xs text-ink-muted pt-0.5 leading-snug">
                        Visible par tous les marcheurs de Casablanca. Idéal pour faire grandir la communauté locale.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Option B: Réservée aux adhérents */}
                <div
                  onClick={() => setVisibility('private')}
                  className={`cursor-pointer p-3.5 rounded-xl transition-all flex items-start justify-between border ${
                    visibility === 'private'
                      ? 'bg-brand/5 border-brand ring-1 ring-brand'
                      : 'bg-[#FAF9F6] border-sand-divider hover:border-brand/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 shrink-0 ${
                        visibility === 'private' ? 'bg-brand text-white' : 'bg-sand-muted'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-xs font-bold uppercase tracking-wide text-ink">
                          Club uniquement
                        </span>
                        <span className="material-symbols-outlined text-[14px] text-ink-muted">
                          lock
                        </span>
                      </div>
                      <p className="font-sans text-xs text-ink-muted pt-0.5 leading-snug">
                        Réservée exclusivement aux membres réguliers de l'atelier & adhérents inscrits.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mini summary snippet */}
        <div className="p-4 bg-sand-card rounded-2xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-brand">verified</span>
            <span className="font-sans text-xs font-semibold text-brand">
              Parcours vérifié : 4,5 km · Plat · Éclairé
            </span>
          </div>
          <span className="font-display text-[10px] uppercase font-bold text-ink-muted">
            NIV. 01
          </span>
        </div>

        {/* BOTTOM FLOATING ACTION BAR */}
        <div className="flex flex-col gap-2.5 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || isPublished}
            className="w-full h-12 bg-brand hover:bg-brand-dark text-white rounded-xl flex items-center justify-center gap-2 font-display text-xs uppercase tracking-[0.14em] font-bold transition-all shadow-sm cursor-pointer"
          >
            {isPublished ? (
              <>
                <span className="material-symbols-outlined text-[18px]">done</span>
                <span>Sortie Publiée !</span>
              </>
            ) : isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
                <span>Création en cours...</span>
              </>
            ) : (
              <>
                <span>Publier la sortie</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
          <div className="flex items-center justify-center gap-1.5 text-center">
            <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
            <span className="font-sans text-xs text-ink-muted">
              Aperçu direct et fiche partageable après publication
            </span>
          </div>
        </div>
      </form>
    </div>
  );
};
