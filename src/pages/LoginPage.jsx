import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCaptcha } from '../services/authService';
import toast from 'react-hot-toast';
import {
  MdEmail,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdCheckCircle,
  MdStorefront,
  MdSecurity,
  MdRefresh,
  MdWarningAmber,
  MdLockClock,
} from 'react-icons/md';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  // Security & CAPTCHA states
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [lockoutInfo, setLockoutInfo] = useState(null);

  const fetchCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const { data } = await getCaptcha();
      if (data.success) {
        setCaptchaSvg(data.captchaSvg);
        setCaptchaToken(data.captchaToken);
        setCaptchaAnswer('');
      }
    } catch {
      toast.error('Failed to load CAPTCHA challenge');
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      return toast.error('Please enter both email and password');
    }

    if (lockoutInfo?.isLocked) {
      return toast.error(`Account is locked. Please wait ${lockoutInfo.remainingMinutes}m.`);
    }

    if (!captchaAnswer.trim()) {
      return toast.error('Please enter the security verification code');
    }

    setLoading(true);
    try {
      await login({
        email: form.email,
        password: form.password,
        captchaToken,
        captchaAnswer: captchaAnswer.trim(),
      });
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;

      if (data?.isLocked) {
        setLockoutInfo({
          isLocked: true,
          remainingMinutes: data.remainingMinutes || 15,
        });
        setAttemptsRemaining(0);
      } else if (data?.attemptsRemaining !== undefined) {
        setAttemptsRemaining(data.attemptsRemaining);
      }

      if (data?.requiresCaptchaRefresh) {
        fetchCaptcha();
      }

      toast.error(data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Ambient Animated Aurora Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-[30%] w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Main Glass Card */}
      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
        
        {/* Left Side: Artistic Brand Showcase */}
        <div className="lg:col-span-6 p-8 sm:p-12 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-transparent relative flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 overflow-hidden">
          {/* Abstract Geometric Decorative Art */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-blue-500/20 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-indigo-500/10 pointer-events-none" />

          <div>
            {/* Brand Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <MdStorefront size={26} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">AB TRADERS</h2>
                <p className="text-xs text-blue-400 font-medium">Enterprise POS & E-Invoicing</p>
              </div>
            </div>

            {/* Artistic Slogan */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
              Modern Commerce, <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400">
                Seamless Precision.
              </span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Empowering businesses with real-time ZATCA Phase 2 compliance, intelligent inventory control, and lightning-fast POS billing.
            </p>
          </div>

          {/* Feature Badges */}
          <div className="space-y-3 pt-6 border-t border-white/10">
            <div className="flex items-center gap-3 text-slate-300 text-xs font-medium">
              <MdCheckCircle className="text-emerald-400 shrink-0" size={18} />
              <span>ZATCA Phase 2 E-Invoicing Compliance</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300 text-xs font-medium">
              <MdCheckCircle className="text-blue-400 shrink-0" size={18} />
              <span>Real-Time Inventory & Profit Analytics</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300 text-xs font-medium">
              <MdCheckCircle className="text-cyan-400 shrink-0" size={18} />
              <span>High-Speed Thermal Receipt Printing</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center bg-slate-950/40">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Welcome Back</h3>
            <p className="text-slate-400 text-sm">Please sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <MdEmail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3.5 bg-white/[0.05] border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <MdLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3.5 bg-white/[0.05] border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPwd ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                </button>
              </div>
            </div>

            {/* CAPTCHA Security Verification Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MdSecurity className="text-blue-400" size={16} />
                  <span>Security Verification / رمز التحقق</span>
                </label>
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  disabled={captchaLoading}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors disabled:opacity-50"
                  title="Reload new CAPTCHA"
                >
                  <MdRefresh size={16} className={captchaLoading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                {/* SVG Visual Display */}
                <div className="sm:col-span-5 h-[50px] bg-slate-900/90 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden p-1 select-none shadow-inner">
                  {captchaLoading ? (
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  ) : captchaSvg ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: captchaSvg }}
                      className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:h-full [&>svg]:rounded-lg"
                    />
                  ) : (
                    <span className="text-xs text-slate-500">Loading code...</span>
                  )}
                </div>

                {/* Input Field */}
                <div className="sm:col-span-7">
                  <input
                    id="captcha-input"
                    type="text"
                    maxLength={6}
                    autoComplete="off"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value.toUpperCase())}
                    placeholder="Enter 4 characters"
                    className="w-full px-4 py-3.5 bg-white/[0.05] border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm font-mono tracking-widest text-center uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Account Lockout Notice */}
            {lockoutInfo?.isLocked && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-300 text-xs">
                <MdLockClock size={22} className="text-red-400 shrink-0" />
                <div>
                  <p className="font-bold">Account Temporarily Locked</p>
                  <p className="text-red-300/80 mt-0.5">
                    Too many failed attempts. Please wait {lockoutInfo.remainingMinutes} minute(s) before trying again.
                  </p>
                </div>
              </div>
            )}

            {/* Remaining Attempts Warning */}
            {!lockoutInfo?.isLocked && attemptsRemaining !== null && attemptsRemaining < 5 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2.5 text-amber-300 text-xs">
                <MdWarningAmber size={18} className="text-amber-400 shrink-0" />
                <p>
                  <span className="font-bold">Security Alert:</span> {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining before a 15-minute lockout.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="login-btn"
              type="submit"
              disabled={loading || lockoutInfo?.isLocked || !captchaAnswer.trim()}
              className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-slate-500">
              AB Traders POS System &bull; Secure Enterprise Portal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
