export type OrderStatus = 'pending_payment' | 'paid' | 'generating' | 'done' | 'delivered';

export interface IntakeData {
  freeformContext: string;
  vibe?: string;
  musicReference?: string;
}

export interface Order {
  id: string;
  created_at: string;
  buyer_email: string;
  recipient_name: string;
  intake_data: IntakeData;
  lyrics: string | null;
  suno_style: string | null;
  status: OrderStatus;
  stripe_session_id: string | null;
  song_id: string | null;
  quality_rating: 1 | 2 | 3 | null;
}

export interface Song {
  id: string;
  created_at: string;
  order_id: string;
  recipient_name: string;
  lyrics: string;
  suno_style: string;
  audio_url: string | null;
  is_public: boolean;
}

export interface Preview {
  id: string;
  created_at: string;
  recipient_name: string;
  freeform_context: string;
  lyrics: string | null;
  suno_style: string | null;
}
