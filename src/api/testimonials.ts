import { API_BASE_URL } from '../config';
import { getAdminKey } from '../utils/adminKey';

export const DURATION_LABELS: Record<string, string> = {
  'less-than-week': 'Less than a week',
  '1-4-weeks': '1–4 weeks',
  '1-3-months': '1–3 months',
  '3-6-months': '3–6 months',
  '6-12-months': '6–12 months',
  'over-year': 'More than a year',
  'not-sure': 'Not sure',
};

export interface Testimonial {
  id: string;
  rating: number;
  testimony: string;
  duration: string;
  name: string;
  publishConsent: boolean;
  createdAt: string;
}

export async function listTestimonials(signal?: AbortSignal): Promise<Testimonial[]> {
  const response = await fetch(`${API_BASE_URL}/testimonials`, {
    headers: { Authorization: `Bearer ${getAdminKey()}` },
    cache: 'no-store',
    signal,
  });
  if (!response.ok) {
    throw new Error(response.status === 401
      ? 'Set a valid admin key on the dashboard to view quotes.'
      : 'Could not load quotes. Please try again.');
  }
  return response.json();
}
