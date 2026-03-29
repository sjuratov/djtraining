export type Gender = 'männlich' | 'weiblich' | 'divers';
export type TrainingGoal = 'abnehmen' | 'muskelaufbau' | 'fitness' | 'reha' | 'wohlbefinden';
export type ExperienceLevel = 'anfänger' | 'fortgeschritten' | 'profi';
export type TrainingType = 'personal' | 'gruppe' | 'beides';
export type PreferredTime = 'morgens' | 'mittags' | 'abends';

export interface MemberProfile {
  // Personal
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string | null;
  gender: Gender | null;

  // Fitness
  trainingGoal: TrainingGoal | null;
  experienceLevel: ExperienceLevel | null;
  healthNotes: string;

  // Membership
  trainingType: TrainingType | null;
  sessionsPerWeek: number | null;
  preferredTimes: PreferredTime[];
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string | null;
  role: 'admin' | 'user';
  status: 'pending' | 'active';
  authProvider: 'local' | 'google';
  confirmationToken: string | null;
  googleId: string | null;
  createdAt: string;
  profile: MemberProfile | null;
}

const users = new Map<string, User>();

export function getUsers(): Map<string, User> { return users; }
export function getAllUsers(): User[] { return Array.from(users.values()); }
export function getUserById(id: string): User | undefined { return users.get(id); }

export function getUserByEmail(email: string): User | undefined {
  return Array.from(users.values()).find(u => u.email === email);
}

export function getUserByConfirmationToken(token: string): User | undefined {
  return Array.from(users.values()).find(u => u.confirmationToken === token);
}

export function getUserByGoogleId(googleId: string): User | undefined {
  return Array.from(users.values()).find(u => u.googleId === googleId);
}

export function activateUser(userId: string): User | undefined {
  const user = users.get(userId);
  if (!user) return undefined;
  user.status = 'active';
  user.confirmationToken = null;
  return user;
}

export function createUser(params: {
  email: string;
  displayName: string;
  passwordHash: string | null;
  authProvider: 'local' | 'google';
  confirmationToken: string | null;
  googleId: string | null;
}): User {
  const isFirstUser = users.size === 0;
  const user: User = {
    id: crypto.randomUUID(),
    email: params.email,
    displayName: params.displayName,
    passwordHash: params.passwordHash,
    role: isFirstUser ? 'admin' : 'user',
    status: params.authProvider === 'google' ? 'active' : 'pending',
    authProvider: params.authProvider,
    confirmationToken: params.confirmationToken,
    googleId: params.googleId,
    createdAt: new Date().toISOString(),
    profile: null,
  };
  users.set(user.id, user);
  return user;
}

export function deleteUser(id: string): void { users.delete(id); }
export function clearUsers(): void { users.clear(); }

export function getProfile(userId: string): MemberProfile | null {
  const user = users.get(userId);
  return user?.profile ?? null;
}

export function updateProfile(userId: string, profile: MemberProfile): User | undefined {
  const user = users.get(userId);
  if (!user) return undefined;
  user.profile = profile;
  return user;
}

export function createDefaultProfile(): MemberProfile {
  return {
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: null,
    gender: null,
    trainingGoal: null,
    experienceLevel: null,
    healthNotes: '',
    trainingType: null,
    sessionsPerWeek: null,
    preferredTimes: [],
  };
}
