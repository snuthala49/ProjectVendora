/**
 * React Email template — used for:
 *   • type: "alert"        → outage notification
 *   • type: "confirmation" → subscription confirmation
 */

import type { CSSProperties } from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Row,
  Column,
  Heading,
  Text,
  Link,
  Hr,
} from "@react-email/components";

// ─── Props ───────────────────────────────────────────────────────────────────

interface BaseProps {
  type: "alert" | "confirmation";
  unsubscribeUrl: string;
}

interface AlertProps extends BaseProps {
  type: "alert";
  vendorName: string;
  vendorEmoji: string;
  outageTitle: string;
  severity: string;
  status: string;
  description?: string | null;
  startedAt: string; // ISO-8601
  statusPageUrl?: string | null;
}

interface ConfirmationProps extends BaseProps {
  type: "confirmation";
  email: string;
  confirmUrl: string;
}

export type OutageAlertEmailProps = AlertProps | ConfirmationProps;

// ─── Severity colours ────────────────────────────────────────────────────────

const SEV_COLOR: Record<string, string> = {
  CRITICAL: "#dc2626",
  HIGH: "#ea580c",
  MEDIUM: "#d97706",
  LOW: "#16a34a",
  UNKNOWN: "#6b7280",
};

const SEV_BG: Record<string, string> = {
  CRITICAL: "#fef2f2",
  HIGH: "#fff7ed",
  MEDIUM: "#fffbeb",
  LOW: "#f0fdf4",
  UNKNOWN: "#f9fafb",
};

// ─── Shared styles ───────────────────────────────────────────────────────────

const styles = {
  body: {
    backgroundColor: "#f1f5f9",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0,
    padding: "24px 0",
  },
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    overflow: "hidden" as const,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  header: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
    padding: "24px 32px",
    borderBottom: "3px solid #3b82f6",
  },
  logo: {
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: 700,
    margin: "0 0 4px 0",
  } as React.CSSProperties,
  logoSub: {
    color: "#94a3b8",
    fontSize: "11px",
    margin: 0,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
  },
  content: { padding: "32px" },
  h2: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 6px 0",
  } as CSSProperties,
  h3: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#1e293b",
    margin: "4px 0 20px 0",
    lineHeight: "1.5",
  } as CSSProperties,
  label: {
    fontSize: "10px",
    fontWeight: 700,
    color: "#94a3b8",
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    margin: "0 0 4px 0",
  },
  text: {
    fontSize: "14px",
    color: "#475569",
    lineHeight: "1.6",
    margin: "0 0 16px 0",
  },
  smallText: {
    fontSize: "12px",
    color: "#94a3b8",
    lineHeight: "1.5",
    margin: "16px 0 0 0",
  },
  button: {
    display: "inline-block",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    padding: "12px 28px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "14px",
  } as CSSProperties,
  buttonDark: {
    display: "inline-block" as const,
    backgroundColor: "#1e293b",
    color: "#ffffff",
    padding: "11px 24px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "14px",
    border: "1px solid #334155",
  },
  hr: { borderColor: "#e2e8f0", margin: "0" },
  footer: { padding: "16px 32px", backgroundColor: "#f8fafc" },
  footerText: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: 0,
    textAlign: "center" as const,
  },
  link: { color: "#3b82f6", textDecoration: "underline" },
} as const;

// ─── Component ───────────────────────────────────────────────────────────────

export function OutageAlertEmail(props: OutageAlertEmailProps) {
  if (props.type === "confirmation") {
    const { email, confirmUrl, unsubscribeUrl } = props;
    return (
      <Html>
        <Head />
        <Preview>Confirm your Vendora outage alert subscription</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            {/* Header */}
            <Section style={styles.header}>
              <Text style={styles.logo}>🔔 Vendora</Text>
              <Text style={styles.logoSub}>IT Outage Intelligence</Text>
            </Section>

            {/* Body */}
            <Section style={styles.content}>
              <Heading style={styles.h2}>Confirm Your Subscription</Heading>
              <Text style={styles.text}>
                Hi! You asked to receive real-time outage alerts for enterprise
                IT vendors at <strong>{email}</strong>.
              </Text>
              <Text style={styles.text}>
                Click the button below to activate your alerts:
              </Text>
              <Section style={{ textAlign: "center", margin: "28px 0" }}>
                <Link href={confirmUrl} style={styles.button}>
                  ✅&nbsp; Confirm Subscription
                </Link>
              </Section>
              <Text style={styles.smallText}>
                If you didn&apos;t request this, you can safely ignore this
                email.
              </Text>
            </Section>

            <Hr style={styles.hr} />
            <Section style={styles.footer}>
              <Text style={styles.footerText}>
                <Link href={unsubscribeUrl} style={styles.link}>
                  Unsubscribe
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    );
  }

  // ── Alert email ────────────────────────────────────────────────────────────
  const {
    vendorName,
    vendorEmoji,
    outageTitle,
    severity,
    status,
    description,
    startedAt,
    statusPageUrl,
    unsubscribeUrl,
  } = props;

  const sevColor = SEV_COLOR[severity] ?? SEV_COLOR.UNKNOWN;
  const sevBg = SEV_BG[severity] ?? SEV_BG.UNKNOWN;

  const formattedDate = (() => {
    try {
      return new Date(startedAt).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      });
    } catch {
      return startedAt;
    }
  })();

  return (
    <Html>
      <Head />
      <Preview>
        🚨 {severity} outage detected — {vendorName}: {outageTitle}
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section
            style={{ ...styles.header, borderBottomColor: sevColor }}
          >
            <Text style={styles.logo}>🔔 Vendora</Text>
            <Text style={styles.logoSub}>IT Outage Intelligence</Text>
          </Section>

          {/* Severity banner */}
          <Section
            style={{
              backgroundColor: sevColor,
              padding: "8px 32px",
            }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              ⚠️&nbsp; {severity} severity incident detected
            </Text>
          </Section>

          {/* Content */}
          <Section style={styles.content}>
            <Heading style={{ ...styles.h2 }}>
              {vendorEmoji}&nbsp; {vendorName}
            </Heading>
            <Heading style={styles.h3}>{outageTitle}</Heading>

            {/* Severity + Status row */}
            <Row style={{ marginBottom: "20px" }}>
              <Column style={{ width: "50%", paddingRight: "12px" }}>
                <Text style={styles.label}>Severity</Text>
                <Text
                  style={{
                    display: "inline-block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: sevColor,
                    backgroundColor: sevBg,
                    border: `1px solid ${sevColor}`,
                    padding: "3px 10px",
                    borderRadius: "4px",
                    margin: 0,
                  }}
                >
                  {severity}
                </Text>
              </Column>
              <Column style={{ width: "50%" }}>
                <Text style={styles.label}>Status</Text>
                <Text
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  {status}
                </Text>
              </Column>
            </Row>

            {/* Description */}
            {description && (
              <>
                <Text style={styles.label}>Details</Text>
                <Text style={styles.text}>{description}</Text>
              </>
            )}

            {/* Started */}
            <Text style={styles.label}>Detected at</Text>
            <Text style={{ ...styles.text, marginBottom: "24px" }}>
              {formattedDate}
            </Text>

            {/* CTA */}
            {statusPageUrl && (
              <Section style={{ textAlign: "center", margin: "4px 0 8px" }}>
                <Link href={statusPageUrl} style={styles.buttonDark}>
                  🔗&nbsp; View Status Page
                </Link>
              </Section>
            )}
          </Section>

          <Hr style={styles.hr} />
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              You&apos;re receiving this because you subscribed to Vendora
              alerts.&nbsp;
              <Link href={unsubscribeUrl} style={styles.link}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default OutageAlertEmail;
