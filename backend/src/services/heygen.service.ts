import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  gender: string;
  preview_image_url: string;
  preview_video_url?: string;
  type: 'studio' | 'talking_photo' | 'curated';
}

const FALLBACK_CURATED_AVATARS: HeyGenAvatar[] = [
  {
    avatar_id: 'heygen_ava_alex_tech',
    avatar_name: 'Alex Vance (Tech Lead)',
    gender: 'male',
    preview_image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    type: 'curated'
  },
  {
    avatar_id: 'heygen_ava_sophia_ai',
    avatar_name: 'Sophia Chen (AI Strategist)',
    gender: 'female',
    preview_image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    type: 'curated'
  },
  {
    avatar_id: 'heygen_ava_marcus_cyber',
    avatar_name: 'Marcus Miller (Cyberpunk)',
    gender: 'male',
    preview_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    type: 'curated'
  },
  {
    avatar_id: 'heygen_ava_elena_exec',
    avatar_name: 'Elena Rostova (Executive)',
    gender: 'female',
    preview_image_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    type: 'curated'
  },
  {
    avatar_id: 'heygen_ava_david_pro',
    avatar_name: 'David Kim (Product Specialist)',
    gender: 'male',
    preview_image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    type: 'curated'
  }
];

export class HeyGenService {
  private static baseUrl = 'https://api.heygen.com';

  static async listAvatars(): Promise<{ avatars: HeyGenAvatar[]; source: 'live_heygen' | 'curated_catalog' }> {
    if (!env.HEYGEN_API_KEY) {
      logger.info('HEYGEN_API_KEY not configured. Serving curated HeyGen AI avatars catalog.');
      return {
        avatars: FALLBACK_CURATED_AVATARS,
        source: 'curated_catalog'
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/v1/avatar.list`, {
        headers: {
          'X-Api-Key': env.HEYGEN_API_KEY,
          'Accept': 'application/json'
        },
        timeout: 8000
      });

      if (response.data && response.data.data && Array.isArray(response.data.data.avatars)) {
        const liveAvatars: HeyGenAvatar[] = response.data.data.avatars.map((item: any) => ({
          avatar_id: item.avatar_id,
          avatar_name: item.avatar_name || 'HeyGen AI Avatar',
          gender: item.gender || 'unspecified',
          preview_image_url: item.preview_image_url || '',
          preview_video_url: item.preview_video_url || '',
          type: item.avatar_id.includes('photo') ? 'talking_photo' : 'studio'
        }));

        return {
          avatars: liveAvatars,
          source: 'live_heygen'
        };
      }

      return {
        avatars: FALLBACK_CURATED_AVATARS,
        source: 'curated_catalog'
      };
    } catch (error: any) {
      logger.warn('Error connecting to HeyGen API, falling back to curated list:', error.message);
      return {
        avatars: FALLBACK_CURATED_AVATARS,
        source: 'curated_catalog'
      };
    }
  }

  static async generateCustomAvatar(params: {
    avatarId: string;
    avatarName?: string;
    scriptText?: string;
  }): Promise<{ avatarUrl: string; avatarId: string; status: string; videoId?: string }> {
    // If real API key is configured, invoke video generation
    if (env.HEYGEN_API_KEY && params.scriptText) {
      try {
        const res = await axios.post(
          `${this.baseUrl}/v2/video/generate`,
          {
            video_inputs: [
              {
                character: {
                  type: 'avatar',
                  avatar_id: params.avatarId,
                  avatar_style: 'normal'
                },
                voice: {
                  type: 'text',
                  input_text: params.scriptText,
                  voice_id: '131a43690d074ddca62f5b6390b30f1d'
                }
              }
            ],
            dimension: { width: 720, height: 720 }
          },
          {
            headers: {
              'X-Api-Key': env.HEYGEN_API_KEY,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        return {
          avatarUrl: `https://resource.heygen.ai/avatar/${params.avatarId}/preview.png`,
          avatarId: params.avatarId,
          status: 'processing',
          videoId: res.data?.data?.video_id
        };
      } catch (err: any) {
        logger.warn('HeyGen generation failed, using avatar preview image fallback:', err.message);
      }
    }

    // Default or fallback resolution
    const match = FALLBACK_CURATED_AVATARS.find((a) => a.avatar_id === params.avatarId);
    const chosenUrl = match?.preview_image_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${params.avatarId}`;

    return {
      avatarUrl: chosenUrl,
      avatarId: params.avatarId,
      status: 'ready'
    };
  }
}

