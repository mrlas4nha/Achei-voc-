export interface Child {
  id: string;
  name: string;
  age: number;
  gender?: 'M' | 'F' | 'Outro';
  allergies?: string;
  medications?: string;
  disability?: string;
  photo?: string;
  responsibleName: string;
  responsiblePhone: string;
  responsibleId?: string;
  status: 'safe' | 'missing' | 'found';
  lastSeenLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  lastSeenTime?: Date;
  description?: string;
  qrCode?: string;
}

export interface SupportPoint {
  id: string;
  name: string;
  type: 'kiosk' | 'medical' | 'police' | 'guard';
  address: string;
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  subRole?: 'guard' | 'authority';
  photo?: string;
  cpf?: string;
  phone?: string;
  registrationId?: string;
}

export type UserRole = 'responsible' | 'citizen' | 'authority' | 'support_point';
