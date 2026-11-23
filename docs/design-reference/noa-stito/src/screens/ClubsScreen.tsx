import React, { useState } from 'react';
import { ScreenId, ClubData, OutingItem } from '../types';
import { IMAGES } from '../mockData';

interface ClubsScreenProps {
  club: ClubData;
  onNavigate: (screen: ScreenId) => void;
  onSelectOuting: (outing: OutingItem) => void;
}

export const ClubsScreen: React.FC<ClubsScreenProps> = ({
  club,
  onNavigate,
  onSelectOuting,
}) => {
  const [isAdminView, setIsAdminView] = useState(true);
  const [affinityGroups, setAffinityGroups] = useState(club.affinityGroups);
  const [showAllMembersModal, setShowAllMembersModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleGroupJoin = (groupId: string) => {
    setAffinityGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          const next = !g.joined;
          showToast(next ? `Groupe "${g.title}" rejoint !` : `Tu as quitté "${g.title}".`);
          return {
            ...g,
            joined: next,
            memberCount: next ? g.memberCount + 1 : g.memberCount - 1,
          };
        }
        return g;
      })
    );
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="flex flex-col w-full pb-28 md:pb-16 pt-16 md:pt-20 px-4 md:px-8 max-w-6xl mx-auto animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-ink text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl border border-sand-divider/40 animate-in fade-in duration-150">
          {toastMessage}
        </div>
      )}

      {/* Club Header: Google Stitch Editorial Card */}
      <section className="flex flex-col bg-sand-card rounded-2xl overflow-hidden border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] mb-6">
        {/* Visual Cover */}
        <div
          className="relative w-full h-52 sm:h-64 bg-cover bg-center"
          style={{ backgroundImage: `url('${club.coverImage || IMAGES.clubCoverAnfa}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-brand/90 via-brand/30 to-black/30"></div>

          {/* Badges top bar */}
          <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between">
            <div className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-display text-[10px] tracking-[0.14em] uppercase text-white font-semibold">
                Actif aujourd'hui
              </span>
            </div>
            <div className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 flex items-center gap-1 text-white/90 shadow-xs">
              <span className="material-symbols-outlined text-[13px]">lock_open</span>
              <span className="font-display text-[10px] tracking-wider uppercase font-semibold">Public</span>
            </div>
          </div>

          {/* Bottom title inside cover */}
          <div className="absolute bottom-3.5 inset-x-4 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-1 text-white/80 text-[11px] font-display uppercase tracking-wider mb-0.5">
                <span className="material-symbols-outlined text-[13px] text-emerald-300">location_on</span>
                <span>{club.city} · Club public ouvert</span>
              </div>
              <h1 className="font-display text-[26px] sm:text-[32px] leading-tight font-bold text-white tracking-[-0.035em]">
                {club.name}
              </h1>
            </div>
            <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[22px]">hiking</span>
            </div>
          </div>
        </div>

        {/* Club Body & Description */}
        <div className="p-5 flex flex-col space-y-4">
          <p className="font-sans text-[14px] sm:text-[15px] leading-relaxed text-ink-muted max-w-4xl">
            {club.description}
          </p>

          {/* Member Status Badge */}
          <div className="bg-[#FAF9F6] rounded-xl p-3.5 border hairline-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[16px]">
                  {isAdminView ? 'shield_person' : 'person'}
                </span>
              </div>
              <div>
                <span className="font-display text-[10px] tracking-[0.14em] uppercase font-bold text-brand block">
                  Ton statut
                </span>
                <span className="font-sans text-[13px] font-semibold text-ink block">
                  {isAdminView ? 'Tu es membre administrateur' : 'Tu es membre ordinaire'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsAdminView(!isAdminView)}
              className="text-xs font-semibold text-brand underline hover:text-brand-dark cursor-pointer font-sans"
            >
              {isAdminView ? 'Vue ordinaire' : 'Vue admin'}
            </button>
          </div>
        </div>
      </section>

      {/* Responsive 2-Column Split Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Prochaines Sorties & Groupes d'affinités (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          {/* Section: Prochaines sorties */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-baseline justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand text-[18px]">event_upcoming</span>
                <h3 className="font-display text-[18px] font-bold text-ink tracking-tight">
                  Prochaines sorties
                </h3>
              </div>
              <span className="font-display text-[12px] font-semibold text-brand">2 prévues</span>
            </div>

            <div className="space-y-3">
              {/* Outing 1 */}
              <article
                onClick={() => onNavigate('outing-detail')}
                className="bg-sand-card rounded-2xl p-4 sm:p-5 border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] space-y-3 cursor-pointer active:scale-[0.99] transition-all group"
              >
                <div className="flex items-start justify-between gap-3 pb-2 border-b hairline-border">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-sand-muted text-ink text-[10px] font-display tracking-wider uppercase font-bold">
                        Public
                      </span>
                      <span className="font-display text-[12px] text-ink-muted font-medium">
                        Sam. 1 juin · 18:30
                      </span>
                    </div>
                    <h4 className="font-display text-[17px] font-bold text-ink tracking-tight group-hover:text-brand transition-colors">
                      Marche & conversation
                    </h4>
                  </div>
                  <span className="material-symbols-outlined text-ink-subtle text-[20px] mt-0.5 group-hover:translate-x-0.5 transition-transform">
                    arrow_forward
                  </span>
                </div>

                {/* Outing meta grid */}
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <div className="flex items-center gap-2 bg-[#FAF9F6] p-2.5 rounded-xl border hairline-border">
                    <span className="material-symbols-outlined text-brand text-[16px]">park</span>
                    <div className="min-w-0">
                      <span className="font-display text-[9px] text-ink-muted uppercase tracking-wider block">
                        Lieu
                      </span>
                      <span className="font-sans text-[13px] font-semibold text-ink truncate block">
                        Anfa Park
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-[#FAF9F6] p-2.5 rounded-xl border hairline-border">
                    <span className="material-symbols-outlined text-ink-muted text-[16px]">
                      group
                    </span>
                    <div className="min-w-0">
                      <span className="font-display text-[9px] text-ink-muted uppercase tracking-wider block">
                        Inscrits
                      </span>
                      <span className="font-sans text-[13px] font-semibold text-ink block">
                        14 participants
                      </span>
                    </div>
                  </div>
                </div>

                {/* Outing footer */}
                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center font-display text-[10px] font-bold ring-2 ring-white">
                      MB
                    </div>
                    <div className="w-6 h-6 rounded-full bg-sand-muted text-ink flex items-center justify-center font-display text-[10px] font-bold ring-2 ring-white">
                      YS
                    </div>
                    <div className="w-6 h-6 rounded-full bg-sand-muted text-ink-muted flex items-center justify-center font-display text-[10px] font-medium ring-2 ring-white">
                      +12
                    </div>
                  </div>
                  <span className="font-display text-[11px] font-bold text-brand flex items-center gap-1">
                    Appuie pour voir le parcours
                    <span className="material-symbols-outlined text-[13px]">chevron_right</span>
                  </span>
                </div>
              </article>

              {/* Outing 2 */}
              <article
                onClick={() => onNavigate('outing-detail')}
                className="bg-sand-card rounded-2xl p-4 sm:p-5 border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] space-y-3 cursor-pointer active:scale-[0.99] transition-all group"
              >
                <div className="flex items-start justify-between gap-3 pb-2 border-b hairline-border">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-brand/10 text-brand text-[10px] font-display tracking-wider uppercase font-bold">
                        Club privé
                      </span>
                      <span className="font-display text-[12px] text-ink-muted font-medium">
                        Dim. 2 juin · 07:15
                      </span>
                    </div>
                    <h4 className="font-display text-[17px] font-bold text-ink tracking-tight group-hover:text-brand transition-colors">
                      Footing matinal & Sunrise Corniche
                    </h4>
                  </div>
                  <span className="material-symbols-outlined text-ink-subtle text-[20px] mt-0.5 group-hover:translate-x-0.5 transition-transform">
                    arrow_forward
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <div className="flex items-center gap-2 bg-[#FAF9F6] p-2.5 rounded-xl border hairline-border">
                    <span className="material-symbols-outlined text-brand text-[16px]">waves</span>
                    <div className="min-w-0">
                      <span className="font-display text-[9px] text-ink-muted uppercase tracking-wider block">
                        Lieu
                      </span>
                      <span className="font-sans text-[13px] font-semibold text-ink truncate block">
                        Corniche Aïn Diab
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-[#FAF9F6] p-2.5 rounded-xl border hairline-border">
                    <span className="material-symbols-outlined text-ink-muted text-[16px]">
                      speed
                    </span>
                    <div className="min-w-0">
                      <span className="font-display text-[9px] text-ink-muted uppercase tracking-wider block">
                        Allure
                      </span>
                      <span className="font-sans text-[13px] font-semibold text-ink block">
                        5:45/km (Doux)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center font-display text-[10px] font-bold ring-2 ring-white">
                      MB
                    </div>
                    <div className="w-6 h-6 rounded-full bg-sand-muted text-ink flex items-center justify-center font-display text-[10px] font-bold ring-2 ring-white">
                      KT
                    </div>
                  </div>
                  <span className="font-display text-[11px] font-bold text-brand flex items-center gap-1">
                    Voir les détails
                    <span className="material-symbols-outlined text-[13px]">chevron_right</span>
                  </span>
                </div>
              </article>
            </div>
          </div>

          {/* Section: Groupes & affinités */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-baseline justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand text-[18px]">forum</span>
                <h3 className="font-display text-[18px] font-bold text-ink tracking-tight">
                  Groupes & affinités
                </h3>
              </div>
              <span className="font-display text-[12px] font-semibold text-brand">
                {affinityGroups.length} sous-groupes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {affinityGroups.map((group) => (
                <div
                  key={group.id}
                  className="bg-sand-card rounded-2xl p-4 border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center border border-brand/15">
                        <span className="material-symbols-outlined text-[18px]">{group.icon}</span>
                      </div>
                      <span className="font-display text-[11px] text-ink-muted font-medium">
                        {group.memberCount} marcheurs
                      </span>
                    </div>
                    <h4 className="font-display text-[15px] font-bold text-ink tracking-tight">
                      {group.title}
                    </h4>
                    <p className="font-sans text-[12px] text-ink-muted leading-relaxed">
                      {group.description}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleGroupJoin(group.id)}
                    className={`w-full py-2 rounded-xl font-display text-[12px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      group.joined
                        ? 'bg-brand/10 text-brand border border-brand/20 hover:bg-brand/15'
                        : 'bg-brand text-white hover:bg-brand-dark'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {group.joined ? 'check' : 'add'}
                    </span>
                    <span>{group.joined ? 'Membre actif' : 'Rejoindre'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Actions & Members (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          {/* Admin Management Action Strip */}
          {isAdminView ? (
            <section className="bg-sand-card p-4 rounded-2xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="material-symbols-outlined text-brand text-[18px]">
                  admin_panel_settings
                </span>
                <span className="font-display text-[10px] tracking-[0.14em] uppercase text-brand font-bold">
                  Mode responsable
                </span>
              </div>

              {/* Primary Action */}
              <button
                onClick={() => onNavigate('organise-outing')}
                className="w-full h-11 bg-brand hover:bg-brand-dark text-white rounded-xl font-display text-xs uppercase tracking-[0.14em] font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition-all shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Organiser une sortie</span>
              </button>

              {/* Secondary Action Row */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  onClick={() => onNavigate('invitations')}
                  className="h-9 bg-[#FAF9F6] hover:bg-sand-muted border hairline-border text-ink rounded-xl px-3 font-display text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px] text-brand">person_add</span>
                  <span>Inviter</span>
                </button>
                <button
                  onClick={() => onNavigate('invitations')}
                  className="relative h-9 bg-[#FAF9F6] hover:bg-sand-muted border hairline-border text-ink rounded-xl px-3 font-display text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px] text-brand">how_to_reg</span>
                  <span className="truncate">Demandes (2)</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand ml-0.5"></span>
                </button>
              </div>
            </section>
          ) : (
            <section className="bg-sand-card p-4 rounded-2xl border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] space-y-2.5">
              <span className="font-display text-[10px] tracking-[0.14em] uppercase text-ink-muted font-bold block">
                Espace adhérent
              </span>
              <p className="font-sans text-xs text-ink-muted">
                Tu es membre de ce club. Tu peux inviter des coéquipiers ou participer aux sorties réservées.
              </p>
              <button
                onClick={() => onNavigate('invitations')}
                className="w-full h-10 rounded-xl bg-brand/10 text-brand font-display text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                <span>Inviter un proche</span>
              </button>
            </section>
          )}

          {/* Member Roster: Space Grotesk + Manrope Editorial List */}
          <section className="flex flex-col space-y-3">
            <div className="flex items-baseline justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand text-[18px]">group</span>
                <h3 className="font-display text-[18px] font-bold text-ink tracking-tight">Membres</h3>
              </div>
              <span className="font-display text-[12px] font-semibold text-brand">48 membres</span>
            </div>

            <div className="bg-sand-card rounded-2xl border hairline-border p-4 shadow-[0_2px_8px_rgba(17,19,17,0.02)] space-y-3">
              {/* Member 1: Founder */}
              <div className="flex items-center justify-between py-1.5 border-b hairline-border pb-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center font-display text-[12px] font-bold">
                    MB
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans text-[14px] font-bold text-ink">
                        Mehdi Benjelloun
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-sand-muted text-ink font-display text-[9px] font-bold tracking-wider uppercase">
                        Fondateur
                      </span>
                    </div>
                    <span className="font-sans text-[12px] text-ink-muted block">
                      Actif il y a 2h · 128 km avec le club
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-brand text-[18px]">military_tech</span>
              </div>

              {/* Member 2 */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-sand-muted text-ink flex items-center justify-center font-display text-[12px] font-semibold border hairline-border">
                    YS
                  </div>
                  <div>
                    <span className="font-sans text-[14px] font-semibold text-ink block">
                      Yasmine S.
                    </span>
                    <span className="font-sans text-[12px] text-ink-muted">Membre depuis mars · 42 km</span>
                  </div>
                </div>
                <span className="font-display text-[10px] uppercase tracking-wider text-ink-muted font-semibold">
                  Marcheuse
                </span>
              </div>

              {/* Member 3 */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-sand-muted text-ink flex items-center justify-center font-display text-[12px] font-semibold border hairline-border">
                    KT
                  </div>
                  <div>
                    <span className="font-sans text-[14px] font-semibold text-ink block">
                      Karim T.
                    </span>
                    <span className="font-sans text-[12px] text-ink-muted">Membre depuis avril · 19 km</span>
                  </div>
                </div>
                <span className="font-display text-[10px] uppercase tracking-wider text-ink-muted font-semibold">
                  Explorateur
                </span>
              </div>

              {/* Member 4 */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-sand-muted text-ink flex items-center justify-center font-display text-[12px] font-semibold border hairline-border">
                    LM
                  </div>
                  <div>
                    <span className="font-sans text-[14px] font-semibold text-ink block">
                      Leila M.
                    </span>
                    <span className="font-sans text-[12px] text-ink-muted">Membre depuis mai · 6 sorties</span>
                  </div>
                </div>
                <span className="font-display text-[10px] uppercase tracking-wider text-ink-muted font-semibold">
                  Marcheuse
                </span>
              </div>

              {/* Expand Button */}
              <button
                onClick={() => setShowAllMembersModal(true)}
                className="w-full py-2.5 mt-1 rounded-xl bg-[#FAF9F6] hover:bg-sand-muted text-ink border hairline-border font-display text-[12px] font-semibold text-center transition-colors cursor-pointer"
              >
                Voir tous les 48 membres
              </button>
            </div>
          </section>

          {/* Quick Create Club shortcut */}
          <section className="bg-sand-card rounded-2xl p-4 border hairline-border shadow-[0_2px_8px_rgba(17,19,17,0.02)] flex items-center justify-between">
            <div className="min-w-0 pr-3">
              <span className="font-display text-[10px] uppercase tracking-[0.14em] text-ink-muted font-bold block">
                Envie d'un nouveau groupe ?
              </span>
              <span className="font-sans text-xs text-ink-muted">
                Crée un club pour ton quartier ou tes amis.
              </span>
            </div>
            <button
              onClick={() => onNavigate('create-club')}
              className="px-3.5 py-1.5 rounded-lg bg-brand text-white font-display text-xs font-bold uppercase tracking-wider shrink-0 cursor-pointer hover:bg-brand-dark transition-colors"
            >
              Créer
            </button>
          </section>
        </div>
      </div>

      {/* Full Members Modal */}
      {showAllMembersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-sand-card rounded-2xl p-6 max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl space-y-4 border hairline-border">
            <div className="flex items-center justify-between pb-3 border-b hairline-border">
              <h3 className="font-display font-bold text-ink text-lg">
                Membres du club ({club.memberCount})
              </h3>
              <button
                onClick={() => setShowAllMembersModal(false)}
                className="text-ink-muted hover:text-ink w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {club.members
                .concat([
                  { id: 'm-5', name: 'Omar Bennani', role: 'Coureur', initials: 'OB', distanceStr: '35 km', activeTimeStr: 'Actif hier' },
                  { id: 'm-6', name: 'Nadia Alaoui', role: 'Marcheuse', initials: 'NA', distanceStr: '28 km', activeTimeStr: 'Actif il y a 3j' },
                  { id: 'm-7', name: 'Hicham Kabbaj', role: 'Guide adjoint', initials: 'HK', distanceStr: '95 km', activeTimeStr: 'Actif il y a 5h' },
                  { id: 'm-8', name: 'Zineb Tazi', role: 'Marcheuse', initials: 'ZT', distanceStr: '14 km', activeTimeStr: 'Membre récent' },
                ])
                .map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-xs py-1.5 border-b hairline-border last:border-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-sand-muted text-ink flex items-center justify-center font-display font-bold border hairline-border">
                        {m.initials}
                      </div>
                      <div>
                        <span className="font-bold text-ink block font-sans">{m.name}</span>
                        <span className="text-ink-muted text-[11px] font-sans">{m.distanceStr}</span>
                      </div>
                    </div>
                    <span className="text-ink-muted text-[11px] font-medium font-sans">{m.role}</span>
                  </div>
                ))}
            </div>
            <button
              onClick={() => setShowAllMembersModal(false)}
              className="w-full h-11 rounded-xl bg-brand hover:bg-brand-dark text-white font-display text-xs font-semibold cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
