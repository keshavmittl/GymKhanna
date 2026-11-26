import { useState } from 'react';
import { ArrowRight, Dumbbell, Eye, EyeOff } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, signup, isAuthenticated, loading } = useAuth();

  if (loading) return <p className="screen-status" role="status">Opening GymKhanna…</p>;
  if (isAuthenticated) return <Navigate to="/" replace />;

  async function submit(event) {
    event.preventDefault();
    setError('');
    const fields = new FormData(event.currentTarget);
    const email = fields.get('email');
    const password = fields.get('password');

    if (isSignup && password !== fields.get('confirmPassword')) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      if (isSignup) await signup({ name: fields.get('name').trim(), email, password });
      else await login({ email, password });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not continue. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-main">
        <div className="auth-inner">
          <div className="brand auth-brand">
            <span className="brand-mark"><Dumbbell size={20} aria-hidden="true" /></span>GymKhanna
          </div>
          <header>
            <h1>{isSignup ? 'Create your account' : 'Log in'}</h1>
            <p className="muted">{isSignup ? 'Start your training journal.' : 'Open your training journal.'}</p>
          </header>
          <form className="stack" onSubmit={submit}>
            {isSignup && <label className="field">Name<input name="name" autoComplete="name" required /></label>}
            <label className="field">Email<input type="email" name="email" autoComplete="email" required /></label>
            <div className="field">
              <label htmlFor="auth-password">Password</label>
              <div className="password-field">
                <input id="auth-password" type={showPassword ? 'text' : 'password'} name="password"
                  autoComplete={isSignup ? 'new-password' : 'current-password'} required />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} className="icon-button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </div>
            {isSignup && (
              <label className="field">Confirm password
                <input type={showPassword ? 'text' : 'password'} name="confirmPassword" autoComplete="new-password" required />
              </label>
            )}
            {error && <p className="notice error" role="alert">{error}</p>}
            <button className="button primary auth-submit" disabled={submitting}>
              {submitting ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>
          <div className="auth-switch">
            <span className="muted">{isSignup ? 'Already have an account?' : 'New to GymKhanna?'}</span>
            <button className="text-button" type="button" disabled={submitting} onClick={() => { setIsSignup(!isSignup); setError(''); }}>
              {isSignup ? 'Log in' : 'Create an account'}
            </button>
          </div>
        </div>
      </div>
      <div className="auth-photo" aria-hidden="true" />
    </main>
  );
}
