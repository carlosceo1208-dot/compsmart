import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Dim { label: string; score: number }
interface Props {
  nome?: string
  score?: number
  nivel?: string
  dimensoes?: Dim[]
}

const NIVEL_COR: Record<string, string> = {
  Baixo: '#16A34A', Moderado: '#F59E0B', Alto: '#EA580C', Crítico: '#DC2626',
}

const Email = ({ nome, score, nivel, dimensoes = [] }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu indicador inicial NR-1: risco {nivel ?? ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>COMPSMART</Text>
        <Heading style={h1}>{nome ? `Olá, ${nome}` : 'Olá'}</Heading>
        <Text style={text}>Aqui está o indicador inicial do seu diagnóstico NR-1 de riscos psicossociais.</Text>
        <Section style={card}>
          <Text style={label}>Pontuação geral</Text>
          <Text style={big}>{score ?? '—'} / 100</Text>
          <Text style={{ ...pill, backgroundColor: NIVEL_COR[nivel ?? ''] ?? '#2563EB' }}>Risco {nivel ?? '—'}</Text>
        </Section>
        {dimensoes.length > 0 && (
          <Section>
            <Text style={label}>Por dimensão (COPSOQ-III)</Text>
            {dimensoes.map((d) => (
              <Text key={d.label} style={row}>{d.label}: <strong>{d.score}</strong></Text>
            ))}
          </Section>
        )}
        <Hr style={hr} />
        <Text style={small}>
          Este é um indicador inicial, respondido por uma pessoa em nome da empresa. O diagnóstico completo
          (40 perguntas, respondido pelos colaboradores de forma anônima) é o que sustenta o atendimento à NR-1.
        </Text>
        <Button style={button} href="https://www.compsmart.ia.br/contato">Agendar demonstração</Button>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Seu indicador inicial NR-1 | CompSmart',
  displayName: 'Resultado do diagnóstico NR-1',
  previewData: {
    nome: 'Maria', score: 42.5, nivel: 'Moderado',
    dimensoes: [{ label: 'Demandas no Trabalho', score: 58.3 }, { label: 'Saúde e Bem-Estar', score: 37.5 }],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '28px 24px', maxWidth: '560px' }
const brand = { color: '#2563EB', fontWeight: 700, letterSpacing: '1px', fontSize: '13px' }
const h1 = { color: '#0F172A', fontSize: '22px', margin: '8px 0 12px' }
const text = { color: '#0F172A', fontSize: '15px', lineHeight: '22px' }
const card = { backgroundColor: '#F8FAFC', borderRadius: '16px', padding: '20px', margin: '16px 0' }
const label = { color: '#64748B', fontSize: '13px', margin: '0 0 4px' }
const big = { color: '#0F172A', fontSize: '28px', fontWeight: 700, margin: '0 0 8px' }
const pill = { display: 'inline-block', color: '#ffffff', borderRadius: '999px', padding: '4px 12px', fontSize: '13px', fontWeight: 600, margin: 0 }
const row = { color: '#0F172A', fontSize: '14px', margin: '4px 0' }
const hr = { borderColor: '#E2E8F0', margin: '20px 0' }
const small = { color: '#64748B', fontSize: '13px', lineHeight: '20px' }
const button = { backgroundColor: '#2563EB', color: '#ffffff', borderRadius: '10px', padding: '12px 20px', fontSize: '14px', fontWeight: 600, marginTop: '12px' }
