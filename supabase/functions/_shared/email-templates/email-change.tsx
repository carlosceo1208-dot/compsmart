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
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme a alteração de e-mail no CompSmart</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>CompSmart</Text>
        </Section>
        <Heading style={h1}>Confirme a alteração de e-mail</Heading>
        <Text style={text}>
          Foi solicitada a alteração do e-mail da sua conta em <strong>{siteName}</strong> de{' '}
          <Link href={`mailto:${oldEmail}`} style={link}>{oldEmail}</Link>{' '}
          para{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Text style={text}>Clique no botão abaixo para confirmar a alteração:</Text>
        <Button style={button} href={confirmationUrl}>
          Confirmar alteração
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          Se você não solicitou esta alteração, proteja sua conta imediatamente alterando sua senha.
          <br />
          © {new Date().getFullYear()} CompSmart — Remuneração Estratégica com IA.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

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
const link = { color: '#1E2761', textDecoration: 'underline' }
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
