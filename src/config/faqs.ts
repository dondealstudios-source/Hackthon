import { getProblemStatements, type EventConfig } from './event';
export function getFaqs(config: EventConfig): string[][] {
  const status = config.registrationStatus === 'open' ? 'Registrations open' : config.registrationStatus === 'closed' ? 'Registrations closed' : 'Registrations opening soon';
  const pending = 'Details will be announced soon.';
  const faqs = [
    [`What is ${config.name}?`, 'A two-day offline student hackathon organized by VistaCortex. Choose from eight problem statements and build a solution in person. Venues will be announced soon.'],
    ['Who can participate?', config.eligibility || 'BuildFeast is a student innovation event. Final eligibility requirements will be announced soon.'],
    ['Where will the event take place?', config.venue ? `BuildFeast is an offline, in-person event. Venue: ${config.venue}.` : 'BuildFeast is an offline, in-person event. Venues will be announced soon.'],
    ['How long is the hackathon?', 'BuildFeast is a two-day offline hackathon. Exact dates, venue, detailed agenda, and timings will be announced soon.'],
    ['What is the registration fee?', `The registration fee is ₹${config.fee}. Payment will become available when registration opens and the fee basis and terms are finalized.`],
    ['Is ₹300 charged per participant or per team?', config.feeBasis ? `The fee is charged ${config.feeBasis === 'per_team' ? 'per team' : 'per participant'}.` : 'The fee basis is being finalized. We will confirm whether ₹300 applies per participant or per team before paid registration opens.'],
    ['Can I participate individually?', config.teamSize || 'Individual and team interest can both be recorded on the waitlist. Final participation and team-size rules will be announced soon.'],
    ['When will registrations open?', `${status}. Join the waitlist for updates. ${config.registrationDeadline || 'Opening dates and deadlines will be announced soon.'}`],
    ['What are the hackathon problem statements?', getProblemStatements(config).join('; ') + '.'],
    ['How will the hackathon work?', 'Choose one of the listed problem statements, build a solution, submit your project, and present your idea. Submission deadlines and judging criteria will be announced soon.'],
    ['Is prize money available?', config.prizes.available ? `Yes. Prize amounts and categories ${config.prizes.amount || 'will be announced later'}.` : pending],
    ['What are the internship opportunities?', `${config.internships.selectedParticipants} selected participants will receive internship opportunities with a stated value of ₹${config.internships.statedValue.toLocaleString('en-IN')}. Roles, duration, provider, and terms will be announced soon.`],
    ['How will the three internship recipients be selected?', config.internships.selectionCriteria || 'Opportunities are competitive and subject to finalized eligibility and selection criteria. The selection process will be announced soon.'],
    ['What is the stated internship value?', `The stated value is ₹${config.internships.statedValue.toLocaleString('en-IN')}. ${config.internships.allocation || 'Whether this applies per participant or across the three opportunities is yet to be confirmed.'}`],
    ['Will participants receive certificates?', config.hackathon.certificates || pending],
    ['Who are the official partners?', `${config.partners.map(p => p.name).join(' and ')} are the official event partners. VistaCortex is the organizer.`],
    ['Where can I find the event rules?', config.rulesAcceptedText || 'Finalized rules will be published here before paid registration opens.'],
    ['How do I contact the organizers?', config.contact.email ? `Email ${config.contact.email}.` : 'Official contact details will be published soon.'],
  ];

return faqs;
}
