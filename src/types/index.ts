export type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  is_staff?: boolean;
}

export interface Hall {
  id: number;
  name: string;
  capacity: number;
  location: string;
  is_active: boolean;
}

export interface Equipment {
  id: number;
  name: string;
  total_quantity: number;
  available_quantity?: number;
  description: string;
}

export type EventStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface EquipmentAllocation {
  id: number;
  equipment: number;
  equipment_name?: string;
  total_quantity?: number;
  quantity: number;
}

export interface Registration {
  id: number;
  user: number;
  user_details?: User;
  event: number;
  registered_at: string;
}

export interface CampusEvent {
  id: number;
  title: string;
  description: string;
  organizer: number;
  organizer_name: string;
  organizer_details?: User;
  hall: number;
  hall_details: Hall;
  start: string;
  end: string;
  status: EventStatus;
  expected_attendees: number;
  equipment_allocations?: EquipmentAllocation[];
  registrations_count: number;
  is_registered_by_me: boolean;
  created_at: string;
  updated_at: string;
}

export type Event = CampusEvent;

export interface EventQueryParams {
  date?: string;
  start_after?: string;
  end_before?: string;
  status?: string;
  hall?: number;
  organizer?: number;
  search?: string;
}

export interface Notification {
  id: number;
  user: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}
