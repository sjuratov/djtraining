import { type Express } from 'express';
import { getUserById, getProfile, updateProfile, createDefaultProfile, type MemberProfile, type Gender, type TrainingGoal, type ExperienceLevel, type TrainingType, type PreferredTime } from '../models/user-store.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const VALID_GENDERS: Gender[] = ['männlich', 'weiblich', 'divers'];
const VALID_GOALS: TrainingGoal[] = ['abnehmen', 'muskelaufbau', 'fitness', 'reha', 'wohlbefinden'];
const VALID_LEVELS: ExperienceLevel[] = ['anfänger', 'fortgeschritten', 'profi'];
const VALID_TYPES: TrainingType[] = ['personal', 'gruppe', 'beides'];
const VALID_TIMES: PreferredTime[] = ['morgens', 'mittags', 'abends'];

function validateProfile(data: Record<string, unknown>): { valid: boolean; profile?: MemberProfile; error?: string } {
  const profile = createDefaultProfile();

  // Personal
  if (data.firstName !== undefined) {
    if (typeof data.firstName !== 'string') return { valid: false, error: 'Vorname muss ein Text sein' };
    profile.firstName = data.firstName.trim();
  }
  if (data.lastName !== undefined) {
    if (typeof data.lastName !== 'string') return { valid: false, error: 'Nachname muss ein Text sein' };
    profile.lastName = data.lastName.trim();
  }
  if (data.phone !== undefined) {
    if (typeof data.phone !== 'string') return { valid: false, error: 'Telefonnummer muss ein Text sein' };
    profile.phone = data.phone.trim();
  }
  if (data.birthDate !== undefined && data.birthDate !== null) {
    if (typeof data.birthDate !== 'string' || isNaN(Date.parse(data.birthDate))) {
      return { valid: false, error: 'Ungültiges Geburtsdatum' };
    }
    profile.birthDate = data.birthDate;
  }
  if (data.gender !== undefined && data.gender !== null) {
    if (!VALID_GENDERS.includes(data.gender as Gender)) {
      return { valid: false, error: `Geschlecht muss eines von ${VALID_GENDERS.join(', ')} sein` };
    }
    profile.gender = data.gender as Gender;
  }

  // Fitness
  if (data.trainingGoal !== undefined && data.trainingGoal !== null) {
    if (!VALID_GOALS.includes(data.trainingGoal as TrainingGoal)) {
      return { valid: false, error: `Ungültiges Trainingsziel` };
    }
    profile.trainingGoal = data.trainingGoal as TrainingGoal;
  }
  if (data.experienceLevel !== undefined && data.experienceLevel !== null) {
    if (!VALID_LEVELS.includes(data.experienceLevel as ExperienceLevel)) {
      return { valid: false, error: `Ungültiges Erfahrungslevel` };
    }
    profile.experienceLevel = data.experienceLevel as ExperienceLevel;
  }
  if (data.healthNotes !== undefined) {
    if (typeof data.healthNotes !== 'string') return { valid: false, error: 'Gesundheitliche Hinweise müssen ein Text sein' };
    profile.healthNotes = data.healthNotes.trim();
  }

  // Membership
  if (data.trainingType !== undefined && data.trainingType !== null) {
    if (!VALID_TYPES.includes(data.trainingType as TrainingType)) {
      return { valid: false, error: `Ungültige Trainingsart` };
    }
    profile.trainingType = data.trainingType as TrainingType;
  }
  if (data.sessionsPerWeek !== undefined && data.sessionsPerWeek !== null) {
    const n = Number(data.sessionsPerWeek);
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      return { valid: false, error: 'Trainingseinheiten pro Woche muss zwischen 1 und 5 liegen' };
    }
    profile.sessionsPerWeek = n;
  }
  if (data.preferredTimes !== undefined) {
    if (!Array.isArray(data.preferredTimes) || !data.preferredTimes.every((t: unknown) => VALID_TIMES.includes(t as PreferredTime))) {
      return { valid: false, error: `Ungültige bevorzugte Zeiten` };
    }
    profile.preferredTimes = data.preferredTimes as PreferredTime[];
  }

  return { valid: true, profile };
}

export function mapProfileEndpoints(app: Express): void {
  // Get own profile
  app.get('/api/profile', authMiddleware, (req, res) => {
    const profile = getProfile(req.user!.sub);
    res.json(profile || createDefaultProfile());
  });

  // Update own profile
  app.put('/api/profile', authMiddleware, (req, res) => {
    const { valid, profile, error } = validateProfile(req.body);
    if (!valid || !profile) {
      res.status(400).json({ error });
      return;
    }

    const user = updateProfile(req.user!.sub, profile);
    if (!user) {
      res.status(404).json({ error: 'Benutzer nicht gefunden' });
      return;
    }

    res.json({ message: 'Profil aktualisiert', profile: user.profile });
  });

  // Admin: get any user's profile
  app.get('/api/admin/users/:userId/profile', authMiddleware, requireRole('admin'), (req, res) => {
    const userId = req.params.userId as string;
    const user = getUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'Benutzer nicht gefunden' });
      return;
    }

    res.json({
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
      profile: user.profile || createDefaultProfile(),
    });
  });
}
