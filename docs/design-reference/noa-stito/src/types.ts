export type ScreenId = 
  | 'accueil' 
  | 'mes-sorties' 
  | 'clubs' 
  | 'outing-detail' 
  | 'organise-outing' 
  | 'invitations' 
  | 'create-club' 
  | 'profil'
  | 'settings'
  | 'onboarding'
  | 'contact';

export interface ContactFormData {
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export type ActivityFormat = 'Marche' | 'Course' | 'M. dynamique';

export interface OutingItem {
  id: string;
  title: string;
  clubName: string;
  clubId?: string;
  discipline: ActivityFormat;
  subType?: string;
  dateStr: string;
  timeStr: string;
  departureTime: string;
  meetingTime: string;
  location: string;
  city: string;
  meetingPointDetails?: string;
  distanceKm: number;
  paceStr: string;
  intensityStr: string;
  description: string;
  scheduleDetails: string;
  heroImage: string;
  mapImage: string;
  isRegistered: boolean;
  isPending?: boolean;
  statusText: string;
  spotsTotal: number;
  spotsBooked: number;
  isPublic: boolean;
  host: {
    name: string;
    role: string;
    avatar: string;
    verified: boolean;
  };
  timeline?: {
    time: string;
    title: string;
    description: string;
  }[];
}

export interface ClubMember {
  id: string;
  name: string;
  role: string;
  tag?: string;
  avatar?: string;
  initials: string;
  distanceStr: string;
  activeTimeStr: string;
}

export interface ClubAffinityGroup {
  id: string;
  title: string;
  description: string;
  icon: string;
  memberCount: number;
  joined: boolean;
  bgColorClass: string;
}

export interface ClubData {
  id: string;
  name: string;
  city: string;
  coverImage: string;
  description: string;
  memberCount: number;
  activeStatus: string;
  visibility: 'public' | 'request' | 'private';
  isAdmin: boolean;
  inviteCode: string;
  host: {
    name: string;
    role: string;
    avatar: string;
    stats: string;
  };
  affinityGroups: ClubAffinityGroup[];
  members: ClubMember[];
}
