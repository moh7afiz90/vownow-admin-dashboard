import { supabase } from '@/lib/supabase';

export interface UserProfile {
  age?: number;
  gender?: string;
  location?: string;
  occupation?: string;
  interests: string[];
  bio?: string;
}

export interface UserActivity {
  id: string;
  type: 'login' | 'survey_completed' | 'profile_updated' | 'email_verified' | 'plan_upgraded';
  timestamp: string;
  details?: Record<string, any>;
}

export interface UserSurvey {
  id: string;
  title: string;
  category: string;
  completedAt: string;
  score?: number;
  responses: number;
}

export interface UserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  isActive: boolean;
  plan: 'free' | 'premium' | 'enterprise';
  planStartedAt: string;
  planExpiresAt: string | null;
  surveysCompleted: number;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  profileCompleteness: number;
  profile: UserProfile;
  recentActivity: UserActivity[];
  surveys: UserSurvey[];
  stats: {
    totalSurveysCompleted: number;
    averageCompletionTime: number;
    lastActivityAt: string;
    streakDays: number;
  };
}

interface ActivityFilters {
  limit?: number;
  offset?: number;
  type?: string;
}

interface SurveyFilters {
  limit?: number;
  offset?: number;
  category?: string;
}

export async function fetchUserById(userId: string): Promise<UserDetail | null> {
  try {
    // Validate UUID format
    if (!userId || !isValidUUID(userId)) {
      return null;
    }

    // Fetch user profile
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        created_at,
        updated_at,
        last_seen_at,
        status,
        role,
        email_verified_at,
        metadata
      `)
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return null;
    }

    // Parse user name
    const fullName = user.full_name || '';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Fetch subscription info
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_type, status, created_at, expires_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    // Count completed surveys
    const { count: surveysCompleted } = await supabase
      .from('questionnaire_responses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true);

    // Calculate profile completeness
    const profileCompleteness = calculateProfileCompleteness(user);

    // Get profile data from metadata
    const profile: UserProfile = {
      age: user.metadata?.age,
      gender: user.metadata?.gender,
      location: user.metadata?.location,
      occupation: user.metadata?.occupation,
      interests: user.metadata?.interests || [],
      bio: user.metadata?.bio,
    };

    // Get recent activity
    const recentActivity = await fetchUserActivities(userId, { limit: 10 });

    // Get surveys
    const surveys = await fetchUserSurveys(userId, { limit: 10 });

    // Calculate stats
    const lastActivityAt = user.last_seen_at || user.updated_at;
    const stats = {
      totalSurveysCompleted: surveysCompleted || 0,
      averageCompletionTime: 420, // Mock: 7 minutes
      lastActivityAt,
      streakDays: 7, // Mock data
    };

    return {
      id: user.id,
      email: user.email,
      firstName,
      lastName,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLoginAt: user.last_seen_at,
      isActive: user.status === 'active',
      plan: subscription?.plan_type || 'free',
      planStartedAt: subscription?.created_at || user.created_at,
      planExpiresAt: subscription?.expires_at || null,
      surveysCompleted: surveysCompleted || 0,
      emailVerified: !!user.email_verified_at,
      emailVerifiedAt: user.email_verified_at,
      profileCompleteness,
      profile,
      recentActivity,
      surveys,
      stats,
    };
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw error;
  }
}

export async function fetchUserActivities(userId: string, filters: ActivityFilters = {}): Promise<UserActivity[]> {
  try {
    const limit = filters.limit || 10;
    const offset = filters.offset || 0;

    let query = supabase
      .from('activity_logs')
      .select('id, action, created_at, metadata')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.type) {
      query = query.eq('action', filters.type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user activities:', error);
      return [];
    }

    return (data || []).map((activity: any) => ({
      id: activity.id,
      type: mapActivityType(activity.action),
      timestamp: activity.created_at,
      details: activity.metadata,
    }));
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return [];
  }
}

export async function fetchUserSurveys(userId: string, filters: SurveyFilters = {}): Promise<UserSurvey[]> {
  try {
    const limit = filters.limit || 10;
    const offset = filters.offset || 0;

    let query = supabase
      .from('questionnaire_responses')
      .select(`
        id,
        questionnaire_id,
        created_at,
        responses,
        score,
        questionnaires (
          title,
          category
        )
      `)
      .eq('user_id', userId)
      .eq('completed', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.category) {
      // This would need to be adjusted based on your actual schema
      query = query.eq('questionnaires.category', filters.category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user surveys:', error);
      return [];
    }

    return (data || []).map((survey: any) => ({
      id: survey.id,
      title: survey.questionnaires?.title || 'Unknown Survey',
      category: survey.questionnaires?.category || 'general',
      completedAt: survey.created_at,
      score: survey.score,
      responses: Array.isArray(survey.responses) ? survey.responses.length : 0,
    }));
  } catch (error) {
    console.error('Error fetching user surveys:', error);
    return [];
  }
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function calculateProfileCompleteness(user: any): number {
  let completeness = 0;
  const totalFields = 8;

  // Basic fields
  if (user.email) completeness += 1;
  if (user.full_name) completeness += 1;
  if (user.email_verified_at) completeness += 1;

  // Profile metadata fields
  const metadata = user.metadata || {};
  if (metadata.age) completeness += 1;
  if (metadata.gender) completeness += 1;
  if (metadata.location) completeness += 1;
  if (metadata.occupation) completeness += 1;
  if (metadata.bio) completeness += 1;

  return Math.round((completeness / totalFields) * 100);
}

function mapActivityType(action: string): UserActivity['type'] {
  const mapping: Record<string, UserActivity['type']> = {
    'login': 'login',
    'survey_completed': 'survey_completed',
    'profile_updated': 'profile_updated',
    'email_verified': 'email_verified',
    'plan_upgraded': 'plan_upgraded',
  };

  return mapping[action] || 'login';
}