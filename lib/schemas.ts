/**
 * Zod schemas mirroring the FastAPI Pydantic models.
 * Kept in lock-step with `app/schemas/*.py`.
 */
import { z } from "zod";

// -------- primitives ---------------------------------------------------------

export const PolicyStatus = z.enum([
  "active",
  "expired",
  "renewal_due",
  "cancelled",
]);
export type PolicyStatus = z.infer<typeof PolicyStatus>;

export const LeadStatus = z.enum([
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
]);
export type LeadStatus = z.infer<typeof LeadStatus>;

export const TaskStatus = z.enum([
  "pending",
  "in_progress",
  "done",
  "cancelled",
]);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const TaskType = z.enum(["followup", "renewal", "call", "other"]);
export type TaskType = z.infer<typeof TaskType>;

export const UserRole = z.enum(["admin", "agent"]);
export type UserRole = z.infer<typeof UserRole>;

// -------- auth ---------------------------------------------------------------

export const User = z.object({
  id: z.number(),
  name: z.string(),
  email: z.email(),
  role: UserRole,
  is_active: z.boolean(),
  agency_id: z.number(),
  created_at: z.string(),
});
export type User = z.infer<typeof User>;

export const Agency = z.object({
  id: z.number(),
  name: z.string(),
  subscription_plan: z.string(),
  created_at: z.string(),
});
export type Agency = z.infer<typeof Agency>;

export const AuthResponse = z.object({
  access_token: z.string(),
  token_type: z.string().default("bearer"),
  user: User,
});

export const RegisterResponse = z.object({
  access_token: z.string(),
  agency: Agency,
  user: User,
});

// -------- domain -------------------------------------------------------------

export const Lead = z.object({
  id: z.number(),
  name: z.string(),
  phone: z.string(),
  email: z.email().nullable().optional(),
  insurance_type: z.string(),
  source: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: LeadStatus,
  agency_id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Lead = z.infer<typeof Lead>;

export const Customer = z.object({
  id: z.number(),
  name: z.string(),
  phone: z.string(),
  email: z.email().nullable().optional(),
  address: z.string().nullable().optional(),
  lead_id: z.number().nullable().optional(),
  agency_id: z.number(),
  created_at: z.string(),
});
export type Customer = z.infer<typeof Customer>;

export const Policy = z.object({
  id: z.number(),
  customer_id: z.number(),
  policy_type: z.string(),
  policy_number: z.string(),
  start_date: z.string(),
  expiry_date: z.string(),
  premium: z.union([z.number(), z.string()]).transform((v) =>
    typeof v === "string" ? Number(v) : v,
  ),
  status: PolicyStatus,
  agency_id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Policy = z.infer<typeof Policy>;

export const Task = z.object({
  id: z.number(),
  related_id: z.number().nullable().optional(),
  type: TaskType,
  title: z.string(),
  description: z.string().nullable().optional(),
  due_date: z.string(),
  status: TaskStatus,
  agency_id: z.number(),
  created_at: z.string(),
});
export type Task = z.infer<typeof Task>;

// -------- import -------------------------------------------------------------

export const RowError = z.object({
  row: z.number(),
  error: z.string(),
  policy_number: z.string().nullable().optional(),
});
export type RowError = z.infer<typeof RowError>;

export const ImportResult = z.object({
  total_rows: z.number(),
  imported: z.number(),
  skipped: z.number(),
  customers_created: z.number(),
  renewals_flagged: z.number(),
  tasks_created: z.number(),
  dry_run: z.boolean(),
  errors: z.array(RowError),
});
export type ImportResult = z.infer<typeof ImportResult>;

// -------- pagination ---------------------------------------------------------

export const Paginated = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number(),
    page: z.number(),
    page_size: z.number(),
    pages: z.number(),
  });

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

// -------- form payloads ------------------------------------------------------

export const LoginPayload = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type LoginPayload = z.infer<typeof LoginPayload>;

export const RegisterPayload = z.object({
  agency_name: z.string().min(2, "Agency name must be at least 2 characters"),
  admin_name: z.string().min(1, "Your name is required"),
  admin_email: z.email("Enter a valid email address"),
  admin_password: z.string().min(8, "Password must be at least 8 characters"),
  subscription_plan: z.enum(["free", "starter", "growth"]),
});
export type RegisterPayload = z.infer<typeof RegisterPayload>;

export const PolicyCreatePayload = z
  .object({
    customer_id: z.number().int().positive("Select a customer"),
    policy_type: z.string().min(1, "Policy type is required"),
    policy_number: z.string().min(1, "Policy number is required"),
    start_date: z.string().min(1, "Start date is required"),
    expiry_date: z.string().min(1, "Expiry date is required"),
    premium: z.number().nonnegative("Premium cannot be negative"),
  })
  .refine((v) => v.expiry_date >= v.start_date, {
    message: "Expiry must be on or after start date",
    path: ["expiry_date"],
  });
export type PolicyCreatePayload = z.infer<typeof PolicyCreatePayload>;

/** Payload for POST /leads (mirrors FastAPI `LeadCreate`). */
export const LeadCreatePayload = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(5, "Phone must be at least 5 characters"),
  email: z
    .union([z.literal(""), z.email("Enter a valid email")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  insurance_type: z.string().min(1, "Insurance type is required"),
  source: z
    .string()
    .max(64)
    .optional()
    .transform((v) => {
      const t = v?.trim();
      return t ? t : undefined;
    }),
  notes: z
    .string()
    .max(1024)
    .optional()
    .transform((v) => {
      const t = v?.trim();
      return t ? t : undefined;
    }),
  status: LeadStatus.default("new"),
});
export type LeadCreatePayload = z.infer<typeof LeadCreatePayload>;

// -------- dashboard (Phase 2A) ---------------------------------------------

/** Validated bundle of all list slices fetched in parallel for the dashboard. */
export const DashboardListBundle = z.object({
  leadsRecent: Paginated(Lead),
  customersCount: Paginated(Customer),
  policiesTotal: Paginated(Policy),
  policiesActive: Paginated(Policy),
  policiesRenewalDue: Paginated(Policy),
  tasksPending: Paginated(Task),
});
export type DashboardListBundle = z.infer<typeof DashboardListBundle>;

export function parseDashboardListBundle(input: {
  leadsRecent: unknown;
  customersCount: unknown;
  policiesTotal: unknown;
  policiesActive: unknown;
  policiesRenewalDue: unknown;
  tasksPending: unknown;
}): DashboardListBundle {
  return DashboardListBundle.parse(input);
}

// -------- customers (Phase 2A) -----------------------------------------------

/** Alias for API customer rows (matches `Customer`). */
export const CustomerSchema = Customer;
export type CustomerSchemaType = z.infer<typeof CustomerSchema>;

export const CustomerListSchema = Paginated(Customer);
export type CustomerListResponse = z.infer<typeof CustomerListSchema>;

/**
 * Create form + action parse — FastAPI requires `phone` min 5 chars; the server
 * action coerces a blank phone to a placeholder before calling the API.
 */
export const CreateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  phone: z.string().max(32).optional(),
  email: z.union([z.literal(""), z.email("Enter a valid email")]).optional(),
  address: z.string().max(512).optional(),
})
  .superRefine((v, ctx) => {
    const t = (v.phone ?? "").trim();
    if (t.length > 0 && t.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone must be at least 5 characters or leave blank",
        path: ["phone"],
      });
    }
  });
export type CreateCustomerFormValues = z.infer<typeof CreateCustomerSchema>;

/** Wire format for `POST /customers` (matches FastAPI `CustomerCreate`). */
export type CreateCustomerPayload = {
  name: string;
  phone: string;
  email?: string;
  address?: string;
};

export const UpdateCustomerSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    phone: z.string().max(32).optional(),
    email: z.union([z.literal(""), z.email("Enter a valid email")]).optional(),
    address: z.string().max(512).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.phone === undefined) return;
    const t = val.phone.trim();
    if (t !== "" && t.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone must be at least 5 characters",
        path: ["phone"],
      });
    }
  })
  .transform((v) => {
    const out: {
      name?: string;
      phone?: string;
      email?: string | null;
      address?: string | null;
    } = {};
    if (v.name !== undefined) out.name = v.name.trim();
    if (v.phone !== undefined) {
      const t = v.phone.trim();
      if (t === "") out.phone = "00000";
      else out.phone = t;
    }
    if (v.email !== undefined) {
      out.email = v.email === "" ? null : v.email;
    }
    if (v.address !== undefined) {
      const t = v.address.trim();
      out.address = t.length ? t : null;
    }
    return out;
  });
export type UpdateCustomerPayload = z.infer<typeof UpdateCustomerSchema>;

/** Client edit form — values are posted as FormData to `updateCustomerAction`. */
export const UpdateCustomerFormSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(255),
    phone: z.string().max(32),
    email: z.union([z.literal(""), z.email("Enter a valid email")]),
    address: z.string().max(512),
  })
  .superRefine((v, ctx) => {
    const t = v.phone.trim();
    if (t !== "" && t.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone must be at least 5 characters or leave blank",
        path: ["phone"],
      });
    }
  });
export type UpdateCustomerFormValues = z.infer<typeof UpdateCustomerFormSchema>;

// -------- team / users (Phase 2A) --------------------------------------------

/** API user row (alias of `User`). */
export const UserSchema = User;
export type UserSchemaType = z.infer<typeof UserSchema>;

export const UserListSchema = Paginated(User);
export type UserListResponse = z.infer<typeof UserListSchema>;

/** Payload for `POST /users` (matches FastAPI `UserCreate`). */
export const CreateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
  role: UserRole,
});
export type CreateUserPayload = z.infer<typeof CreateUserSchema>;

/** Non-httpOnly `zentro_user` cookie JSON (subset of `User`). */
export const ZentroUserSessionSchema = z.object({
  id: z.union([z.number(), z.string()]).transform((v) =>
    typeof v === "string" ? Number(v) : v,
  ),
  name: z.string(),
  email: z.string(),
  role: UserRole,
  agency_id: z.union([z.number(), z.string()]).transform((v) =>
    typeof v === "string" ? Number(v) : v,
  ),
});
export type ZentroUserSession = z.infer<typeof ZentroUserSessionSchema>;

// -------- interactions (Phase 2B) --------------------------------------------

const InteractionId = z.union([z.string(), z.number()]).transform((v) => String(v));

export const InteractionDirection = z.enum(["incoming", "outgoing"]);
export type InteractionDirection = z.infer<typeof InteractionDirection>;

export const InteractionSchema = z.object({
  id: InteractionId,
  lead_id: InteractionId,
  message: z.string(),
  direction: InteractionDirection,
  channel: z.string(),
  agency_id: InteractionId,
  timestamp: z.string(),
});
export type Interaction = z.infer<typeof InteractionSchema>;

export const InteractionListSchema = Paginated(InteractionSchema);
export type InteractionListResponse = z.infer<typeof InteractionListSchema>;

export const CreateInteractionSchema = z.object({
  lead_id: z.coerce.number().int().positive(),
  message: z.string().min(1, "Message is required").max(4000),
  direction: z.literal("outgoing"),
  channel: z.enum(["whatsapp", "note"]),
});
export type CreateInteractionPayload = z.infer<typeof CreateInteractionSchema>;

// -------- quotes (Phase 2B) ----------------------------------------------------

const QuoteId = z.union([z.string(), z.number()]).transform((v) => String(v));

export const QuoteStatusSchema = z.enum([
  "draft",
  "sent",
  "accepted",
  "rejected",
]);
export type QuoteStatus = z.infer<typeof QuoteStatusSchema>;

export const QuoteSchema = z.object({
  id: QuoteId,
  lead_id: z
    .union([z.null(), z.string(), z.number()])
    .transform((v) => (v === null || v === undefined ? null : String(v))),
  customer_id: z
    .union([z.null(), z.string(), z.number()])
    .transform((v) => (v === null || v === undefined ? null : String(v))),
  policy_type: z.string(),
  insurer: z.string(),
  premium_quoted: z.union([z.number(), z.string()]).transform((v) =>
    typeof v === "number" ? String(v) : v,
  ),
  valid_until: z.string(),
  status: QuoteStatusSchema,
  notes: z.string().nullable().optional(),
  agency_id: QuoteId,
  created_at: z.string(),
  updated_at: z.string(),
});
export type Quote = z.infer<typeof QuoteSchema>;

export const QuoteListSchema = Paginated(QuoteSchema);
export type QuoteListResponse = z.infer<typeof QuoteListSchema>;

export const QuotePartyOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type QuotePartyOption = z.infer<typeof QuotePartyOptionSchema>;

export const CreateQuoteSchema = z
  .object({
    lead_id: z.string().optional(),
    customer_id: z.string().optional(),
    policy_type: z.string().min(1, "Policy type is required"),
    insurer: z.string().min(1, "Insurer is required"),
    premium_quoted: z
      .string()
      .min(1, "Premium is required")
      .refine((s) => {
        const n = Number(s);
        return Number.isFinite(n) && n >= 0;
      }, "Enter a valid premium"),
    valid_until: z.string().min(1, "Valid until is required"),
    notes: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    const l = (d.lead_id ?? "").trim();
    const c = (d.customer_id ?? "").trim();
    if (!l && !c) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a lead or a customer",
        path: ["lead_id"],
      });
    }
    if (l && c) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose only one of lead or customer",
        path: ["customer_id"],
      });
    }
  });
export type CreateQuoteFormValues = z.infer<typeof CreateQuoteSchema>;

export const UpdateQuoteSchema = z.object({
  policy_type: z.string().min(1, "Policy type is required"),
  insurer: z.string().min(1, "Insurer is required"),
  premium_quoted: z
    .string()
    .min(1, "Premium is required")
    .refine((s) => {
      const n = Number(s);
      return Number.isFinite(n) && n >= 0;
    }, "Enter a valid premium"),
  valid_until: z.string().min(1, "Valid until is required"),
  notes: z.string().optional(),
});
export type UpdateQuoteFormValues = z.infer<typeof UpdateQuoteSchema>;

// -------- agency settings (Phase 2B) -----------------------------------------

export const DEFAULT_RENEWAL_MESSAGE_TEMPLATE =
  "Hi {name}, your policy {policy_number} is due for renewal on {expiry_date}. Please contact us to renew.";

export const DEFAULT_BIRTHDAY_MESSAGE_TEMPLATE =
  "Happy Birthday {name}! Wishing you a wonderful day from your insurance team.";

export const AGENCY_SETTINGS_TIMEZONES = [
  "UTC",
  "Asia/Kuala_Lumpur",
  "Asia/Singapore",
  "Asia/Jakarta",
  "Asia/Bangkok",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
] as const;

const AgencySettingsId = z
  .union([z.string(), z.number()])
  .transform((v) => String(v));

export const AgencySettingsSchema = z.object({
  id: AgencySettingsId,
  agency_id: AgencySettingsId,
  logo_url: z.string().nullable().optional(),
  whatsapp_number: z.string().nullable().optional(),
  email_sender_name: z.string().nullable().optional(),
  timezone: z.string(),
  renewal_window_days: z.number(),
  renewal_message_template: z.string().nullable().optional(),
  birthday_message_template: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type AgencySettings = z.infer<typeof AgencySettingsSchema>;

export const UpdateAgencySettingsSchema = z.object({
  logo_url: z.string().nullable().optional(),
  whatsapp_number: z.string().nullable().optional(),
  email_sender_name: z.string().nullable().optional(),
  timezone: z.string().optional(),
  renewal_window_days: z.number().int().min(7).max(60).optional(),
  renewal_message_template: z.string().nullable().optional(),
  birthday_message_template: z.string().nullable().optional(),
});
export type UpdateAgencySettingsPayload = z.infer<
  typeof UpdateAgencySettingsSchema
>;

export const AgencyProfileFormSchema = z.object({
  whatsapp_number: z.string(),
  email_sender_name: z.string(),
  logo_url: z.string(),
}).superRefine((d, ctx) => {
  const u = d.logo_url.trim();
  if (!u) return;
  let valid = false;
  try {
    valid = Boolean(new URL(u).protocol);
  } catch {
    valid = false;
  }
  if (!valid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter a valid URL",
      path: ["logo_url"],
    });
  }
});
export type AgencyProfileFormValues = z.infer<typeof AgencyProfileFormSchema>;

export const RenewalSettingsFormSchema = z.object({
  renewal_window_days: z.number().int().min(7).max(60),
  renewal_message_template: z.string(),
});
export type RenewalSettingsFormValues = z.infer<typeof RenewalSettingsFormSchema>;

export const NotificationTemplatesFormSchema = z.object({
  timezone: z
    .string()
    .refine(
      (v) => (AGENCY_SETTINGS_TIMEZONES as readonly string[]).includes(v),
      "Select a timezone",
    ),
  birthday_message_template: z.string(),
});
export type NotificationTemplatesFormValues = z.infer<
  typeof NotificationTemplatesFormSchema
>;

// -------- analytics (Phase 4) ----------------------------------------------

export const AgentSummarySchema = z.object({
  user_id: z.number(),
  name: z.string(),
  leads_created: z.number(),
  policies_created: z.number(),
  tasks_completed: z.number(),
});
export type AgentSummary = z.infer<typeof AgentSummarySchema>;

export const AnalyticsSummarySchema = z.object({
  leads: z.object({
    total: z.number(),
    by_status: z.object({
      new: z.number(),
      contacted: z.number(),
      qualified: z.number(),
      converted: z.number(),
      lost: z.number(),
    }),
    conversion_rate: z.number(),
  }),
  customers: z.object({
    total: z.number(),
  }),
  policies: z.object({
    total: z.number(),
    by_status: z.object({
      active: z.number(),
      expired: z.number(),
      renewal_due: z.number(),
      cancelled: z.number(),
    }),
    total_premium_value: z.number(),
  }),
  tasks: z.object({
    total: z.number(),
    pending: z.number(),
    overdue: z.number(),
  }),
  renewals_due_this_month: z.number(),
  expired_this_month: z.number(),
  agents: z.array(AgentSummarySchema).optional().default([]),
});
export type AnalyticsSummary = z.infer<typeof AnalyticsSummarySchema>;

export const AnalyticsMonthlyRowSchema = z.object({
  month: z.string(),
  leads_created: z.number(),
  policies_created: z.number(),
  revenue: z.number(),
});
export type AnalyticsMonthlyRow = z.infer<typeof AnalyticsMonthlyRowSchema>;

export const AnalyticsMonthlySchema = z.array(AnalyticsMonthlyRowSchema);

// -------- broadcasts (Phase 4) -----------------------------------------------

export const BroadcastSegmentSchema = z.enum([
  "all",
  "renewal_due",
  "expired",
  "birthday_this_month",
  "by_policy_type",
]);
export type BroadcastSegment = z.infer<typeof BroadcastSegmentSchema>;

export const BroadcastStatusSchema = z.enum([
  "draft",
  "sending",
  "sent",
  "failed",
]);
export type BroadcastStatus = z.infer<typeof BroadcastStatusSchema>;

export const BroadcastSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  target_segment: BroadcastSegmentSchema,
  policy_type_filter: z.string().nullable().optional(),
  message_template: z.string(),
  scheduled_at: z.string().nullable().optional(),
  status: BroadcastStatusSchema,
  sent_count: z.number().int().nonnegative(),
  failed_count: z.number().int().nonnegative(),
  agency_id: z.number().int().positive(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Broadcast = z.infer<typeof BroadcastSchema>;

export const BroadcastListSchema = Paginated(BroadcastSchema);
export type BroadcastList = z.infer<typeof BroadcastListSchema>;

export const CreateBroadcastSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    target_segment: BroadcastSegmentSchema,
    message_template: z.string().min(1, "Message is required"),
    scheduled_at: z.string().nullable().optional(),
    policy_type_filter: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.target_segment === "by_policy_type") {
      const t = (data.policy_type_filter ?? "").trim();
      if (!t) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Policy type is required for this segment",
          path: ["policy_type_filter"],
        });
      }
    }
  });
export type CreateBroadcastPayload = z.infer<typeof CreateBroadcastSchema>;

export const BroadcastPreviewCustomerSchema = z.object({
  name: z.string(),
  phone: z.string(),
});

export const BroadcastPreviewSchema = z.object({
  count: z.number().int().nonnegative(),
  customers: z.array(BroadcastPreviewCustomerSchema),
});
export type BroadcastPreview = z.infer<typeof BroadcastPreviewSchema>;

export const BroadcastSendResponseSchema = z.object({
  status: z.literal("sending"),
  broadcast_id: z.number().int().positive(),
});
export type BroadcastSendResponse = z.infer<typeof BroadcastSendResponseSchema>;

// -------- AI content (Phase 4) -----------------------------------------------

export const AIContentTypeSchema = z.enum([
  "marketing_post",
  "renewal_message",
  "birthday_wish",
  "quote_summary",
  "follow_up_message",
]);
export type AIContentType = z.infer<typeof AIContentTypeSchema>;

export const AIPlatformSchema = z.enum(["whatsapp", "facebook", "instagram"]);
export type AIPlatform = z.infer<typeof AIPlatformSchema>;

export const AIGenerateContextSchema = z.object({
  customer_name: z.string().optional(),
  policy_number: z.string().optional(),
  expiry_date: z.string().optional(),
  policy_type: z.string().optional(),
  insurer: z.string().optional(),
  premium: z.string().optional(),
  platform: AIPlatformSchema.optional(),
});
export type AIGenerateContext = z.infer<typeof AIGenerateContextSchema>;

export const AIGenerateRequestSchema = z.object({
  type: AIContentTypeSchema,
  context: AIGenerateContextSchema.default({}),
});
export type AIGenerateRequest = z.infer<typeof AIGenerateRequestSchema>;

export const AIGenerateResponseSchema = z.object({
  type: z.string(),
  content: z.string(),
  generated_at: z.string(),
});
export type AIGenerateResponse = z.infer<typeof AIGenerateResponseSchema>;

// -------- billing (Phase 5) ----------------------------------------------------

export const PlanTierSchema = z.enum(["starter", "growth", "pro"]);
export type PlanTier = z.infer<typeof PlanTierSchema>;

export const AgencyBillingStateSchema = z.enum([
  "free",
  "active",
  "past_due",
  "cancelled",
]);
export type AgencyBillingState = z.infer<typeof AgencyBillingStateSchema>;

export const PlanLimitsSchema = z.object({
  max_users: z.number().nullable(),
  max_leads: z.number().nullable(),
  max_policies: z.number().nullable(),
});
export type PlanLimits = z.infer<typeof PlanLimitsSchema>;

export const PlanUsageSchema = z.object({
  current_users: z.number(),
  current_leads: z.number(),
  current_policies: z.number(),
});
export type PlanUsage = z.infer<typeof PlanUsageSchema>;

export const BillingStatusSchema = z.object({
  plan: PlanTierSchema,
  billing_status: AgencyBillingStateSchema,
  plan_expires_at: z.string().nullable(),
  stripe_customer_id: z.string().nullable(),
  limits: PlanLimitsSchema,
  usage: PlanUsageSchema,
});
export type BillingStatus = z.infer<typeof BillingStatusSchema>;

export const CheckoutRequestSchema = z.object({
  price_id: z.string(),
  success_url: z.string(),
  cancel_url: z.string(),
});
export type CheckoutRequestPayload = z.infer<typeof CheckoutRequestSchema>;

export const CheckoutResponseSchema = z.object({
  checkout_url: z.string(),
});
export type CheckoutResponsePayload = z.infer<typeof CheckoutResponseSchema>;

export const PortalRequestSchema = z.object({
  return_url: z.string(),
});
export type PortalRequestPayload = z.infer<typeof PortalRequestSchema>;

export const PortalResponseSchema = z.object({
  portal_url: z.string(),
});
export type PortalResponsePayload = z.infer<typeof PortalResponseSchema>;

// -------- onboarding (wizard) ------------------------------------------------

/** Twilio WhatsApp Business setup guide (opens in a new tab from onboarding). */
export const ONBOARDING_TWILIO_WHATSAPP_DOC_URL =
  "https://www.twilio.com/docs/whatsapp/tutorial/connect-number-business-profile" as const;

// -------- global search (BFF + client) -------------------------------------

/** Combined entity rows returned by `GET /api/zims/search`. */
export const GlobalSearchApiResponseSchema = z.object({
  leads: z.array(Lead),
  customers: z.array(Customer),
  policies: z.array(Policy),
  tasks: z.array(Task),
});
export type GlobalSearchApiResponse = z.infer<typeof GlobalSearchApiResponseSchema>;
