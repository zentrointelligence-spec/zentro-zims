#!/usr/bin/env python3
"""Generate Zentro-ZIMS workflow architecture diagrams."""

import graphviz
from pathlib import Path

OUT_DIR = Path("/home/sammy1998/Zentro-ZIMS/docs")
OUT_DIR.mkdir(exist_ok=True)

# ========================================================================
# Diagram 1: Overall System Architecture
# ========================================================================
d1 = graphviz.Digraph(
    "ZIMS_Architecture",
    filename=str(OUT_DIR / "zims_architecture"),
    format="png",
    graph_attr={"rankdir": "TB", "bgcolor": "white", "fontname": "Helvetica", "fontsize": "24"},
    node_attr={"fontname": "Helvetica", "shape": "box", "style": "rounded,filled", "fontsize": "12"},
    edge_attr={"fontname": "Helvetica", "fontsize": "10"},
)
d1.attr(label="Zentro-ZIMS System Architecture", labelloc="t")

# Layers
d1.attr("node", shape="box3d", fillcolor="#E8F4FD", color="#1976D2", penwidth="2")
d1.node("Frontend", "Next.js 16 Frontend\n(shadcn/ui + Tailwind v4)\nPort 3000")
d1.node("Backend", "FastAPI Backend\n(Pydantic + SQLAlchemy)\nPort 8000")
d1.node("Database", "SQLite Database\n(zims.db)")
d1.node("Scheduler", "APScheduler\n(Renewal Engine)")

# External Services
d1.attr("node", shape="component", fillcolor="#FFF3E0", color="#E65100", penwidth="2")
d1.node("Twilio", "Twilio\nWhatsApp")
d1.node("OpenAI", "OpenAI\nAI Assistant")
d1.node("Stripe", "Stripe\nBilling")

# Frontend sub-components
d1.attr("node", shape="box", fillcolor="#E3F2FD", color="#1565C0")
with d1.subgraph(name="cluster_frontend") as c:
    c.attr(label="Frontend (Next.js App Router)", style="dashed", color="#1565C0", bgcolor="#F5FAFF")
    c.node("Marketing", "Marketing Pages\n/ /pricing /blog")
    c.node("AuthPages", "Auth Pages\n/login /register")
    c.node("AppPages", "App Dashboard\n/leads /customers /policies\n/quotes /settings /tasks")
    c.node("Proxy", "Edge Proxy\n(proxy.ts)")

# Backend sub-components
d1.attr("node", shape="box", fillcolor="#E8F5E9", color="#2E7D32")
with d1.subgraph(name="cluster_backend") as c:
    c.attr(label="Backend (FastAPI)", style="dashed", color="#2E7D32", bgcolor="#F5FBF6")
    c.node("AuthAPI", "Auth Routes\n/register /login /me")
    c.node("CRM", "CRM Routes\n/leads /customers /policies")
    c.node("QuotesAPI", "Quotes & Import\n/quotes /import")
    c.node("SettingsAPI", "Agency Settings\n/settings")
    c.node("TasksAPI", "Tasks & Renewals\n/tasks /renewals")
    c.node("AIAPI", "AI & Broadcasts\n/ai /broadcasts")
    c.node("WebhookAPI", "Webhooks\n/webhooks/whatsapp")
    c.node("BillingAPI", "Billing\n/billing (Stripe)")

# Core layer
d1.attr("node", shape="ellipse", fillcolor="#F3E5F5", color="#6A1B9A")
d1.node("JWT", "JWT Security")
d1.node("DI", "Dependency Injection\n(agency_id isolation)")
d1.node("Core", "Core Layer\nConfig · DB · Logging")

# Edges
d1.edge("Marketing", "Proxy", style="dashed")
d1.edge("AuthPages", "Proxy", style="dashed")
d1.edge("AppPages", "Proxy", style="dashed")
d1.edge("Proxy", "AuthAPI", label="API calls", color="#1565C0")
d1.edge("Proxy", "CRM", color="#1565C0")
d1.edge("Proxy", "QuotesAPI", color="#1565C0")
d1.edge("Proxy", "SettingsAPI", color="#1565C0")
d1.edge("Proxy", "TasksAPI", color="#1565C0")
d1.edge("Proxy", "AIAPI", color="#1565C0")
d1.edge("Proxy", "BillingAPI", color="#1565C0")

d1.edge("AuthAPI", "JWT", style="dotted", color="#6A1B9A")
d1.edge("CRM", "DI", style="dotted", color="#6A1B9A")
d1.edge("QuotesAPI", "DI", style="dotted", color="#6A1B9A")
d1.edge("SettingsAPI", "DI", style="dotted", color="#6A1B9A")
d1.edge("TasksAPI", "DI", style="dotted", color="#6A1B9A")
d1.edge("AIAPI", "DI", style="dotted", color="#6A1B9A")
d1.edge("BillingAPI", "DI", style="dotted", color="#6A1B9A")

d1.edge("CRM", "Database", label="CRUD", color="#1976D2")
d1.edge("QuotesAPI", "Database", color="#1976D2")
d1.edge("TasksAPI", "Database", color="#1976D2")
d1.edge("SettingsAPI", "Database", color="#1976D2")
d1.edge("AuthAPI", "Database", color="#1976D2")
d1.edge("BillingAPI", "Database", color="#1976D2")

d1.edge("Scheduler", "Database", label="Daily scan", color="#E65100", style="dashed")
d1.edge("Scheduler", "TasksAPI", label="Create tasks", color="#E65100", style="dashed")

d1.edge("WebhookAPI", "Twilio", label="Incoming", color="#E65100", dir="both")
d1.edge("AIAPI", "OpenAI", label="API", color="#E65100")
d1.edge("BillingAPI", "Stripe", label="Payments", color="#E65100", dir="both")

d1.render(cleanup=True)
print(f"Saved: {OUT_DIR / 'zims_architecture.png'}")

# ========================================================================
# Diagram 2: Core Business Workflow
# ========================================================================
d2 = graphviz.Digraph(
    "ZIMS_Business_Flow",
    filename=str(OUT_DIR / "zims_business_flow"),
    format="png",
    graph_attr={"rankdir": "LR", "bgcolor": "white", "fontname": "Helvetica", "fontsize": "24"},
    node_attr={"fontname": "Helvetica", "shape": "box", "style": "rounded,filled", "fontsize": "12"},
    edge_attr={"fontname": "Helvetica", "fontsize": "10"},
)
d2.attr(label="Zentro-ZIMS Core Business Workflow", labelloc="t")

# Actors
d2.attr("node", shape="actor", fillcolor="#FFF9C4", color="#F57F17", width="0.6", height="0.9")
d2.node("Agent", "Insurance Agent")
d2.node("Admin", "Agency Admin")
d2.node("Customer", "Customer")

# Data entities
d2.attr("node", shape="cylinder", fillcolor="#E3F2FD", color="#1565C0", penwidth="2")
d2.node("Lead", "Lead\n(prospect)")
d2.node("Quote", "Quote\n(pre-policy offer)")
d2.node("Cust", "Customer")
d2.node("Policy", "Policy")
d2.node("Task", "Task\n(renewal/followup)")
d2.node("Doc", "Documents")

# Actions
d2.attr("node", shape="box", fillcolor="#E8F5E9", color="#2E7D32")
d2.node("CreateLead", "Create Lead")
d2.node("ConvertLead", "Convert Lead")
d2.node("CreateQuote", "Create Quote")
d2.node("AcceptQuote", "Accept Quote")
d2.node("CreatePolicy", "Create Policy")
d2.node("ImportBulk", "Bulk Import\n(Excel)")
d2.node("Renewal", "Renewal Detection\n(APScheduler)")
d2.node("Notify", "Send Notification\n(WhatsApp/Email)")
d2.node("AIAssist", "AI Sales Assistant")

# Flow edges
d2.edge("Agent", "CreateLead", color="#555")
d2.edge("CreateLead", "Lead", color="#1565C0")
d2.edge("Lead", "ConvertLead", color="#1565C0")
d2.edge("ConvertLead", "Cust", label="creates", color="#2E7D32")
d2.edge("Lead", "CreateQuote", style="dashed", color="#999")
d2.edge("Cust", "CreateQuote", color="#1565C0")
d2.edge("CreateQuote", "Quote", color="#1565C0")
d2.edge("Quote", "AcceptQuote", color="#1565C0")
d2.edge("AcceptQuote", "Policy", label="auto-create", color="#2E7D32")
d2.edge("Cust", "CreatePolicy", color="#1565C0")
d2.edge("CreatePolicy", "Policy", color="#1565C0")
d2.edge("Policy", "Doc", label="attach", style="dashed", color="#999")
d2.edge("Admin", "ImportBulk", color="#555")
d2.edge("ImportBulk", "Cust", color="#2E7D32")
d2.edge("ImportBulk", "Policy", color="#2E7D32")
d2.edge("Policy", "Renewal", style="dashed", color="#E65100")
d2.edge("Renewal", "Task", label="creates", color="#E65100")
d2.edge("Task", "Notify", style="dashed", color="#E65100")
d2.edge("Agent", "AIAssist", style="dashed", color="#6A1B9A")
d2.edge("AIAssist", "CreateQuote", style="dashed", color="#6A1B9A")
d2.edge("Customer", "Notify", style="dashed", dir="back", color="#E65100")

d2.render(cleanup=True)
print(f"Saved: {OUT_DIR / 'zims_business_flow.png'}")

# ========================================================================
# Diagram 3: Multi-Tenancy & Security Flow
# ========================================================================
d3 = graphviz.Digraph(
    "ZIMS_MultiTenancy",
    filename=str(OUT_DIR / "zims_multitenancy"),
    format="png",
    graph_attr={"rankdir": "TB", "bgcolor": "white", "fontname": "Helvetica", "fontsize": "24"},
    node_attr={"fontname": "Helvetica", "shape": "box", "style": "rounded,filled", "fontsize": "12"},
    edge_attr={"fontname": "Helvetica", "fontsize": "10"},
)
d3.attr(label="Zentro-ZIMS Multi-Tenancy & Request Flow", labelloc="t")

# Client
d3.attr("node", shape="box3d", fillcolor="#FFF9C4", color="#F57F17", penwidth="2")
d3.node("Browser", "Browser / Next.js Client")

# Request flow
d3.attr("node", shape="box", fillcolor="#E3F2FD", color="#1565C0")
d3.node("Req", "HTTP Request\n+ Bearer Token")
d3.node("JWTCheck", "JWT Decode\n(get user_id, role)")
d3.node("GetUser", "Fetch User\nfrom DB")
d3.node("Inject", "Dependency Injection\nget_current_user() + agency_id")
d3.node("RBAC", "RBAC Check\n(admin vs agent)")
d3.node("Filter", "Query Filter\nWHERE agency_id = ?")
d3.node("Response", "JSON Response")

# DB
d3.attr("node", shape="cylinder", fillcolor="#E8F4FD", color="#1976D2", penwidth="2")
d3.node("DB", "SQLite\n(agency_id on every row)")

# Tenants
d3.attr("node", shape="folder", fillcolor="#F3E5F5", color="#6A1B9A", penwidth="2")
with d3.subgraph(name="cluster_t1") as c:
    c.attr(label="Agency A (Tenant 1)", style="dashed", color="#6A1B9A", bgcolor="#FAF5FB")
    c.node("A1", "Admin Alice")
    c.node("A2", "Agent Bob")
    c.node("AData", "Leads · Customers\nPolicies · Tasks")

with d3.subgraph(name="cluster_t2") as c:
    c.attr(label="Agency B (Tenant 2)", style="dashed", color="#6A1B9A", bgcolor="#FAF5FB")
    c.node("B1", "Admin Carol")
    c.node("B2", "Agent Dave")
    c.node("BData", "Leads · Customers\nPolicies · Tasks")

# Edges
d3.edge("Browser", "Req", color="#555")
d3.edge("Req", "JWTCheck", color="#1565C0")
d3.edge("JWTCheck", "GetUser", color="#1565C0")
d3.edge("GetUser", "Inject", color="#1565C0")
d3.edge("Inject", "RBAC", color="#1565C0")
d3.edge("RBAC", "Filter", color="#1565C0")
d3.edge("Filter", "DB", color="#1976D2")
d3.edge("DB", "Response", color="#1976D2")
d3.edge("Response", "Browser", color="#555")

d3.edge("A1", "Browser", style="dashed", color="#6A1B9A")
d3.edge("A2", "Browser", style="dashed", color="#6A1B9A")
d3.edge("B1", "Browser", style="dashed", color="#6A1B9A")
d3.edge("B2", "Browser", style="dashed", color="#6A1B9A")

d3.edge("DB", "AData", style="dotted", color="#6A1B9A", constraint="false")
d3.edge("DB", "BData", style="dotted", color="#6A1B9A", constraint="false")

d3.render(cleanup=True)
print(f"Saved: {OUT_DIR / 'zims_multitenancy.png'}")

print("\nAll diagrams generated successfully in docs/")
