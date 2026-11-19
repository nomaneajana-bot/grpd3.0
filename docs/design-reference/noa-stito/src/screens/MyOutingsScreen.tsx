import React, { useState } from 'react';
import { ScreenId, OutingItem } from '../types';

interface MyOutingsScreenProps {
  outings: OutingItem[];
  onNavigate: (screen: ScreenId) => void;
  onSelectOuting: (outing: OutingItem) => void;
  onCancelOuting: (outingId: string) => void;
}

export const MyOutingsScreen: React.FC<MyOutingsScreenProps> = ({
  outings,
  onNavigate,
  onSelectOuting,
  onCancelOuting,
}) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'pending' | 'past'>('upcoming');
  const [selectedForCancel, setSelectedForCancel] = useState<OutingItem | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const confirmedOutings = outings.filter((o) => o.isRegistered && !o.isPending);
  const pendingOutings = outings.filter((o) => o.isPending);

  const pastOutings = [
    {
      id: 'past-1',
      title: 'Foulée du Printemps Corniche',
      clubName: 'Casa Runners Club',
      date: 'Dim. 12 mai · 07:00',
      location: 'Aïn Diab',
      dist: '10,2 km',
      pace: '5:32/km',
    },
    {
      id: 'past-2',
      title: 'Marche culturelle Habous & Dégustation',
      clubName: 'Les pas de Casa',
      date: 'Sam. 4 mai · 10:30',
      location: 'Quartier Habous',
      dist: '5,1 km',
      pace: '3,8 km/h',
    },
    {
      id: 'past-3',
      title: 'Circuit Vert Oasis',
      clubName: 'Oasis Athletic Club',
      date: 'Sam. 27 avril · 08:30',
      location: 'Parc Oasis',
      dist: '6,4 km',
      pace: '4,5 km/h',
    },
  ];

  const handleOpenCancelSheet = (outing: OutingItem) => {
    setSelectedForCancel(outing);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    if (selectedForCancel) {
      onCancelOuting(selectedForCancel.id);
      setShowCancelModal(false);
      setToastMessage(`Participation à "${selectedForCancel.title}" annulée.`);
      setTimeout(() => setToastMessage(null), 3000);
      setSelectedForCancel(null);
    }
  };

  return (
    <div className="flex flex-col w-full pb-28 md:pb-16 pt-16 md:pt-20 px-4 md:px-8 max-w-6xl mx-auto animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-ink text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl border border-sand-divider/40 animate-in fade-in duration-150">
          {toastMessage}
        </div>
      )}

      {/* Top Header & Refined Segmented Control */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-sand-divider mb-6">
        <div>
          <span className="font-display text-[10px] uppercase tracking-[0.16em] text-ink-muted font-semibold">
            Planning personnel
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface mt-0.5 tracking-tight">
            Mes Sorties
          </h1>
        </div>

        {/* Refined Segmented Control from Google Stitch */}
        <div
          className="w-full md:w-auto bg-[#EFEFEB] p-1 rounded-xl flex items-center border hairline-border"
          role="tablist"
        >
          <button
            onClick={() => setActiveTab('upcoming')}
            aria-selected={activeTab === 'upcoming'}
            className={`flex-1 md:flex-none py-1.5 px-3.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] text-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface font-medium'
            }`}
            role="tab"
            type="button"
          >
            <span className="font-display text-[12px] tracking-tight">À venir</span>
            <span
              className={`font-display text-[10px] font-bold px-1.5 py-0.2 rounded ${
                activeTab === 'upcoming' ? 'bg-primary text-white' : 'bg-black/5 text-on-surface-variant'
              }`}
            >
              {confirmedOutings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            aria-selected={activeTab === 'pending'}
            className={`flex-1 md:flex-none py-1.5 px-3.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] text-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface font-medium'
            }`}
            role="tab"
            type="button"
          >
            <span className="font-display text-[12px] tracking-tight">En attente</span>
            <span
              className={`font-display text-[10px] font-medium px-1 rounded ${
                activeTab === 'pending' ? 'bg-primary text-white' : 'bg-black/5 text-on-surface-variant/80'
              }`}
            >
              {pendingOutings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('past')}
            aria-selected={activeTab === 'past'}
            className={`flex-1 md:flex-none py-1.5 px-3.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'past'
                ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] text-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface font-medium'
            }`}
            role="tab"
            type="button"
          >
            <span className="font-display text-[12px] tracking-tight">Passées</span>
            <span className="font-display text-[10px] text-on-surface-variant/80 font-medium px-1 rounded bg-black/5">
              12
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-7">
        {/* Section 1: Upcoming Confirmed Outings */}
        {activeTab === 'upcoming' && (
          <section className="space-y-3.5">
            <div className="flex items-baseline justify-between px-0.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-700"></span>
                <h2 className="font-display text-[17px] font-bold text-on-surface tracking-tight">
                  Sorties confirmées
                </h2>
              </div>
              <span className="font-display text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                {confirmedOutings.length} réservations
              </span>
            </div>

            {confirmedOutings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {confirmedOutings.map((outing) => (
                  <article
                    key={outing.id}
                    className="bg-white rounded-xl border hairline-border shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden transition-all flex flex-col justify-between"
                  >
                    <div className="p-4 space-y-3.5">
                      {/* Meta & Status */}
                      <div className="flex items-start justify-between gap-2 border-b hairline-border pb-3">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 text-[11px] font-display text-on-surface-variant tracking-wide uppercase">
                            <span className="font-bold text-primary">{outing.clubName}</span>
                            <span className="text-neutral-300">/</span>
                            <span className="text-neutral-500 font-medium">
                              {outing.subType || outing.discipline}
                            </span>
                          </div>
                          <h3 className="font-display text-[17px] font-bold text-on-surface tracking-tight mt-0.5 truncate">
                            {outing.title}
                          </h3>
                        </div>
                        {/* Bespoke Dot Status Badge */}
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-emerald-200/80 bg-emerald-50/70 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-700"></span>
                          <span className="font-display text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                            Inscrit·e
                          </span>
                        </div>
                      </div>

                      {/* Schedule & Location Details */}
                      <div className="grid grid-cols-2 gap-2 text-left">
                        <div className="bg-[#FAF9F6] border hairline-border rounded-lg p-2.5 flex flex-col justify-between">
                          <span className="font-display text-[9.5px] uppercase tracking-wider text-on-surface-variant font-medium">
                            Date & Heure
                          </span>
                          <div className="font-display text-[13px] font-bold text-on-surface mt-1 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[15px] text-neutral-500 font-light">
                              calendar_today
                            </span>
                            <span>{outing.dateStr.split(' ')[0]} {outing.dateStr.split(' ')[1]} · {outing.departureTime}</span>
                          </div>
                        </div>

                        <div className="bg-[#FAF9F6] border hairline-border rounded-lg p-2.5 flex flex-col justify-between">
                          <span className="font-display text-[9.5px] uppercase tracking-wider text-on-surface-variant font-medium">
                            Rendez-vous
                          </span>
                          <div className="font-display text-[13px] font-bold text-on-surface mt-1 flex items-center gap-1.5 truncate">
                            <span className="material-symbols-outlined text-[15px] text-neutral-500 font-light">
                              location_on
                            </span>
                            <span className="truncate">{outing.location}, Casa</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          className="font-display text-[11px] font-semibold text-neutral-500 hover:text-error transition-colors inline-flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleOpenCancelSheet(outing)}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                          Se désister
                        </button>
                        <button
                          onClick={() => {
                            onSelectOuting(outing);
                            onNavigate('outing-detail');
                          }}
                          className="h-8 px-3.5 rounded-lg border hairline-border bg-white hover:bg-neutral-50 text-on-surface font-display text-[12px] font-bold tracking-tight transition-all inline-flex items-center gap-1 shadow-xs cursor-pointer"
                          type="button"
                        >
                          <span>Détails</span>
                          <span className="material-symbols-outlined text-[14px] text-neutral-500">
                            arrow_forward
                          </span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              /* Compact Editorial Empty State */
              <div className="border hairline-border bg-white rounded-xl p-8 flex flex-col items-center text-center space-y-3 max-w-md mx-auto">
                <div className="w-10 h-10 rounded-lg bg-[#FAF9F6] border hairline-border flex items-center justify-center">
                  <span className="material-symbols-outlined text-neutral-700 text-[20px]">hiking</span>
                </div>
                <div className="flex flex-col space-y-1 max-w-[280px]">
                  <h4 className="font-display text-[15px] font-bold text-on-surface">
                    Aucune sortie prévue pour le moment
                  </h4>
                  <p className="font-body text-[12px] text-neutral-500 leading-normal">
                    Trouve un groupe chaleureux pour marcher ou courir ensemble ce week-end.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('accueil')}
                  className="h-9 px-4 rounded-lg bg-primary text-white font-display text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition-all mt-1 hover:bg-[#00381e] cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[15px]">explore</span>
                  <span>Explorer les sorties</span>
                </button>
              </div>
            )}
          </section>
        )}

        {/* Section 2: Pending Requests */}
        {(activeTab === 'pending' || (activeTab === 'upcoming' && pendingOutings.length > 0)) && (
          <section className="space-y-3 pt-1">
            <div className="flex items-baseline justify-between px-0.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                <h2 className="font-display text-[17px] font-bold text-on-surface tracking-tight">
                  Demandes en attente
                </h2>
              </div>
              <span className="font-display text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                {pendingOutings.length} requête
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingOutings.map((outing) => (
                <article
                  key={outing.id}
                  className="bg-white rounded-xl border hairline-border shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden"
                >
                  <div className="p-4 space-y-3.5">
                    <div className="flex items-start justify-between gap-2 border-b hairline-border pb-3">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 text-[11px] font-display text-on-surface-variant tracking-wide uppercase">
                          <span className="font-bold text-neutral-700">{outing.clubName}</span>
                          <span className="text-neutral-300">/</span>
                          <span className="text-neutral-500 font-medium">
                            {outing.subType || 'Trail doux'}
                          </span>
                        </div>
                        <h3 className="font-display text-[17px] font-bold text-on-surface tracking-tight mt-0.5 truncate">
                          {outing.title}
                        </h3>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-amber-200 bg-amber-50/70 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                        <span className="font-display text-[10px] font-bold uppercase tracking-wider text-amber-900">
                          En attente
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#FAF9F6] border hairline-border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="font-display font-bold text-on-surface flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px] text-neutral-500 font-light">
                            calendar_month
                          </span>
                          <span>Sam. 8 juin · 09:00</span>
                        </div>
                        <span className="font-body text-[11px] text-on-surface-variant">
                          {outing.location}
                        </span>
                      </div>
                      <p className="font-body text-[12px] text-neutral-600 leading-relaxed border-t hairline-border pt-2 flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-neutral-400 mt-0.5 shrink-0">
                          info
                        </span>
                        <span>
                          L'organisateur valide les participants avant le départ afin de calibrer le groupe.
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center justify-end pt-0.5">
                      <button
                        onClick={() => handleOpenCancelSheet(outing)}
                        className="font-display text-[11px] font-semibold text-neutral-500 hover:text-error transition-colors uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer"
                        type="button"
                      >
                        Annuler ma demande
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Section 3: Past Outings */}
        {activeTab === 'past' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-bold text-on-surface">Sorties passées (12)</h2>
              <span className="font-display text-[11px] text-outline font-semibold">Total 74 km</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pastOutings.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border hairline-border p-4 shadow-xs space-y-2"
                >
                  <span className="font-display text-[11px] text-primary uppercase font-bold">
                    {p.clubName}
                  </span>
                  <h4 className="font-display text-base font-bold text-on-surface">{p.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-outline">
                    <span>{p.date}</span>
                    <span>•</span>
                    <span>{p.location}</span>
                  </div>
                  <div className="pt-2 border-t hairline-border flex items-center justify-between">
                    <span className="text-xs text-outline">{p.pace}</span>
                    <span className="font-display text-lg font-bold text-on-surface">{p.dist}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 4: Bottom Sheet Preview (Ultra-refined Agency Style) */}
        <section className="pt-2 max-w-xl mx-auto" id="cancel-sheet-preview">
          <div className="w-full bg-[#EFEFEB]/80 border hairline-border p-3.5 rounded-2xl flex flex-col space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-600">
                Aperçu · Fiche d'annulation native
              </span>
              <span className="material-symbols-outlined text-neutral-500 text-[15px]">touch_app</span>
            </div>

            {/* Inset Minimal Architectural Sheet */}
            <div className="w-full bg-white rounded-xl border hairline-border shadow-[0_12px_32px_rgba(0,0,0,0.06)] p-5 flex flex-col space-y-4">
              <div className="w-8 h-1 rounded-full bg-neutral-200 mx-auto"></div>
              <div className="flex items-start gap-3 pt-1">
                <div className="w-9 h-9 rounded-lg bg-neutral-100 border hairline-border flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-neutral-700 text-[18px]">event_busy</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <h4 className="font-display text-[17px] font-bold text-on-surface leading-tight">
                    Annuler ma participation ?
                  </h4>
                  <span className="font-display text-[12px] font-medium text-emerald-950 mt-0.5 truncate">
                    Marche & conversation (Sam. 1 juin)
                  </span>
                </div>
              </div>

              <div className="bg-[#FAF9F6] border hairline-border rounded-lg p-3 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-neutral-500 text-[16px] shrink-0 mt-0.5">
                  group
                </span>
                <p className="font-body text-[12px] text-neutral-600 leading-normal">
                  Tu annules uniquement ta participation personnelle. La sortie reste maintenue pour les autres participants de la communauté.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  onClick={() => {
                    if (confirmedOutings.length > 0) {
                      handleOpenCancelSheet(confirmedOutings[0]);
                    }
                  }}
                  className="flex-1 h-11 rounded-lg bg-[#FAF0F0] border border-red-200 text-red-900 font-display text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-transform active:scale-[0.99] hover:bg-red-100 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[15px]">delete</span>
                  Confirmer l'annulation
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 h-10 rounded-lg bg-white border hairline-border text-on-surface font-display text-[12px] font-semibold tracking-tight flex items-center justify-center transition-colors hover:bg-neutral-50 cursor-pointer"
                  type="button"
                >
                  Garder ma place
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Floating Active Cancellation Modal */}
      {showCancelModal && selectedForCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border hairline-border space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-8 h-1 rounded-full bg-neutral-200 mx-auto"></div>
            <div className="flex items-start gap-3 pt-1">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 border hairline-border flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-neutral-700 text-[20px]">event_busy</span>
              </div>
              <div className="flex flex-col min-w-0">
                <h4 className="font-display text-[18px] font-bold text-on-surface leading-tight">
                  Annuler ma participation ?
                </h4>
                <span className="font-display text-[13px] font-semibold text-primary mt-0.5 truncate">
                  {selectedForCancel.title}
                </span>
              </div>
            </div>

            <div className="bg-[#FAF9F6] border hairline-border rounded-lg p-3.5">
              <p className="font-body text-[12px] text-neutral-600 leading-relaxed">
                Tu annules uniquement ta participation personnelle. La sortie reste maintenue pour les autres membres de la communauté.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={handleConfirmCancel}
                className="flex-1 h-11 rounded-lg bg-[#FAF0F0] border border-red-200 text-red-900 font-display text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer hover:bg-red-100"
              >
                <span className="material-symbols-outlined text-[15px]">delete</span>
                Confirmer l'annulation
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 h-11 rounded-lg bg-white border hairline-border text-on-surface font-display text-[12px] font-semibold flex items-center justify-center cursor-pointer hover:bg-neutral-50"
              >
                Garder ma place
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
