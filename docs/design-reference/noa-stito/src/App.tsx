/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ScreenId, OutingItem, ClubData } from './types';
import { ALL_OUTINGS, INITIAL_OUTING, INITIAL_CLUB } from './mockData';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ScreenSwitcher } from './components/ScreenSwitcher';
import { ContactModal } from './components/ContactModal';

import { HomeScreen } from './screens/HomeScreen';
import { OutingDetailScreen } from './screens/OutingDetailScreen';
import { MyOutingsScreen } from './screens/MyOutingsScreen';
import { ClubsScreen } from './screens/ClubsScreen';
import { OrganiseOutingScreen } from './screens/OrganiseOutingScreen';
import { InvitationsScreen } from './screens/InvitationsScreen';
import { CreateClubScreen } from './screens/CreateClubScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('accueil');
  const [screenHistory, setScreenHistory] = useState<ScreenId[]>([]);
  const [outings, setOutings] = useState<OutingItem[]>(ALL_OUTINGS);
  const [selectedOuting, setSelectedOuting] = useState<OutingItem>(INITIAL_OUTING);
  const [club, setClub] = useState<ClubData>(INITIAL_CLUB);
  const [selectedCity, setSelectedCity] = useState('Casablanca');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Navigation handler with history tracking
  const handleNavigate = (nextScreen: ScreenId) => {
    if (nextScreen === 'contact') {
      setIsContactModalOpen(true);
      return;
    }

    if (nextScreen !== currentScreen) {
      setScreenHistory((prev) => [...prev, currentScreen]);
      setCurrentScreen(nextScreen);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Back handler
  const handleBack = () => {
    if (screenHistory.length > 0) {
      const prev = screenHistory[screenHistory.length - 1];
      setScreenHistory((history) => history.slice(0, -1));
      setCurrentScreen(prev);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setCurrentScreen('accueil');
    }
  };

  // Toggle user registration for an outing
  const handleToggleRegistration = (outingId: string) => {
    setOutings((prev) =>
      prev.map((o) => {
        if (o.id === outingId) {
          const isReg = !o.isRegistered;
          return {
            ...o,
            isRegistered: isReg,
            isPending: false,
            statusText: isReg ? 'Inscrit·e' : 'Disponible',
            spotsBooked: isReg ? o.spotsBooked + 1 : Math.max(0, o.spotsBooked - 1),
          };
        }
        return o;
      })
    );

    if (selectedOuting.id === outingId) {
      setSelectedOuting((prev) => {
        const isReg = !prev.isRegistered;
        return {
          ...prev,
          isRegistered: isReg,
          isPending: false,
          statusText: isReg ? 'Inscrit·e' : 'Disponible',
          spotsBooked: isReg ? prev.spotsBooked + 1 : Math.max(0, prev.spotsBooked - 1),
        };
      });
    }
  };

  // Cancel registration directly
  const handleCancelOuting = (outingId: string) => {
    setOutings((prev) =>
      prev.map((o) => {
        if (o.id === outingId) {
          return {
            ...o,
            isRegistered: false,
            isPending: false,
            statusText: 'Disponible',
            spotsBooked: Math.max(0, o.spotsBooked - 1),
          };
        }
        return o;
      })
    );

    if (selectedOuting.id === outingId) {
      setSelectedOuting((prev) => ({
        ...prev,
        isRegistered: false,
        isPending: false,
        statusText: 'Disponible',
        spotsBooked: Math.max(0, prev.spotsBooked - 1),
      }));
    }
  };

  // Add new outing from organise screen
  const handleAddOuting = (newOuting: OutingItem) => {
    setOutings((prev) => [newOuting, ...prev]);
    setSelectedOuting(newOuting);
  };

  // Add new club
  const handleClubCreated = (newClub: ClubData) => {
    setClub(newClub);
  };

  const registeredCount = outings.filter((o) => o.isRegistered).length;

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-body antialiased selection:bg-secondary-container">
      {/* Top Responsive Header */}
      <Header
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onBack={handleBack}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
        onOpenContact={() => setIsContactModalOpen(true)}
        myOutingsCount={registeredCount}
      />

      {/* Floating Screen Switcher for reviewing all screens */}
      <ScreenSwitcher
        currentScreen={currentScreen}
        onSelectScreen={handleNavigate}
      />

      {/* Main Dynamic View with Responsive Container */}
      <main className="flex-1 w-full bg-surface">
        {currentScreen === 'accueil' && (
          <HomeScreen
            onNavigate={handleNavigate}
            onSelectOuting={(item) => {
              setSelectedOuting(item);
              handleNavigate('outing-detail');
            }}
            outingsCount={registeredCount}
          />
        )}

        {currentScreen === 'outing-detail' && (
          <OutingDetailScreen
            outing={selectedOuting}
            onNavigate={handleNavigate}
            onToggleRegistration={handleToggleRegistration}
          />
        )}

        {currentScreen === 'mes-sorties' && (
          <MyOutingsScreen
            outings={outings}
            onNavigate={handleNavigate}
            onSelectOuting={(item) => {
              setSelectedOuting(item);
              handleNavigate('outing-detail');
            }}
            onCancelOuting={handleCancelOuting}
          />
        )}

        {currentScreen === 'clubs' && (
          <ClubsScreen
            club={club}
            onNavigate={handleNavigate}
            onSelectOuting={(item) => {
              setSelectedOuting(item);
              handleNavigate('outing-detail');
            }}
          />
        )}

        {currentScreen === 'organise-outing' && (
          <OrganiseOutingScreen
            onNavigate={handleNavigate}
            onAddOuting={handleAddOuting}
          />
        )}

        {currentScreen === 'invitations' && (
          <InvitationsScreen onNavigate={handleNavigate} />
        )}

        {currentScreen === 'create-club' && (
          <CreateClubScreen
            onNavigate={handleNavigate}
            onClubCreated={handleClubCreated}
          />
        )}

        {currentScreen === 'profil' && (
          <ProfileScreen
            onNavigate={handleNavigate}
            onOpenContact={() => setIsContactModalOpen(true)}
          />
        )}

        {currentScreen === 'settings' && (
          <SettingsScreen
            onNavigate={handleNavigate}
            onOpenContact={() => setIsContactModalOpen(true)}
          />
        )}

        {currentScreen === 'onboarding' && (
          <OnboardingScreen
            onNavigate={handleNavigate}
            onSelectOuting={(item) => {
              setSelectedOuting(item);
              handleNavigate('outing-detail');
            }}
          />
        )}
      </main>

      {/* Desktop Responsive Footer (Google Stitch Editorial Craft) */}
      <footer className="hidden md:block bg-[#FAF9F6] border-t hairline-border py-6 px-8 mt-12 text-xs text-ink-muted font-sans">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-xs bg-primary flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[13px] font-light">directions_run</span>
            </div>
            <span className="font-display font-bold text-on-surface text-[14px]">GRPD Maroc</span>
            <span className="text-sand-divider">·</span>
            <span className="text-ink-muted">Plateforme éditoriale de marche & course communautaire</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <button
              onClick={() => handleNavigate('accueil')}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Accueil
            </button>
            <button
              onClick={() => handleNavigate('mes-sorties')}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Mes sorties
            </button>
            <button
              onClick={() => handleNavigate('clubs')}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Clubs
            </button>
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">contact_support</span>
              <span>Nous contacter</span>
            </button>
          </div>

          <div className="text-ink-subtle font-display text-[11px]">
            Casablanca · Rabat · Marrakech
          </div>
        </div>
      </footer>

      {/* Interactive Contact Modal with basic validation */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />

      {/* Bottom Tab Bar for Mobile viewports */}
      <BottomNav
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        myOutingsCount={registeredCount}
      />
    </div>
  );
}
