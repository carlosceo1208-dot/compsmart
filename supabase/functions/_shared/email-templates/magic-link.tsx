/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu link de acesso ao CompSmart</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>CompSmart</Text>
        </Section>
        <Heading style={h1}>Seu link de acesso</Heading>
        <Text style={text}>
          Clique no botão abaixo para entrar em <strong>{siteName}</strong>. Este link é único e
          expira em alguns minutos.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Acessar plataforma
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          Se você não solicitou este acesso, pode ignorar este e-mail com segurança.
          <br />
          © {new Date().getFullYear()} CompSmart — Remuneração Estratégica com IA.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px', margin: '0 auto' }
const brandBar = {
  background: 'linear-gradient(135deg, #1E2761 0%, #22C55E 100%)',
  borderRadius: '8px',
  padding: '14px 18px',
  marginBottom: '24px',
}
const brandText = { color: '#ffffff', fontSize: '18px', fontWeight: 'bold' as const, margin: 0 }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1E2761', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 18px' }
const button = {
  backgroundColor: '#1E2761',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  borderRadius: '8px',
  padding: '12px 24px',
  textDecoration: 'none',
  display: 'inline-block',
}
const hr = { borderColor: '#e2e8f0', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: '1.5' }
