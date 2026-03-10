import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Hr,
  Preview,
} from '@react-email/components';

interface SongDeliveryEmailProps {
  recipientName: string;
  songUrl: string;
  lyricsPreview: string;
}

export function SongDeliveryEmail({
  recipientName,
  songUrl,
  lyricsPreview,
}: SongDeliveryEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{recipientName}&apos;s birthday song is ready — press play 🎵</Preview>
      <Body style={{ backgroundColor: '#FFFAF5', fontFamily: 'Inter, Arial, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '48px 24px' }}>
          <Heading
            style={{
              color: '#1C1410',
              fontSize: '28px',
              fontWeight: '600',
              marginBottom: '8px',
              lineHeight: '1.2',
            }}
          >
            🎵 {recipientName}&apos;s song is ready.
          </Heading>

          <Text
            style={{ color: '#9C8070', fontSize: '15px', lineHeight: '1.6', marginBottom: '28px' }}
          >
            We wrote something just for them. Hit play and send it their way.
          </Text>

          <Button
            href={songUrl}
            style={{
              backgroundColor: '#FF6B6B',
              color: '#ffffff',
              padding: '14px 28px',
              borderRadius: '999px',
              fontSize: '15px',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Listen to {recipientName}&apos;s song →
          </Button>

          <Hr style={{ borderColor: '#E8DED6', margin: '36px 0' }} />

          <Text
            style={{
              color: '#9C8070',
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            Lyrics preview
          </Text>
          <Text
            style={{
              color: '#1C1410',
              fontSize: '14px',
              whiteSpace: 'pre-wrap',
              fontStyle: 'italic',
              lineHeight: '1.8',
            }}
          >
            {lyricsPreview}
          </Text>

          <Hr style={{ borderColor: '#E8DED6', margin: '36px 0' }} />

          <Text style={{ color: '#9C8070', fontSize: '12px', lineHeight: '1.6' }}>
            Your song page lives at that link forever — share it, text it, play it at the party.
            Made with love by{' '}
            <a href="https://songfor.gift" style={{ color: '#FF6B6B' }}>
              songfor.me
            </a>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
