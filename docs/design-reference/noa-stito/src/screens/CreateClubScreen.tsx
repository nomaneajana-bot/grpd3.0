import React, { useState } from 'react';
import { ScreenId, ClubData } from '../types';
import { IMAGES } from '../mockData';

interface CreateClubScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onClubCreated?: (newClub: ClubData) => void;
}

export const CreateClubScreen: React.FC<CreateClubScreenProps> = ({
  onNavigate,
  onClubCreated,
}) => {
  const [clubName, setClubName] = useState('Les pas de Casa');
  const [selectedCity, setSelectedCity] = useState('Casablanca, Grand Casablanca');
  const [showCitySheet, setShowCitySheet] = useState(false);
  const [manifesto, setManifesto] = useState(
    "Marche vivifiante le samedi matin à l'aube sur la Corniche d'Aïn Diab. Allure libre, causeries spontanées et arrêt thé à la menthe obligatoire. Accessible à tous les rythmes."
  );
  const [membership, setMembership] = useState<'public' | 'curated' | 'invite'>('curated');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmationBanner, setShowConfirmationBanner] = useState(false);

  const citiesList = [
    {
      name: 'Casablanca, Grand Casablanca',
      title: 'Casablanca',
      districts: 'Aïn Diab, Gauthier, Oasis, Anfa',
    },
    {
      name: 'Rabat, Rabat-Salé-Kénitra',
      title: 'Rabat',
      districts: 'Agdal, Hassan, Forêt Hilton',
    },
    {
      name: 'Marrakech, Palmeraie & Médina',
      title: 'Marrakech',
      districts: 'Hivernage, Guéliz, Circuit Palmeraie',
    },
    {
      name: 'Tanger, Baie & Cap Spartel',
      title: 'Tanger',
      districts: 'Malabata, Marshan, Boulevard',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setShowConfirmationBanner(true);

      const createdClub: ClubData = {
        id: `club-${Date.now()}`,
        name: clubName,
        city: selectedCity.split(',')[0],
        coverImage: IMAGES.clubCoverAnfa,
        description: manifesto,
        memberCount: 1,
        activeStatus: 'Nouveau club actif',
        visibility: membership === 'public' ? 'public' : membership === 'curated' ? 'request' : 'private',
        isAdmin: true,
        inviteCode: `${clubName.slice(0, 4).toUpperCase()}-2025`,
        host: {
          name: 'Mehdi Benjelloun',
          role: 'Fondateur',
          avatar: IMAGES.mehdiAvatar,
          stats: 'Fondé aujourd’hui · Administrateur',
        },
        affinityGroups: [
          {
            id: 'group-conv',
            title: 'Échanges & papotages',
            description: 'Marcheurs du quartier',
            icon: 'forum',
            memberCount: 1,
            joined: true,
            bgColorClass: 'bg-sand-muted text-ink',
          },
        ],
        members: [
          {
            id: 'm-founder',
            name: 'Mehdi Benjelloun',
            role: 'Fondateur',
            tag: 'Fondateur',
            initials: 'MB',
            distanceStr: '128 km',
            activeTimeStr: 'En ligne',
          },
        ],
      };

      if (onClubCreated) {
        onClubCreated(createdClub);
      }

      setTimeout(() => {
        onNavigate('clubs');
      }, 1500);
    }, 800);
  };

  return (
    <div className="flex flex-col w-full pb-28 md:pb-16 pt-16 md:pt-20 px-4 md:px-8 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Interactive feedback celebration banner */}
      {showConfirmationBanner && (
        <div className="fixed top-16 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 z-50 bg-brand text-white p-4 rounded-xl flex items-center justify-between shadow-2xl border border-sand-divider/40 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-300 text-[24px]">verified</span>
            <div className="flex flex-col">
              <span className="font-display text-sm font-bold">Collectif inauguré !</span>
              <span className="font-sans text-xs text-white/80">
                Préparation des clés d'invitation...
              </span>
            </div>
          </div>
          <span className="font-display text-xs text-emerald-300 font-bold">OK</span>
        </div>
      )}

      {/* Status & Context Pip */}
      <div className="flex items-center justify-between py-2 mb-4 bg-sand-card p-3 rounded-xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
          <span className="font-display text-[10px] uppercase tracking-widest text-ink font-bold">
            Atelier Fondateur
          </span>
        </div>
        <span className="font-display text-xs text-brand font-bold uppercase tracking-wider">
          Édition 2025
        </span>
      </div>

      {/* Editorial Headline Area */}
      <div className="flex flex-col gap-1.5 pb-6 border-b hairline-border mb-6">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight">
          Fonder un club.
        </h1>
        <p className="font-sans text-sm text-ink-muted leading-relaxed max-w-lg mt-0.5">
          Donne un cadre bienveillant à tes sorties régulières et rassemble tes coéquipiers à Casablanca ou ailleurs.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* 2-Column Responsive Layout on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* LEFT COLUMN: Section 01 Nom & Localisation + Section 02 Vocation */}
          <div className="space-y-6">
            {/* Section 01: Identité & Territoire */}
            <div className="bg-sand-card p-5 rounded-2xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b hairline-border">
                <span className="font-display text-[10px] uppercase tracking-widest text-brand font-bold">
                  01 / Nom & Localisation
                </span>
                <span className="font-display text-xs text-ink-muted font-semibold">Obligatoire</span>
              </div>

              {/* Field: Nom du Club */}
              <div className="flex flex-col gap-1.5">
                <label className="font-display text-xs font-bold uppercase tracking-wider text-ink" htmlFor="club-name">
                  Nom officiel
                </label>
                <div className="relative flex items-center">
                  <input
                    id="club-name"
                    type="text"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder="Ex: Gazelles de l'Oasis"
                    className="w-full h-11 bg-[#FAF9F6] text-ink font-display text-sm font-bold px-3.5 pr-10 rounded-xl border hairline-border focus:outline-none focus:border-brand transition-all"
                    required
                  />
                  <span className="absolute right-3.5 text-brand flex items-center" title="Nom disponible">
                    <span className="material-symbols-outlined text-[19px]">check_circle</span>
                  </span>
                </div>
                <span className="font-sans text-xs text-ink-muted">
                  Ce nom figurera sur votre carnet de route et vos invitations.
                </span>
              </div>

              {/* Field: Ville Principale Trigger */}
              <div className="flex flex-col gap-1.5">
                <label className="font-display text-xs font-bold uppercase tracking-wider text-ink">
                  Territoire d'ancrage
                </label>
                <button
                  type="button"
                  onClick={() => setShowCitySheet(true)}
                  className="w-full h-11 bg-[#FAF9F6] text-ink px-3.5 rounded-xl border hairline-border flex items-center justify-between hover:bg-sand-muted transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-brand">near_me</span>
                    <span className="font-display text-xs sm:text-sm font-semibold truncate">
                      {selectedCity}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-ink-muted">expand_more</span>
                </button>
              </div>
            </div>

            {/* Section 02: Vocation du Collectif */}
            <div className="bg-sand-card p-5 rounded-2xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b hairline-border">
                <span className="font-display text-[10px] uppercase tracking-widest text-brand font-bold">
                  02 / Vocation du Collectif
                </span>
                <span className="font-display text-xs text-ink-muted font-semibold">Manifeste</span>
              </div>

              <div className="flex flex-col gap-3">
                <textarea
                  id="club-manifesto"
                  rows={4}
                  value={manifesto}
                  onChange={(e) => setManifesto(e.target.value)}
                  placeholder="Ex: Marche chaque samedi matin le long de la Corniche..."
                  className="w-full bg-[#FAF9F6] text-ink font-sans text-xs p-3.5 rounded-xl border hairline-border focus:outline-none focus:border-brand transition-all resize-none leading-relaxed"
                />

                {/* Atmospheric Editorial Note */}
                <div className="bg-[#FAF9F6] p-4 rounded-xl border hairline-border flex items-start gap-3">
                  <span className="material-symbols-outlined text-[20px] text-brand shrink-0 mt-0.5">
                    nature_people
                  </span>
                  <p className="font-sans text-xs text-ink-muted leading-relaxed">
                    Pas de prérequis de vitesse ni d'esprit de compétition. La marche culturelle, les footings matinaux ou les conversations libres sont tous les bienvenus.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Section 03 Politique d'Adhésion + Rituel Fondateur */}
          <div className="space-y-6">
            {/* Section 03: Politique d'Adhésion */}
            <div className="bg-sand-card p-5 rounded-2xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b hairline-border">
                <span className="font-display text-[10px] uppercase tracking-widest text-brand font-bold">
                  03 / Politique d'Adhésion
                </span>
                <span className="font-display text-xs text-ink-muted font-semibold">Accès</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {/* Option 1: Public */}
                <label
                  onClick={() => setMembership('public')}
                  className={`cursor-pointer p-4 rounded-xl transition-all flex items-start justify-between gap-3 border ${
                    membership === 'public'
                      ? 'bg-brand/5 border-brand ring-1 ring-brand'
                      : 'bg-[#FAF9F6] border-sand-divider hover:border-brand/40'
                  }`}
                >
                  <div className="flex flex-col gap-1 pr-2">
                    <span className="font-display text-sm font-bold text-ink">
                      Public & ouvert
                    </span>
                    <p className="font-sans text-xs text-ink-muted leading-relaxed">
                      Tout le monde peut rejoindre instantanément via l'annuaire ou lien de partage direct.
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      membership === 'public' ? 'bg-brand' : 'bg-sand-muted border hairline-border'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        membership === 'public' ? 'bg-white' : 'bg-transparent'
                      }`}
                    ></span>
                  </div>
                </label>

                {/* Option 2: Curated (Selected by default) */}
                <label
                  onClick={() => setMembership('curated')}
                  className={`cursor-pointer p-4 rounded-xl transition-all flex items-start justify-between gap-3 border ${
                    membership === 'curated'
                      ? 'bg-brand/5 border-brand ring-1 ring-brand'
                      : 'bg-[#FAF9F6] border-sand-divider hover:border-brand/40'
                  }`}
                >
                  <div className="flex flex-col gap-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-bold text-ink">
                        Sur demande & validation
                      </span>
                      <span className="font-display text-[10px] uppercase tracking-wider text-brand font-bold bg-brand/10 border border-brand/15 px-1.5 py-0.5 rounded">
                        Conseillé
                      </span>
                    </div>
                    <p className="font-sans text-xs text-ink-muted leading-relaxed">
                      Tu valides chaque nouveau membre avant qu'il n'accède au carnet des sorties privées.
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      membership === 'curated' ? 'bg-brand' : 'bg-sand-muted border hairline-border'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        membership === 'curated' ? 'bg-white' : 'bg-transparent'
                      }`}
                    ></span>
                  </div>
                </label>

                {/* Option 3: Private */}
                <label
                  onClick={() => setMembership('invite')}
                  className={`cursor-pointer p-4 rounded-xl transition-all flex items-start justify-between gap-3 border ${
                    membership === 'invite'
                      ? 'bg-brand/5 border-brand ring-1 ring-brand'
                      : 'bg-[#FAF9F6] border-sand-divider hover:border-brand/40'
                  }`}
                >
                  <div className="flex flex-col gap-1 pr-2">
                    <span className="font-display text-sm font-bold text-ink">
                      Privé sur invitation
                    </span>
                    <p className="font-sans text-xs text-ink-muted leading-relaxed">
                      Invisible dans la recherche, accessible uniquement via code secret ou lien restreint.
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      membership === 'invite' ? 'bg-brand' : 'bg-sand-muted border hairline-border'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        membership === 'invite' ? 'bg-white' : 'bg-transparent'
                      }`}
                    ></span>
                  </div>
                </label>
              </div>
            </div>

            {/* Editorial Co-pilot visual glimpse */}
            <div className="bg-sand-card rounded-2xl p-4 border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">groups</span>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-[10px] uppercase tracking-wider text-brand font-bold">
                  Rituel fondateur
                </span>
                <span className="font-sans text-xs text-ink leading-tight mt-0.5">
                  Un premier parcours de reconnaissance est pré-configuré pour toi.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Persistent Bottom Action Area */}
        <div className="flex flex-col items-center gap-2.5 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-brand hover:bg-brand-dark text-white font-display text-xs uppercase tracking-widest font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.99] transition-all shadow-sm cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
                <span>Création en cours...</span>
              </>
            ) : (
              <>
                <span>Créer le club</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
          <p className="font-sans text-xs text-ink-muted text-center">
            Tu pourras inviter des coéquipiers dès l'étape suivante.
          </p>
        </div>
      </form>

      {/* Interactive Minimal City Bottom-Sheet / Modal */}
      {showCitySheet && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end p-4 animate-in fade-in duration-200">
          <div className="bg-sand-card rounded-2xl p-5 flex flex-col gap-4 max-h-[75vh] max-w-lg mx-auto w-full shadow-2xl border hairline-border">
            <div className="flex items-center justify-between pb-2 border-b hairline-border">
              <span className="font-display text-xs uppercase tracking-wider text-brand font-bold">
                Sélectionner la métropole
              </span>
              <button
                type="button"
                onClick={() => setShowCitySheet(false)}
                className="w-8 h-8 rounded-full bg-sand-muted flex items-center justify-center text-ink cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto pr-1">
              {citiesList.map((c) => {
                const isSelected = selectedCity === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setSelectedCity(c.name);
                      setShowCitySheet(false);
                    }}
                    className={`flex items-center justify-between p-3.5 rounded-xl transition-colors text-left cursor-pointer border ${
                      isSelected
                        ? 'bg-brand/5 border-brand text-brand'
                        : 'bg-[#FAF9F6] border-sand-divider hover:bg-sand-muted text-ink'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-display text-sm font-bold text-ink">{c.title}</span>
                      <span className="font-sans text-xs text-ink-muted">{c.districts}</span>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-brand text-[20px]">
                        check
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
