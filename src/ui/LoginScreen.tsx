import { useState } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  signInEmail,
  signUpEmail,
  signInGoogle,
  signInApple,
  logOut,
  linkAnonymousToEmail,
} from '@/services/authService'
import { COLORS } from '@/core/constants'
import { audioManager } from '@/core/AudioManager'

interface LoginScreenProps {
  onClose: () => void
}

type Mode = 'menu' | 'email-login' | 'email-signup' | 'link-email'

export function LoginScreen({ onClose }: LoginScreenProps) {
  const user = useAuthStore((s) => s.user)
  const [mode, setMode] = useState<Mode>('menu')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const isAnonymous = user?.isAnonymous ?? false
  const displayEmail = user?.email ?? null

  const clearForm = () => {
    setEmail('')
    setPassword('')
    setError(null)
    setSuccess(null)
  }

  const handleAction = async (action: () => Promise<void>, successMsg: string) => {
    setError(null)
    setLoading(true)
    try {
      await action()
      setSuccess(successMsg)
      clearForm()
      setTimeout(onClose, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLogin = () =>
    handleAction(() => signInEmail(email, password).then(() => {}), 'Signed in!')

  const handleEmailSignup = () =>
    handleAction(() => signUpEmail(email, password).then(() => {}), 'Account created!')

  const handleLinkEmail = () =>
    handleAction(() => linkAnonymousToEmail(email, password).then(() => {}), 'Account linked!')

  const handleGoogle = () =>
    handleAction(() => signInGoogle().then(() => {}), 'Signed in with Google!')

  const handleApple = () =>
    handleAction(() => signInApple().then(() => {}), 'Signed in with Apple!')

  const handleLogout = () =>
    handleAction(() => logOut(), 'Signed out!')

  const btnStyle = (bg: string, color: string): React.CSSProperties => ({
    padding: '0.8rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: '14px',
    background: bg,
    color,
    border: 'none',
    cursor: loading ? 'default' : 'pointer',
    minHeight: '48px',
    width: '100%',
    maxWidth: '300px',
    opacity: loading ? 0.5 : 1,
    transition: 'transform 0.15s',
  })

  const inputStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.08)',
    color: COLORS.white,
    border: '2px solid rgba(255,255,255,0.15)',
    outline: 'none',
    width: '100%',
    maxWidth: '300px',
    minHeight: '48px',
  }

  return (
    <div
      role="dialog"
      aria-label="Account"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 250,
        pointerEvents: 'auto',
        padding: '1rem',
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem 1.5rem',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
        border: '2px solid rgba(255,255,255,0.1)',
        maxWidth: '400px',
        width: '100%',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Close button */}
        <button
          onClick={() => { audioManager.play('click'); onClose() }}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '0.8rem',
            right: '0.8rem',
            fontSize: '1.3rem',
            background: 'none',
            border: 'none',
            color: COLORS.white,
            opacity: 0.5,
            cursor: 'pointer',
            minHeight: '44px',
            minWidth: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          &#x2715;
        </button>

        {/* Header */}
        <h2 style={{
          fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
          fontWeight: 700,
          background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem',
          textAlign: 'center',
        }}>
          Account
        </h2>

        {/* Current status */}
        <div style={{
          fontSize: '0.85rem',
          color: 'rgba(255,255,255,0.5)',
          marginBottom: '1.5rem',
          textAlign: 'center',
        }}>
          {displayEmail
            ? `Signed in as ${displayEmail}`
            : isAnonymous
              ? 'Playing as Guest'
              : 'Not signed in'}
        </div>

        {/* Success/Error messages */}
        {success && (
          <div style={{
            padding: '0.6rem 1rem',
            borderRadius: '10px',
            background: 'rgba(46,204,113,0.15)',
            color: '#2ECC71',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: '1rem',
            textAlign: 'center',
            width: '100%',
            maxWidth: '300px',
          }}>
            {success}
          </div>
        )}
        {error && (
          <div style={{
            padding: '0.6rem 1rem',
            borderRadius: '10px',
            background: 'rgba(231,76,60,0.15)',
            color: '#E74C3C',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: '1rem',
            textAlign: 'center',
            width: '100%',
            maxWidth: '300px',
          }}>
            {error}
          </div>
        )}

        {/* ── Main menu ── */}
        {mode === 'menu' && !success && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.8rem',
            width: '100%',
          }}>
            {/* If anonymous, show upgrade options */}
            {isAnonymous && (
              <>
                <div style={{
                  fontSize: '0.8rem',
                  color: 'rgba(255,255,255,0.4)',
                  marginBottom: '0.3rem',
                  textAlign: 'center',
                }}>
                  Save your progress by linking an account
                </div>

                <button
                  onClick={handleGoogle}
                  disabled={loading}
                  style={btnStyle('#4285F4', '#fff')}
                >
                  Continue with Google
                </button>

                <button
                  onClick={handleApple}
                  disabled={loading}
                  style={btnStyle('#000', '#fff')}
                >
                  Continue with Apple
                </button>

                <button
                  onClick={() => { clearForm(); setMode('link-email') }}
                  disabled={loading}
                  style={btnStyle('rgba(255,255,255,0.1)', COLORS.white)}
                >
                  Link Email &amp; Password
                </button>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  maxWidth: '300px',
                  margin: '0.3rem 0',
                }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>or</span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                </div>

                <button
                  onClick={() => { clearForm(); setMode('email-login') }}
                  disabled={loading}
                  style={btnStyle('transparent', COLORS.accent)}
                >
                  Sign in to existing account
                </button>
              </>
            )}

            {/* If already signed in with real account */}
            {!isAnonymous && displayEmail && (
              <button
                onClick={handleLogout}
                disabled={loading}
                style={btnStyle('rgba(231,76,60,0.2)', '#E74C3C')}
              >
                Sign Out
              </button>
            )}
          </div>
        )}

        {/* ── Email login form ── */}
        {mode === 'email-login' && !success && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.8rem',
            width: '100%',
          }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              autoComplete="current-password"
            />
            <button
              onClick={handleEmailLogin}
              disabled={loading || !email || !password}
              style={btnStyle(`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, COLORS.dark)}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <button
              onClick={() => { clearForm(); setMode('email-signup') }}
              style={{ ...btnStyle('transparent', 'rgba(255,255,255,0.5)'), fontSize: '0.85rem' }}
            >
              Create new account instead
            </button>
            <button
              onClick={() => { clearForm(); setMode('menu') }}
              style={{ ...btnStyle('transparent', 'rgba(255,255,255,0.3)'), fontSize: '0.8rem' }}
            >
              Back
            </button>
          </div>
        )}

        {/* ── Email signup form ── */}
        {mode === 'email-signup' && !success && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.8rem',
            width: '100%',
          }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Password (6+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              autoComplete="new-password"
            />
            <button
              onClick={handleEmailSignup}
              disabled={loading || !email || password.length < 6}
              style={btnStyle(`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, COLORS.dark)}
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
            <button
              onClick={() => { clearForm(); setMode('menu') }}
              style={{ ...btnStyle('transparent', 'rgba(255,255,255,0.3)'), fontSize: '0.8rem' }}
            >
              Back
            </button>
          </div>
        )}

        {/* ── Link email form (upgrade anonymous) ── */}
        {mode === 'link-email' && !success && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.8rem',
            width: '100%',
          }}>
            <div style={{
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.4)',
              textAlign: 'center',
              maxWidth: '280px',
              marginBottom: '0.3rem',
            }}>
              Your guest progress will be saved to this account
            </div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Password (6+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              autoComplete="new-password"
            />
            <button
              onClick={handleLinkEmail}
              disabled={loading || !email || password.length < 6}
              style={btnStyle(`linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, COLORS.dark)}
            >
              {loading ? 'Linking...' : 'Link Account'}
            </button>
            <button
              onClick={() => { clearForm(); setMode('menu') }}
              style={{ ...btnStyle('transparent', 'rgba(255,255,255,0.3)'), fontSize: '0.8rem' }}
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
