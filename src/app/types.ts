export type PlanId = 'launch' | 'grow' | 'scale'
export type Status = 'queued' | 'active' | 'review' | 'done' | 'cancelled'
export type Kind = 'page' | 'design' | 'copy' | 'campaign' | 'fix' | 'social' | 'automation' | 'other'

export type Plan = { id: PlanId; name: string; setup: number; monthly: number; slots: number }
export const PLANS: Record<PlanId, Plan> = {
  launch: { id: 'launch', name: 'Launch', setup: 600, monthly: 80, slots: 2 },
  grow: { id: 'grow', name: 'Grow', setup: 1200, monthly: 150, slots: 4 },
  scale: { id: 'scale', name: 'Scale', setup: 3000, monthly: 250, slots: 6 },
}
export const COMMUNITY = 1000

export type User = { id: string; email: string; name: string; company: string; role: 'client' | 'admin'; brand: Brand
  /** the client account this person works in (their own id, or the owner's when invited); member: invited, not the owner */
  account?: string; member?: boolean; accountName?: string
  phone?: string; jobTitle?: string; timezone?: string; avatar?: string | null; notify?: Notify; lang?: 'en' | 'es'; since?: string }
export type Notify = { review: boolean; comments: boolean; weekly: boolean; billing: boolean }
export type SessionRow = { id: string; agent: string; at: string; current: boolean }
export type TeamView = { members: { id: string; email: string; name: string; since: string; owner: boolean }[]; invites: { id: string; email: string; at: string; expires: string }[] }
export type Brand = { colors?: string[]; fonts?: string; site?: string; notes?: string; logo?: string; business?: Business; onboarded?: boolean }
/** what the client told the studio in the welcome conversation (indexes point at the options in i18n-welcome.ts) */
export type Business = { what?: string; industry?: number; customers?: string; goals?: number[]; site?: string; instagram?: string; other?: string; style?: number; notes?: string; seen?: string[] }
export type Subscription = { plan: PlanId; status: 'pending' | 'building' | 'active' | 'past_due' | 'paused' | 'cancelled'; community: boolean; periodEnd: string | null; portalUrl: string | null }

/** Mirrors studio.slots_for so the portal only promises work the queue can start. */
export function runningSlots(sub: Subscription | null) {
  return sub && (sub.status === 'building' || sub.status === 'active') ? PLANS[sub.plan].slots : 0
}
export type Invoice = { id: string; label: string; amount: number; status: string; url: string | null; at: string }
export type CheckItem = { text: string; done: boolean }
export type Req = {
  id: string; number: number; owner: string; ownerName?: string; ownerEmail?: string; title: string; kind: Kind; brief: string; checklist: CheckItem[]; priority: 1 | 2 | 3
  status: Status; position: number; progress: number; deliverable: string | null; files: string[]
  createdAt: string; startedAt: string | null; reviewAt: string | null; doneAt: string | null; dueDate?: string | null
  rating?: number | null; ratingNote?: string | null; recurringId?: string | null
}
export type Recurring = { id: string; title: string; kind: Kind; every: 'week' | 'month'; nextAt: string; made: number; active: boolean }
export type Pin = { id: string; fileId: string; x: number; y: number; body: string; resolved: boolean; byStudio?: boolean; mine?: boolean; at: string }
export type FileKind = 'brief' | 'deliverable' | 'asset' | 'brand'
export type FileItem = { id: string; owner: string; requestId: string | null; kind: FileKind; version: number; name: string; mime: string; size: number; at: string; byStudio?: boolean; url?: string }
export type Ev = { id: string; requestId: string; who: 'client' | 'studio' | 'ai' | 'system'; kind: 'comment' | 'status' | 'file' | 'ai' | 'changes'; body: string; at: string; by?: string }
export type NewReq = { title: string; kind: Kind; brief: string; checklist: CheckItem[]; priority: 1 | 2 | 3; files: File[]; dueDate?: string | null }

export type ActivityWho = '' | 'studio' | 'client' | 'ai'
export const activityExportSize = 250
export const activityViewer = (id: string, account: string, role: User['role']) => [id, account, role].join('/')
export type ActivityExportOptions = { viewer: string; signal: AbortSignal }
export type ActivityEvent = Ev & { requestTitle: string; requestNumber: number }
export type MailConfig = { provider: 'none' | 'resend'; sender: string; appUrl: string; apiKey: string }
export type MailItem = { id: string; email: string; subject: string; text: string; status: 'queued' | 'sent' | 'failed' | 'skipped'; at: string; sentAt: string | null }

export interface Backend {
  mode: 'demo' | 'live'
  search(query: string, offset: number, signal?: AbortSignal): Promise<import('./workspace-search').SearchMatches>
  session(): Promise<User | null>
  studioRevision?(): string | null
  /** create an account or sign in with email and password; throws with a readable message */
  signIn(mode: 'signup' | 'login', email: string, password: string, name?: string, invite?: string): Promise<void>
  // the client's team (owner invites; members share requests, files and pins; billing stays with the owner)
  team(): Promise<TeamView>
  invite(email: string): Promise<{ link: string }>
  revokeInvite(id: string): Promise<void>
  removeMember(id: string): Promise<void>
  inviteInfo(token: string): Promise<{ email: string; account: string } | null>
  signOut(): Promise<void>
  updateProfile(p: Partial<Pick<User, 'name' | 'company' | 'brand' | 'phone' | 'jobTitle' | 'timezone' | 'lang' | 'avatar' | 'notify'>>): Promise<void>
  changePassword(current: string, next: string): Promise<void>
  sessions(): Promise<SessionRow[]>
  /** one session by id, or 'others' for every device but this one */
  closeSession(id: string): Promise<void>
  subscription(): Promise<Subscription | null>
  invoices(): Promise<Invoice[]>
  requests(all?: boolean): Promise<Req[]>
  create(r: NewReq): Promise<Req>
  /** note: required when a client sends a delivery back (status review → active) */
  update(id: string, patch: Partial<Pick<Req, 'status' | 'title' | 'brief' | 'checklist' | 'priority' | 'progress' | 'deliverable' | 'dueDate'>> & { note?: string }): Promise<void>
  files(): Promise<FileItem[]>
  upload(file: File, o: { requestId?: string | null; kind: FileKind }): Promise<FileItem>
  removeFile(id: string): Promise<void>
  fileUrl(f: FileItem, download?: boolean): string
  /** when the viewer last opened their updates */
  pins(): Promise<Pin[]>
  addPin(fileId: string, x: number, y: number, body: string): Promise<void>
  setPin(id: string, resolved: boolean): Promise<void>
  removePin(id: string): Promise<void>
  lastSeen(): string | null
  markSeen(): Promise<void>
  reorder(owner: string, expected: string[], order: string[]): Promise<void>
  activity(who: ActivityWho, cursor?: string, query?: string, download?: ActivityExportOptions): Promise<{ items: ActivityEvent[]; next: string | null }>
  mailConfig(): Promise<MailConfig>
  saveMailConfig(config: MailConfig): Promise<MailConfig>
  notices(before?: string, requestId?: string): Promise<{ items: MailItem[]; next: string | null }>
  events(requestId?: string): Promise<Ev[]>
  comment(requestId: string, body: string): Promise<void>
  /** live changes; returns a function that stops listening */
  listen(cb: () => void): () => void
  /** the provider's hosted checkout for one step, or an in-app test page in demo mode */
  checkout(plan: PlanId, step: 'build' | 'monthly' | 'community', returnUrl: string, community?: boolean): Promise<{ url?: string; pending?: boolean }>
  // plan changes: what it costs and when (quote), ask for it (opens a checkout when a provider is set up), undo before it applies
  changes(): Promise<PlanChange[]>
  quote(kind: ChangeKind, to?: PlanId): Promise<Quote>
  requestChange(kind: ChangeKind, to: PlanId | undefined, returnUrl: string): Promise<{ change: PlanChange; url: string | null }>
  undoChange(id: string): Promise<void>
  /** a 1–5 rating for an approved delivery */
  rate(id: string, score: number, note?: string): Promise<void>
  recurring(): Promise<Recurring[]>
  addRecurring(r: { title: string; kind: Kind; brief: string; checklist: CheckItem[]; priority: 1 | 2 | 3; every: 'week' | 'month' }): Promise<void>
  stopRecurring(id: string): Promise<void>
  // the studio only
  adminChanges(): Promise<PlanChange[]>
  /** paid: confirms the payment (adds the invoice) and applies; apply: applies without an invoice */
  settleChange(id: string, how: 'paid' | 'apply'): Promise<void>
  rejectChange(id: string): Promise<void>
  clients(): Promise<Client[]>
  updateClient(id: string, p: { plan: PlanId; status: Subscription['status']; community: boolean }): Promise<void>
  payments(): Promise<PayView>
  savePayments(p: PayView): Promise<PayView>
}
export type { ChangeKind, Quote } from '../lib/plan-rules'
import type { ChangeKind, Quote } from '../lib/plan-rules'
export type PlanChange = { id: string; kind: ChangeKind; from: PlanId; to: PlanId; amount: number; status: 'awaiting_payment' | 'scheduled' | 'applied' | 'cancelled'; effectiveAt: string | null; at: string; closedAt: string | null; quote?: Quote; resolution?: 'paid' | 'waived' | 'rejected' | null; invoiceId?: string | null; client?: { id: string; email: string; name: string; company: string } }
export type Client = { id: string; email: string; name: string; company: string; role: string; since: string; plan: PlanId | null; status: Subscription['status'] | null; community: boolean | null; open: number; team?: number }
export type PayView = { provider: 'none' | 'lemonsqueezy'; apiKey: string; storeId: string; webhookSecret: string; variants: Record<string, string>; webhook?: string }
