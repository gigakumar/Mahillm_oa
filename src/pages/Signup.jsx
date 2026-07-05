import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, Mail, Phone, ArrowLeft, CheckCircle2, Lock, User, Smartphone } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../firebase';
import './Login.css';

export default function Signup() {
  const { signup, verifyEmail, loginWithGoogle } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Signup Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Verification Step Handling
  // Steps: 'form' | 'verify-choice' | 'email-sent' | 'phone-input' | 'phone-otp'
  const [step, setStep] = useState('form');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [timer, setTimer] = useState(0);
  const [verifyStatus, setVerifyStatus] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [simulatedOtpCode, setSimulatedOtpCode] = useState('');
  const [useSimulatedOtp, setUseSimulatedOtp] = useState(true);
  const [copied, setCopied] = useState(false);

  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const recaptchaVerifierRef = useRef(null);

  // Timer effect
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Clean up recaptcha verifier on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signup(email, password, name);
      setStep('verify-choice');
    } catch (err) {
      setError(
        err.code === 'auth/email-already-in-use'
          ? 'That email is already registered. Try logging in.'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  // Choice 1: Email Verification Link
  const handleSendEmailVerification = async () => {
    setError('');
    setLoading(true);
    try {
      await verifyEmail();
      setStep('email-sent');
      setTimer(60);
      setVerifyStatus('Verification email sent! Check your inbox.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check email verification status manually
  const checkEmailVerification = async () => {
    setError('');
    setVerifyStatus('Checking status...');
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          setVerifyStatus('Success! Email verified.');
          setTimeout(() => navigate('/'), 1500);
        } else {
          setError('Email is not verified yet. Please check your inbox and click the verification link.');
          setVerifyStatus('');
        }
      }
    } catch (err) {
      setError(err.message);
      setVerifyStatus('');
    }
  };

  // Choice 2: Setup Phone Recaptcha and Send OTP
  const setupRecaptcha = () => {
    if (recaptchaVerifierRef.current) return;
    try {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {},
      });
    } catch (err) {
      console.error('Recaptcha error:', err);
    }
  };

  const validatePhoneNumber = (val) => {
    if (!val) {
      return 'Phone number is required.';
    }
    if (!val.startsWith('+')) {
      return "Phone number must start with '+' and include country code (e.g. +91, +1).";
    }
    const cleanNumber = val.replace(/[\s-]/g, '');
    if (!/^\+[0-9]+$/.test(cleanNumber)) {
      return "Phone number can only contain digits, spaces, and dashes after the '+' prefix.";
    }
    const digitCount = cleanNumber.length - 1; // subtract 1 for '+'
    if (digitCount < 7) {
      return `Phone number is too short (${digitCount} digits). It should be at least 7 digits.`;
    }
    if (digitCount > 15) {
      return `Phone number is too long (${digitCount} digits). It should be at most 15 digits.`;
    }
    return '';
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setPhone(val);
    setPhoneError(validatePhoneNumber(val));
  };

  const handlePhoneBlur = () => {
    setPhoneError(validatePhoneNumber(phone));
  };

  const handleSendSms = async (e) => {
    if (e) e.preventDefault();
    const validationError = validatePhoneNumber(phone);
    if (validationError) {
      setPhoneError(validationError);
      setError('Please correct the phone number error before requesting a code.');
      return;
    }
    setPhoneError('');
    setError('');
    setLoading(true);

    if (useSimulatedOtp) {
      try {
        const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
        setSimulatedOtpCode(randomCode);
        setDemoMode(true);
        setStep('phone-otp');
        setTimer(60);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        setupRecaptcha();
        const verifier = recaptchaVerifierRef.current;
        const confirmation = await signInWithPhoneNumber(auth, phone, verifier);
        setConfirmationResult(confirmation);
        setStep('phone-otp');
        setTimer(60);
        setDemoMode(false);
      } catch (err) {
        console.warn('Firebase SMS OTP failed:', err);
        setError('Phone verification failed: ' + (err.message || 'Firebase error') + '. Switching to Simulated OTP mode...');
        setUseSimulatedOtp(true);
        const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
        setSimulatedOtpCode(randomCode);
        setDemoMode(true);
        setStep('phone-otp');
        setTimer(60);
      } finally {
        setLoading(false);
      }
    }
  };

  // OTP Focus Auto-move and Input logic
  const handleOtpChange = (val, index) => {
    if (isNaN(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Focus next box if filled
    if (val !== '' && index < 5) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (demoMode) {
        if (code === simulatedOtpCode) {
          setVerifyStatus('Success! Account verified (Simulated Mode).');
          setTimeout(() => navigate('/'), 1500);
        } else {
          setError('Incorrect verification code. Please check the code in the SMS Simulator card above.');
        }
      } else {
        await confirmationResult.confirm(code);
        setVerifyStatus('Success! Phone number verified.');
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (err) {
      setError(err.message === 'Firebase: Error (auth/invalid-verification-code).' ? 'Invalid verification code. Please try again.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <button className="theme-toggle-floating" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="auth-left">
        <div className="auth-branding">
          <div className="auth-logo">🔧</div>
          <h1>MechPrep</h1>
          <p>Join thousands of mechanical engineering students preparing smarter for placements.</p>
        </div>
        <div className="auth-decoration">
          <div className="deco-circle deco-1"></div>
          <div className="deco-circle deco-2"></div>
          <div className="deco-circle deco-3"></div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          {/* STEP 1: SIGNUP FORM */}
          {step === 'form' && (
            <>
              <h2>Create your account 🚀</h2>
              <p className="auth-subtitle">Start your placement prep journey</p>

              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="signup-name">Full Name</label>
                  <input
                    id="signup-name"
                    className="input-field"
                    type="text"
                    placeholder="Harshit Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="signup-email">Email</label>
                  <input
                    id="signup-email"
                    className="input-field"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="signup-password">Password</label>
                  <input
                    id="signup-password"
                    className="input-field"
                    type="password"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={loading}>
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <button className="btn btn-ghost btn-lg google-btn" onClick={handleGoogle} type="button">
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </button>

              <p className="auth-footer">
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </>
          )}

          {/* STEP 2: VERIFICATION METHOD CHOICE */}
          {step === 'verify-choice' && (
            <div className="verify-container">
              <h2>Verify your Account 🛡️</h2>
              <p className="auth-subtitle">Choose verification method to secure your account</p>

              <div className="verify-card" onClick={handleSendEmailVerification}>
                <div className="icon-wrapper">
                  <Mail size={24} />
                </div>
                <h3>Verify via Email</h3>
                <p>We will send a verification link to your registered email address.</p>
              </div>

              <div className="verify-card" onClick={() => setStep('phone-input')}>
                <div className="icon-wrapper">
                  <Smartphone size={24} />
                </div>
                <h3>Verify via Phone OTP</h3>
                <p>Verify your phone number with a 6-digit SMS verification code.</p>
              </div>

              <button className="btn-back-link" onClick={() => setStep('form')}>
                <ArrowLeft size={16} /> Back to Sign Up
              </button>
            </div>
          )}

          {/* STEP 3: EMAIL VERIFICATION SENT */}
          {step === 'email-sent' && (
            <div className="verify-container" style={{ textAlign: 'center' }}>
              <h2>Verify your email ✉️</h2>
              <p className="auth-subtitle">We sent a verification link to <strong>{email}</strong></p>

              {error && <div className="auth-error">{error}</div>}
              {verifyStatus && <div className="verify-status success">{verifyStatus}</div>}

              <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={checkEmailVerification} disabled={loading}>
                I've Clicked the Verification Link
              </button>

              {timer > 0 ? (
                <p className="timer-text">Resend email in <span>{timer}s</span></p>
              ) : (
                <button className="btn btn-ghost btn-md" style={{ width: '100%', marginTop: '0.5rem' }} onClick={handleSendEmailVerification} disabled={loading}>
                  Resend Verification Email
                </button>
              )}

              <button className="btn-back-link" onClick={() => setStep('verify-choice')}>
                <ArrowLeft size={16} /> Change Verification Method
              </button>
            </div>
          )}

          {/* STEP 4: PHONE NUMBER INPUT */}
          {step === 'phone-input' && (
            <div className="verify-container">
              <h2>Phone Verification 📱</h2>
              <p className="auth-subtitle">Enter your phone number to receive an SMS code</p>

              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleSendSms} className="auth-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="phone-number">Phone Number</label>
                  <input
                    id="phone-number"
                    className={`input-field ${phoneError ? 'input-error' : ''}`}
                    type="tel"
                    placeholder="+919876543210"
                    value={phone}
                    onChange={handlePhoneChange}
                    onBlur={handlePhoneBlur}
                    required
                  />
                  {phoneError && (
                    <div className="input-feedback-error">
                      <span>⚠️</span> {phoneError}
                    </div>
                  )}
                </div>

                <div 
                  className="simulation-toggle-container"
                  onClick={() => setUseSimulatedOtp(prev => !prev)}
                >
                  <input
                    type="checkbox"
                    id="use-simulation-checkbox"
                    checked={useSimulatedOtp}
                    onChange={() => {}} // handled by click on parent div
                  />
                  <label htmlFor="use-simulation-checkbox" className="simulation-toggle-label">
                    Simulate SMS Delivery (Manual OTP)
                  </label>
                </div>

                <div id="recaptcha-container"></div>
                <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={loading}>
                  {loading ? 'Sending SMS...' : 'Send SMS Verification Code'}
                </button>
              </form>

              <button className="btn-back-link" onClick={() => setStep('verify-choice')}>
                <ArrowLeft size={16} /> Change Verification Method
              </button>
            </div>
          )}

          {/* STEP 5: ENTER PHONE OTP */}
          {step === 'phone-otp' && (
            <div className="verify-container" style={{ textAlign: 'center' }}>
              <h2>Enter Code 🔑</h2>
              <p className="auth-subtitle">We sent a 6-digit verification code to <strong>{phone}</strong></p>

              {error && <div className="auth-error">{error}</div>}
              {verifyStatus && <div className="verify-status success">{verifyStatus}</div>}

              {demoMode && simulatedOtpCode && (
                <div className="simulated-sms-card">
                  <div className="simulated-sms-header">
                    <span className="simulated-sms-title">📩 SMS Simulator</span>
                    <span className="simulated-sms-time">Just now</span>
                  </div>
                  <p className="simulated-sms-body">
                    MechPrep: Your verification code is <strong>{simulatedOtpCode}</strong>.
                  </p>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm copy-otp-btn"
                    style={{ width: 'auto', display: 'inline-flex', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(simulatedOtpCode);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch (err) {
                        console.warn("Failed to copy code to clipboard: ", err);
                      }
                    }}
                  >
                    {copied ? 'Copied! ✓' : 'Copy Code'}
                  </button>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="auth-form">
                <div className="otp-inputs-wrapper">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={otpRefs[idx]}
                      className="otp-input-box"
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      required
                    />
                  ))}
                </div>

                <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </form>

              {timer > 0 ? (
                <p className="timer-text" style={{ marginTop: '1rem' }}>Resend code in <span>{timer}s</span></p>
              ) : (
                <button className="btn btn-ghost btn-md" style={{ width: '100%', marginTop: '1rem' }} onClick={handleSendSms} disabled={loading}>
                  Resend SMS Code
                </button>
              )}

              <button className="btn-back-link" onClick={() => setStep('phone-input')}>
                <ArrowLeft size={16} /> Change Phone Number
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
