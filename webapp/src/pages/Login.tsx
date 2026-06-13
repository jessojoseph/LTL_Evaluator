import { useState, FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Eye, EyeOff, Mail, Lock, BarChart3,
  Users, LineChart, Clock 
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import BrandIllustration from '../components/BrandIllustration';
import { launcherIcon } from '../assets';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#f3f7f5]">
      {/* Left Column — Brand Showcase */}
      <div className="hidden lg:flex flex-col p-12 xl:p-16 bg-[#f3f7f5] border-r border-gray-150 relative overflow-hidden">
        {/* Subtle Background Waves */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-[#e8f3ee] to-transparent rounded-full opacity-60 filter blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-20 w-96 h-96 bg-gradient-to-tr from-[#e8f3ee] to-transparent rounded-full opacity-60 filter blur-3xl pointer-events-none" />

        {/* Brand Logo */}
        <div className="relative z-10">
          <BrandLogo size="md" imageSrc={launcherIcon} />
        </div>

        {/* Content Block */}
        <div className="mt-20 xl:mt-24 relative z-10 flex flex-col gap-6">
          {/* Badge */}
          <div className="self-start inline-flex items-center gap-1.5 bg-[#e8f3ee] text-[#0f5c3a] text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
            <span>Resource Planning Management System</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl xl:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight max-w-lg">
            Plan. Allocate. Optimize. <br />
            <span className="text-[#0f5c3a]">Drive Team Success.</span>
          </h2>

          {/* Description */}
          <p className="text-sm xl:text-base text-gray-500 font-medium leading-relaxed max-w-md">
            Streamline resource planning, track utilization, and optimize team capacity — all in one place.
          </p>

          {/* Dashboard Preview Illustration */}
          <div className="mt-6">
            <BrandIllustration className="max-w-lg" />
          </div>
        </div>
      </div>

      {/* Right Column — Login Form */}
      <div className="flex flex-col justify-between items-center p-8 sm:p-12 min-h-screen bg-white">
        <div className="hidden lg:block h-6" />

        {/* Mobile Brand Block */}
        <div className="lg:hidden mb-6">
          <BrandLogo size="sm" imageSrc={launcherIcon} />
        </div>

        {/* Login Form Container */}
        <div className="w-full max-w-[400px] flex flex-col items-center my-auto">
          {/* Brand Mark */}
          <div className="w-14 h-14 bg-[#e8f3ee] rounded-2xl flex items-center justify-center mb-6 shrink-0 transition-transform duration-300 hover:scale-105">
            <BarChart3 className="w-7 h-7 text-[#0f5c3a]" />
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center tracking-tight mb-2">
            Welcome back 👋
          </h2>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-gray-500 text-center font-medium leading-relaxed mb-6 max-w-sm">
            Sign in to access your resource planning dashboard
          </p>

          {/* Error Alert */}
          {error && (
            <div className="w-full bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl px-4 py-3 mb-4 animate-slide-down">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-700 mb-2 block" htmlFor="email">
                Email address
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-gray-400 pointer-events-none">
                  <Mail className="w-[18px] h-[18px]" />
                </span>
                <input
                  id="email"
                  type="email"
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#1a7a4c] focus:ring-4 focus:ring-[#d1fae5]/50 transition-all duration-200 shadow-sm"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-700 mb-2 block" htmlFor="password">
                Password
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-gray-400 pointer-events-none">
                  <Lock className="w-[18px] h-[18px]" />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-11 pr-11 py-3 sm:py-3.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#1a7a4c] focus:ring-4 focus:ring-[#d1fae5]/50 transition-all duration-200 shadow-sm"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end -mt-2">
              <Link 
                to="/forgot-password" 
                className="font-bold text-[#0f5c3a] hover:text-[#0d4f31] hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#0f5c3a] hover:bg-[#0d4f31] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#0f5c3a]/10 active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#d1fae5] disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1">
                  Sign in
                  <svg className="w-4 h-4 stroke-current stroke-[2.5]" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-xs text-gray-400 font-semibold tracking-wide">
          © {new Date().getFullYear()} AttendEase. All rights reserved.
        </p>
      </div>
    </div>
  );
}
