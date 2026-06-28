import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useRabitContext } from '@rabit/react';

export function GoogleLoginButton() {
  const { core } = useRabitContext();
  const [error, setError] = useState<string | null>(null);
  const [recoveryShare, setRecoveryShare] = useState<string | null>(null);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          setError(null);
          if (!credentialResponse.credential) {
            setError('No credential returned from Google');
            return;
          }
          try {
            const res = await core.authenticateOAuth('google', credentialResponse.credential);
            if (res.isNewUser && res.recoveryShare) {
              setRecoveryShare(JSON.stringify(res.recoveryShare));
            }
          } catch (e) {
            const msg = e instanceof Error ? `${e.name}: ${e.message}` : 'Google sign-in failed';
            console.error('Google sign-in failure', e);
            setError(msg);
          }
        }}
        onError={() => setError('Google sign-in failed')}
      />
      {error && <div style={{ color: '#c00', fontSize: 13 }}>{error}</div>}
      {recoveryShare && (
        <div
          style={{
            background: '#fff6e5',
            border: '1px solid #f0c96b',
            padding: 12,
            borderRadius: 8,
            fontSize: 12,
          }}
        >
          <strong>⚠ Back up this recovery share</strong>
          <p style={{ margin: '4px 0' }}>
            Save it somewhere safe. If you lose your device share, this is the only way to recover the wallet.
          </p>
          <textarea
            readOnly
            value={recoveryShare}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: 11, minHeight: 80 }}
          />
        </div>
      )}
    </div>
  );
}
