// Core application types

export interface UserProfile {
  id: string;
  user_id: string;
  full_name?: string;
  phone?: string;
  emergency_contact?: string;
  student_id?: string;
  year?: string;
  major?: string;
  created_at: string;
  updated_at: string;
}

export interface IncidentReport {
  id: string;
  category: string;
  description: string;
  location?: string;
  anonymous: boolean;
  user_id?: string;
  photos?: string[];
  status: 'pending' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
}

export interface SecurityEvent {
  id: string;
  user_id?: string;
  event_type: string;
  event_data: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface LastLoginInfo {
  last_login_at: string;
  login_count: number;
  last_ip_address?: string;
  last_user_agent?: string;
}

export interface PasswordValidationResult {
  is_valid: boolean;
  score: number;
  max_score: number;
  requirements: {
    min_length: boolean;
    has_number: boolean;
    has_letter: boolean;
    has_special: boolean;
    has_upper: boolean;
    has_lower: boolean;
  };
}

export interface FormValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

// Google Maps types
export interface MapMarker {
  position: { lat: number; lng: number };
  title: string;
  type: 'safe' | 'incident' | 'welllit';
}

export interface CapturedPhoto {
  dataUrl: string;
  filename: string;
  size: number;
}