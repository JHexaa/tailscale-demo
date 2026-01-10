export interface ConnectionInfo {
  ip_address: string;
  access_type: 'vpn' | 'public';
  access_label: string;
  is_vpn: boolean;
  user_agent: string | null;
  server_time: string;
  tailscale_headers: Record<string, string>;
}

export interface Visitor {
  id: number;
  ip_address: string;
  access_type: 'vpn' | 'public';
  user_agent: string | null;
  timestamp: string;
}

export interface Stats {
  total_visitors: number;
  vpn_visitors: number;
  public_visitors: number;
  total_images: number;
  timestamp: string;
}

export interface Image {
  id: number;
  original_filename: string;
  stored_filename: string;
  content_type: string;
  file_size: number;
  uploaded_by_ip: string;
  uploaded_at: string;
  url: string;
}

export interface ImageListResponse {
  total: number;
  images: Image[];
}

export interface ImageUploadResponse {
  success: boolean;
  message: string;
  image: Image | null;
}

export interface HealthResponse {
  status: string;
  database: string;
  minio: string;
  timestamp: string;
}
