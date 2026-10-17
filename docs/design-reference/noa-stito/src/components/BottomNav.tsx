import React from 'react';
import { ScreenId } from '../types';

interface BottomNavProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  myOutingsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  myOutingsCount = 2,
}) => {
  const isTabScreen = ['accueil', 'mes-sorties', 'clubs', 'profil'].includes(currentScreen);

  if (!isTabScreen) {
    return null;
  }

  const navItems: {
    id: ScreenId;
    label: string;
    icon: string;
    badge?: number;
  }[] = [
    { id: 'accueil', label: 'Accueil', icon: 'directions_run' },
    { id: 'mes-sorties', label: 'Mes sorties', icon: 'calendar_today', badge: myOutingsCount },
    { id: 'clubs', label: 'Clubs', icon: 'groups' },
    { id: 'profil', label: 'Profil', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#F7F6F2]/90 backdrop-blur-xl border-t hairline-border md:hidden">
      <div className="max-w-md mx-auto h-14 px-6 flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`nav-item flex flex-col items-center gap-0.5 focus:outline-none touch-interactive cursor-pointer ${
                isActive ? 'text-brand' : 'text-ink-subtle hover:text-ink'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative flex items-center justify-center">
                <span className="material-symbols-outlined text-[21px]">
                  {item.icon}
                </span>
                {item.badge && item.badge > 0 && item.id === 'mes-sorties' && (
                  <span className="absolute -top-1 -right-2.5 w-3.5 h-3.5 rounded-full bg-brand text-white text-[9px] font-display font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`font-sans text-[10px] tracking-tight ${
                  isActive ? 'font-semibold text-brand' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
