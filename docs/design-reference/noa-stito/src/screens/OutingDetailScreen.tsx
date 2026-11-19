import React, { useState } from 'react';
import { ScreenId, OutingItem } from '../types';
import { IMAGES } from '../mockData';

interface OutingDetailScreenProps {
  outing: OutingItem;
  onNavigate: (screen: ScreenId) => void;
  onToggleRegistration: (outingId: string) => void;
}

export const OutingDetailScreen: React.FC<OutingDetailScreenProps> = ({
  outing,
  onNavigate,
  onToggleRegistration,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(outing.isRegistered);
  const [showMapsModal, setShowMapsModal] = useState(false);

  const handleToggleFav = () => {
    setIsSaved(!isSaved);
    showNotification(!isSaved ? 'Sortie ajoutée à tes favoris' : 'Sortie retirée de tes favoris');
  };

  const handleJoin = () => {
    const newState = !isJoined;
    setIsJoined(newState);
    onToggleRegistration(outing.id);
    showNotification(
      newState ? '🎉 Tu es inscrit(e) à cette sortie !' : 'Participation annulée'
    );
  };

  const showNotification = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 2500);
  };

  return (
    <div className="flex flex-col w-full pb-28 md:pb-16 pt-16 md:pt-20 px-4 md:px-8 max-w-6xl mx-auto animate-in fade-in duration-200">
      {/* Toast Alert */}
      {showToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-ink text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl border border-sand-divider/40 animate-in fade-in slide-in-from-top-2 duration-200">
          {showToast}
        </div>
      )}

      {/* Desktop Responsive Grid (7 cols left story, 5 cols right sticky panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Hero Story, Host, Spirit & Timeline */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          {/* Hero Photography Container with Editorial Vignette & Restraint */}
          <section className="relative w-full rounded-2xl overflow-hidden aspect-[4/3] bg-stone-900 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-outline-hairline">
            <div
              className="w-full h-full bg-cover bg-center transition-transform duration-1000 ease-out hover:scale-105"
              style={{ backgroundImage: `url('${outing.heroImage || IMAGES.anfaSunset}')` }}
            ></div>
            {/* Subtle multi-layer cinematic vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/20"></div>

            {/* Clean editorial overlays: Top context & Bottom Title */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <span className="text-[10px] font-display font-medium tracking-[0.16em] uppercase text-white/90 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-sm border border-white/10">
                Session publique · Anfa Park
              </span>
              <span className="text-[11px] font-sans text-white/80 flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-2.5 py-0.5 rounded-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{outing.spotsTotal - outing.spotsBooked} places</span>
              </span>
            </div>

            <div className="absolute bottom-4 left-4 right-4">
              <p className="font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70 mb-1">
                Édition crépuscule
              </p>
              <h1 className="font-display text-[27px] sm:text-[32px] leading-[1.1] font-bold text-white tracking-[-0.03em]">
                {outing.title}
              </h1>
            </div>
          </section>

          {/* Key Metrics Strip: High-end athletic typography with hairline dividers */}
          <section className="py-4 border-y border-outline-hairline bg-sand-card rounded-xl px-2">
            <div className="grid grid-cols-3 divide-x divide-outline-hairline text-center">
              {/* Metric 1: Distance */}
              <div className="px-2 flex flex-col items-center">
                <span className="font-display text-[10px] uppercase tracking-[0.18em] text-on-surface-variant font-medium">
                  Distance
                </span>
                <div className="mt-1 flex items-baseline justify-center">
                  <span className="font-display text-[26px] font-bold tracking-tight text-on-surface">
                    {outing.distanceKm.toString().replace('.', ',')}
                  </span>
                  <span className="font-sans text-[12px] font-medium text-on-surface-variant ml-0.5">km</span>
                </div>
                <span className="text-[11px] font-sans text-on-surface-variant/80 mt-0.5">Boucle plate</span>
              </div>

              {/* Metric 2: Pace */}
              <div className="px-2 flex flex-col items-center">
                <span className="font-display text-[10px] uppercase tracking-[0.18em] text-on-surface-variant font-medium">
                  Rythme
                </span>
                <div className="mt-1 flex items-baseline justify-center">
                  <span className="font-sans text-[16px] text-on-surface-variant/70 mr-0.5">~</span>
                  <span className="font-display text-[26px] font-bold tracking-tight text-on-surface">4</span>
                  <span className="font-sans text-[12px] font-medium text-on-surface-variant ml-0.5">km/h</span>
                </div>
                <span className="text-[11px] font-sans text-on-surface-variant/80 mt-0.5">Allure douce</span>
              </div>

              {/* Metric 3: Intensity */}
              <div className="px-2 flex flex-col items-center">
                <span className="font-display text-[10px] uppercase tracking-[0.18em] text-on-surface-variant font-medium">
                  Intensité
                </span>
                <div className="mt-1 flex items-baseline justify-center h-[31px]">
                  <span className="font-display text-[15px] font-bold tracking-tight text-primary">
                    Libre
                  </span>
                </div>
                <span className="text-[11px] font-sans text-on-surface-variant/80 mt-0.5">Tous niveaux</span>
              </div>
            </div>
          </section>

          {/* Host & Curating Club: Editorial layout */}
          <section className="flex items-center justify-between pb-5 border-b border-outline-hairline bg-sand-card p-4 rounded-xl border">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <img
                  className="w-11 h-11 rounded-full object-cover ring-1 ring-outline-hairline"
                  alt="Mehdi Benjelloun"
                  src={outing.host.avatar || IMAGES.mehdiAvatar}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[15px] font-bold tracking-tight text-on-surface">
                    {outing.host.name}
                  </span>
                  <span className="text-[11px] font-sans font-medium text-on-surface-variant">
                    {outing.host.role}
                  </span>
                </div>
                <p className="font-sans text-[13px] text-on-surface-variant truncate">
                  Pour{' '}
                  <span className="text-on-surface font-semibold underline decoration-outline-hairline underline-offset-2">
                    {outing.clubName}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('clubs')}
              className="px-3 py-1.5 text-[12px] font-display font-semibold tracking-wide border border-outline-hairline rounded-md text-on-surface hover:bg-surface-container transition-colors shrink-0 cursor-pointer"
            >
              Profil club
            </button>
          </section>

          {/* Open Access Note: Restrained Micro-editorial Banner */}
          <div className="px-4 py-3 bg-surface-container rounded-xl flex items-start gap-2.5 text-on-surface-variant border border-outline-hairline/60">
            <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">
              verified_user
            </span>
            <p className="font-sans text-[12.5px] leading-snug">
              Tu n'as <span className="font-semibold text-on-surface">pas besoin</span> d'adhérer au club pour t'inscrire à cette session publique.
            </p>
          </div>

          {/* Editorial Prose: L'esprit de la sortie */}
          <section className="bg-sand-card p-5 rounded-2xl border border-outline-hairline space-y-2">
            <h3 className="font-display text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.16em]">
              L'esprit de la sortie
            </h3>
            <p className="font-sans text-[15px] text-on-surface/90 leading-[1.65]">
              {outing.description}
            </p>
          </section>

          {/* Programme: Minimalist Vertical Typographic Timeline with Fine Thread Line */}
          <section className="bg-sand-card p-5 rounded-2xl border border-outline-hairline space-y-4">
            <h3 className="font-display text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.16em]">
              Au programme
            </h3>
            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[1px] before:bg-outline-hairline">
              {outing.timeline?.map((step, idx) => (
                <div key={idx} className="relative">
                  <div
                    className={`absolute -left-[24px] top-1.5 w-[11px] h-[11px] rounded-full border-2 border-surface ${
                      idx === 2 ? 'bg-outline' : 'bg-primary'
                    }`}
                  ></div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-[13px] font-bold text-primary">{step.time}</span>
                    <span className="font-display text-[14px] font-semibold text-on-surface">
                      {step.title}
                    </span>
                  </div>
                  <p className="font-sans text-[13px] text-on-surface-variant mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Clarification Note on Club Outings: Restyled with subtle luxury border */}
          <section className="p-4 rounded-xl bg-surface-container-low border border-outline-hairline">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                lock_outline
              </span>
              <h4 className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                Bon à savoir · Sorties de club
              </h4>
            </div>
            <p className="font-sans text-[13px] text-on-surface-variant leading-relaxed mb-3">
              Cette sortie-ci est <strong className="font-semibold text-on-surface">publique</strong>. Sur les sorties privées des clubs GRPD, le point GPS exact est masqué pour protéger le groupe :
            </p>
            <div className="p-3 bg-surface rounded-lg border border-outline-hairline flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-outline">
                  <span className="material-symbols-outlined text-[15px]">visibility_off</span>
                </div>
                <div>
                  <p className="font-display text-[12.5px] font-semibold text-on-surface">
                    Sortie réservée membres
                  </p>
                  <p className="font-body-sm text-[11px] text-on-surface-variant">
                    Lieu exact réservé aux membres
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('invitations')}
                className="px-2.5 py-1 text-[11px] font-display font-semibold text-on-surface border border-outline-hairline rounded hover:bg-surface-container transition-colors cursor-pointer"
              >
                Adhérer
              </button>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Coordinates, Attendees & Join Action Panel (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-5 lg:sticky lg:top-20">
          {/* Date, Time & Coordinates */}
          <section className="bg-sand-card p-5 rounded-2xl border border-outline-hairline space-y-4 shadow-2xs">
            <div className="flex items-start gap-3.5">
              <span className="material-symbols-outlined text-[20px] text-on-surface mt-0.5">schedule</span>
              <div className="flex-1">
                <p className="font-display text-[15px] font-bold text-on-surface tracking-tight">
                  {outing.dateStr}
                </p>
                <p className="font-sans text-[13px] text-on-surface-variant mt-0.5">
                  Départ à <span className="text-on-surface font-semibold">{outing.departureTime}</span> · Accueil dès{' '}
                  <span className="text-on-surface font-semibold">{outing.meetingTime}</span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 pt-2 border-t border-outline-hairline">
              <span className="material-symbols-outlined text-[20px] text-on-surface mt-0.5">location_on</span>
              <div className="flex-1">
                <p className="font-display text-[15px] font-bold text-on-surface tracking-tight">
                  {outing.location} · Grande Esplanade
                </p>
                <p className="font-sans text-[13px] text-on-surface-variant mt-0.5">
                  {outing.meetingPointDetails || 'Point de rendez-vous face à la fontaine sèche.'}
                </p>
              </div>
            </div>

            {/* Minimal Cartographic Vignette */}
            <div
              className="relative w-full h-36 rounded-xl overflow-hidden mt-3 border border-outline-hairline cursor-pointer group"
              onClick={() => setShowMapsModal(true)}
            >
              <div
                className="absolute inset-0 bg-cover bg-center grayscale-[20%] contrast-95 group-hover:scale-105 transition-transform duration-500"
                style={{ backgroundImage: `url('${outing.mapImage || IMAGES.mapAnfa}')` }}
              ></div>
              <div className="absolute bottom-2.5 right-2.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-display font-medium text-on-surface flex items-center gap-1 shadow-sm border border-black/5 hover:bg-white transition-colors">
                <span className="material-symbols-outlined text-[13px] text-primary">near_me</span>
                <span>Ouvrir dans Maps</span>
              </div>
            </div>
          </section>

          {/* Attendees: Clean Typographic Summary */}
          <section className="bg-sand-card p-5 rounded-2xl border border-outline-hairline shadow-2xs space-y-3">
            <div className="flex items-baseline justify-between mb-1">
              <div>
                <h3 className="font-display text-[16px] font-bold text-on-surface tracking-tight">
                  Participants
                </h3>
                <p className="font-sans text-[12.5px] text-on-surface-variant mt-0.5">
                  {outing.spotsBooked + (isJoined && !outing.isRegistered ? 1 : 0)} marcheurs inscrits ·{' '}
                  {outing.spotsTotal - (outing.spotsBooked + (isJoined && !outing.isRegistered ? 1 : 0))} places libres
                </p>
              </div>
              <span className="font-display text-[11px] tracking-wider uppercase font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200/60">
                Confirmé
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 overflow-hidden py-1">
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-surface object-cover"
                  alt="Participant 1"
                  src={IMAGES.attendee1}
                />
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-surface object-cover"
                  alt="Participant 2"
                  src={IMAGES.attendee2}
                />
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-surface object-cover"
                  alt="Participant 3"
                  src={IMAGES.attendee3}
                />
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-surface object-cover"
                  alt="Participant 4"
                  src={IMAGES.attendee4}
                />
                <div className="w-8 h-8 rounded-full bg-surface-container-high ring-2 ring-surface flex items-center justify-center text-on-surface font-display text-[11px] font-bold">
                  +10
                </div>
              </div>
              <span className="font-sans text-[12.5px] text-on-surface-variant">
                Rejoins la communauté ce samedi
              </span>
            </div>
          </section>

          {/* Desktop Join Action Box */}
          <div className="hidden lg:flex items-center gap-3 p-4 bg-sand-card rounded-2xl border border-outline-hairline shadow-xs">
            <button
              aria-label="Enregistrer la sortie"
              className="w-12 h-12 rounded-xl border border-outline-hairline bg-surface hover:bg-surface-container flex items-center justify-center text-on-surface transition-all active:scale-95 shrink-0 cursor-pointer"
              onClick={handleToggleFav}
            >
              <span
                className={`material-symbols-outlined text-[20px] ${isSaved ? 'text-primary' : ''}`}
                style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}
              >
                {isSaved ? 'bookmark' : 'bookmark_border'}
              </span>
            </button>

            <button
              className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary-dark text-white active:scale-[0.99] transition-all px-4 flex items-center justify-between shadow-[0_4px_16px_rgba(11,59,36,0.22)] cursor-pointer"
              onClick={handleJoin}
            >
              <div className="flex flex-col text-left">
                <span className="font-display text-[14px] font-bold tracking-tight text-white leading-tight">
                  {isJoined ? 'Tu es inscrit(e)' : 'Rejoindre la sortie'}
                </span>
                <span className="font-sans text-[11px] text-white/70 font-normal">
                  {isJoined ? 'Place confirmée' : 'Accès libre · Gratuit'}
                </span>
              </div>
              <span
                className="material-symbols-outlined text-[20px] text-white/90"
                style={{ fontVariationSettings: isJoined ? "'FILL' 1" : "'FILL' 0" }}
              >
                {isJoined ? 'check_circle' : 'arrow_forward'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Floating Action Bar: Tracksmith / Strava Summit craft */}
      <aside className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-outline-hairline pb-safe lg:hidden">
        <div className="max-w-[414px] mx-auto px-5 py-3 flex items-center gap-3">
          <button
            aria-label="Enregistrer la sortie"
            className="w-12 h-12 rounded-xl border border-outline-hairline bg-surface hover:bg-surface-container flex items-center justify-center text-on-surface transition-all active:scale-95 shrink-0 cursor-pointer"
            onClick={handleToggleFav}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${isSaved ? 'text-primary' : ''}`}
              style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}
            >
              {isSaved ? 'bookmark' : 'bookmark_border'}
            </span>
          </button>

          <button
            className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary-dark text-white active:scale-[0.99] transition-all px-4 flex items-center justify-between shadow-[0_4px_16px_rgba(11,59,36,0.22)] cursor-pointer"
            onClick={handleJoin}
          >
            <div className="flex flex-col text-left">
              <span className="font-display text-[14px] font-bold tracking-tight text-white leading-tight">
                {isJoined ? 'Tu es inscrit(e)' : 'Rejoindre la sortie'}
              </span>
              <span className="font-sans text-[11px] text-white/70 font-normal">
                {isJoined ? 'Place confirmée' : 'Accès libre · Gratuit'}
              </span>
            </div>
            <span
              className="material-symbols-outlined text-[20px] text-white/90"
              style={{ fontVariationSettings: isJoined ? "'FILL' 1" : "'FILL' 0" }}
            >
              {isJoined ? 'check_circle' : 'arrow_forward'}
            </span>
          </button>
        </div>
      </aside>

      {/* Interactive Maps Modal */}
      {showMapsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-sand-card rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-3.5 border border-outline-hairline">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold">
                <span className="material-symbols-outlined text-[20px]">near_me</span>
                <span className="font-display text-sm">Point de rassemblement GPS</span>
              </div>
              <button
                onClick={() => setShowMapsModal(false)}
                className="text-on-surface-variant hover:text-on-surface w-8 h-8 rounded-full flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="w-full h-56 rounded-xl overflow-hidden relative shadow-inner">
              <img
                src={outing.mapImage || IMAGES.mapAnfa}
                alt="Carte Anfa Park"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-white/90 px-3 py-1.5 rounded-md text-xs font-bold text-primary flex items-center gap-1.5 shadow-sm border border-black/5">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                <span>Anfa Park Casablanca (33.5788° N, 7.6659° W)</span>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
              Rendez-vous devant la fontaine sèche centrale face à la Grande Esplanade. Allées éclairées et parking disponible.
            </p>
            <button
              onClick={() => setShowMapsModal(false)}
              className="w-full h-11 rounded-xl bg-primary text-white font-display text-sm font-semibold transition-all cursor-pointer"
            >
              Fermer la carte
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
