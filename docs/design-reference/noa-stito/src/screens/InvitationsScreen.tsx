import React, { useState } from 'react';
import { ScreenId } from '../types';
import { IMAGES } from '../mockData';

interface InvitationsScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const InvitationsScreen: React.FC<InvitationsScreenProps> = ({ onNavigate }) => {
  const [modStatus, setModStatus] = useState<'idle' | 'approved' | 'refused'>('idle');
  const [isCancelled, setIsCancelled] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleApprove = () => {
    setModStatus('approved');
    showToast('Sarah a rejoint le collectif.');
  };

  const handleRefuse = () => {
    setModStatus('refused');
    showToast('Demande déclinée discrètement.');
  };

  const handleCancelRequest = () => {
    if (window.confirm('Souhaites-tu vraiment retirer ta demande pour Les pas de Casa ?')) {
      setIsCancelled(true);
      showToast("Demande d'adhésion retirée.");
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
        </div>
      )}

      {/* Code Détecté Eyebrow & Live Verification Status */}
      <div className="flex items-center justify-between py-2 mb-4 bg-sand-card p-3 rounded-xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
          <span className="font-display text-[10px] uppercase tracking-widest text-ink font-bold">
            Invitation Privée
          </span>
        </div>
        <span className="font-display text-xs text-brand font-bold bg-brand/10 border border-brand/15 px-2.5 py-0.5 rounded-md">
          CODE · CASA-PAS-2024
        </span>
      </div>

      {/* 2-Column Responsive Layout on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN: Club Storytelling & Statut */}
        <div className="space-y-6">
          {/* Club Identity & Visual Storytelling */}
          <div className="relative w-full rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(17,19,17,0.02)] bg-sand-card border hairline-border">
            <div
              className="relative w-full h-56 sm:h-64 bg-cover bg-center"
              style={{ backgroundImage: `url('${IMAGES.cornicheWalkersGoldenHour}')` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-brand/90 via-brand/30 to-transparent"></div>
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <span className="font-display text-[10px] uppercase tracking-widest text-white/80 block mb-1 font-bold">
                  Collectif de marche active
                </span>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                  Les pas de Casa
                </h1>
              </div>
            </div>

            {/* Club Telemetry Strip */}
            <div className="px-4 py-3 bg-[#FAF9F6] border-y hairline-border flex flex-wrap items-center gap-y-1 gap-x-2 text-ink-muted text-xs">
              <div className="flex items-center gap-1 font-sans">
                <span className="material-symbols-outlined text-[16px] text-brand">location_on</span>
                <span className="font-semibold text-ink">Casablanca</span>
              </div>
              <span className="opacity-40">/</span>
              <div className="flex items-center gap-1 font-sans">
                <span className="material-symbols-outlined text-[16px] text-brand">groups</span>
                <span className="font-medium">48 membres actifs</span>
              </div>
              <span className="opacity-40">/</span>
              <span className="font-sans truncate">Fondé par Mehdi B.</span>
            </div>

            {/* Manifeste / Quote Section */}
            <div className="p-4 bg-sand-card">
              <p className="font-sans text-sm text-ink-muted italic leading-relaxed">
                « Marche, découverte urbaine et conversation libre dans les parcs de Casablanca. Ouvert à toutes et tous pour respirer et bouger ensemble. »
              </p>
            </div>
          </div>

          {/* Section: Statut de la Demande */}
          <div className="bg-sand-card p-5 rounded-2xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b hairline-border">
              <h2 className="font-display text-[10px] uppercase tracking-widest text-ink-muted font-bold">
                Statut de la demande
              </h2>
              <span className="font-display text-xs text-brand font-bold">Étape 01/02</span>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/15 text-brand flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="font-display text-base font-bold text-ink">
                  {isCancelled ? "Demande retirée" : "En attente de validation"}
                </h3>
                <p className="font-sans text-xs text-ink-muted mt-1 leading-relaxed">
                  {isCancelled
                    ? "Tu as retiré ta demande d'adhésion pour ce club. Tu peux en formuler une nouvelle à tout moment."
                    : "Ce club valide manuellement les nouvelles demandes pour préserver la convivialité du groupe. Mehdi prend généralement moins de 24h. Tu recevras une notification dès confirmation."}
                </p>
              </div>
            </div>

            {/* Live Pipeline Tracker Indicator */}
            <div className="w-full bg-sand-muted h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCancelled ? 'w-0 bg-ink-muted' : 'w-2/3 bg-brand'
                }`}
              ></div>
            </div>

            {/* Action: Explorer en attendant */}
            <button
              type="button"
              onClick={() => onNavigate('accueil')}
              className="w-full h-11 px-4 rounded-xl bg-[#FAF9F6] hover:bg-sand-muted border hairline-border transition-colors flex items-center justify-between text-ink cursor-pointer"
            >
              <span className="font-display text-xs font-bold uppercase tracking-wider">
                Explorer les sorties publiques en attendant
              </span>
              <span className="material-symbols-outlined text-[18px] text-brand">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Admin Inset, Club Values & Cancellation */}
        <div className="space-y-6">
          {/* Section: Aperçu côté Organisateur (Admin Inset) */}
          <div className="bg-sand-card p-5 rounded-2xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b hairline-border">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-brand text-[16px]">visibility</span>
                <h2 className="font-display text-[10px] uppercase tracking-widest text-ink-muted font-bold">
                  Aperçu côté organisateur
                </h2>
              </div>
              <span className="font-display text-[10px] text-brand bg-brand/10 border border-brand/15 px-2 py-0.5 rounded font-bold uppercase">
                Écran de Mehdi
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={IMAGES.sarahMansouriPortrait}
                  alt="Portrait de Sarah Mansouri"
                  className="w-10 h-10 rounded-full object-cover border hairline-border ring-2 ring-white"
                />
                <div className="flex flex-col min-w-0">
                  <span className="font-display text-sm font-bold text-ink leading-tight">
                    Sarah Mansouri
                  </span>
                  <span className="font-sans text-xs text-ink-muted">
                    Casablanca · 3 sorties GRPD
                  </span>
                </div>
              </div>
              <span className="font-display text-[10px] text-ink-muted font-semibold">
                Il y a 10 min
              </span>
            </div>

            {/* Message du candidat */}
            <div className="p-3.5 bg-[#FAF9F6] rounded-xl text-ink font-sans text-xs leading-relaxed border hairline-border italic">
              « Bonjour ! J'habite près d'Anfa Park et j'aimerais vous rejoindre pour les marches du samedi matin. »
            </div>

            {/* Interactive Moderation Controls */}
            {modStatus === 'idle' ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRefuse}
                  className="h-10 rounded-xl bg-[#FAF9F6] hover:bg-sand-muted border hairline-border text-ink-muted hover:text-red-600 transition-colors flex items-center justify-center font-display text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Refuser
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="h-10 rounded-xl bg-brand hover:bg-brand-dark text-white transition-all flex items-center justify-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Approuver</span>
                </button>
              </div>
            ) : modStatus === 'approved' ? (
              <div className="p-3 text-center rounded-xl bg-brand/10 border border-brand/20 text-brand font-display text-xs font-bold uppercase tracking-wider animate-in fade-in duration-200">
                Sarah a rejoint le collectif avec succès !
              </div>
            ) : (
              <div className="p-3 text-center rounded-xl bg-sand-muted border hairline-border text-ink-muted font-display text-xs font-semibold animate-in fade-in duration-200">
                Demande déclinée discrètement.
              </div>
            )}
          </div>

          {/* Club Values & Protocol Details */}
          <div className="bg-sand-card p-5 rounded-2xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] space-y-3">
            <span className="font-display text-[10px] uppercase tracking-widest text-ink-muted font-bold block pb-1 border-b hairline-border">
              Engagement du groupe
            </span>

            <div className="flex items-start gap-2.5 py-1">
              <span className="material-symbols-outlined text-brand text-[18px] shrink-0 mt-0.5">
                verified
              </span>
              <p className="font-sans text-xs text-ink-muted leading-relaxed">
                Rythme adapté (5 à 6 km/h), pauses incluses et bienveillance systématique envers les nouveaux arrivants.
              </p>
            </div>

            <div className="flex items-start gap-2.5 py-1">
              <span className="material-symbols-outlined text-brand text-[18px] shrink-0 mt-0.5">
                forum
              </span>
              <p className="font-sans text-xs text-ink-muted leading-relaxed">
                Accès direct au canal de discussion privé du club dès que ta participation est validée.
              </p>
            </div>
          </div>

          {/* Cancellation Action */}
          <div className="flex flex-col items-center justify-center pt-2">
            {!isCancelled ? (
              <button
                type="button"
                onClick={handleCancelRequest}
                className="font-display text-xs text-ink-muted hover:text-red-600 transition-colors underline underline-offset-4 py-1 cursor-pointer font-bold uppercase tracking-wider"
              >
                Annuler ma demande d'adhésion
              </button>
            ) : (
              <span className="font-display text-xs text-ink-muted uppercase font-bold tracking-wider">
                Demande annulée
              </span>
            )}
            <span className="font-sans text-[11px] text-ink-muted opacity-80 text-center mt-1">
              Tu pourras redemander à tout moment avec un nouveau code.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
