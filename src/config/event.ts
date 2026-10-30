import defaults from './event.json';
type Pending = string | null;
export interface EventConfig {
  name: string; tagline: string; registrationStatus: 'coming_soon' | 'open' | 'closed'; format: string; venue: Pending; period: string; dateLabel: string; dateAnnouncement: string;
  fee: number | null; feeBasis: 'per_participant' | 'per_team' | null;
  organizer: { name: string; logo: Pending; url?: string; brandLogo?: string };
  partners: { name: string; logo: Pending; url: Pending }[];
  prizes: { available: boolean; amount: Pending; categories: string[]; winnerCount: number | null; eligibility: Pending };
  internships: { selectedParticipants: number; statedValue: number; allocation: Pending; roles: Pending; duration: Pending; provider: Pending; eligibility: Pending; selectionCriteria: Pending };
  teamSize: Pending; teamRules: { minimum: number | null; maximum: number | null; individualAllowed: boolean | null }; eligibility: Pending; registrationDeadline: Pending; rulesAcceptedText: Pending;
  contact: { email: Pending }; socials: { name: string; url: string }[]; privacyContact: Pending; refundPolicy: Pending;
  schedule: { day: string; title: string; theme: string; description: string; topic: Pending; speaker: Pending; date: Pending }[];
  workshopCategories: string[]; mentoringTopics: string[];
  hackathon: { problemStatements: Pending; eligibility: Pending; teamSize: Pending; participationRules: Pending; submissionDeadline: Pending; judgingCriteria: Pending; finalPresentation: Pending; prizeCategories: Pending; certificates: Pending };
}
export const defaultEvent = defaults as EventConfig;

export function getProblemStatements(config: EventConfig): string[] {
  return (config.hackathon.problemStatements || defaultEvent.hackathon.problemStatements || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}
