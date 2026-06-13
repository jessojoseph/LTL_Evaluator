import { useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, Eye, EyeOff, Mail, Lock, 
  Users, LineChart, Clock 
} from 'lucide-react';

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
      {/* Left Column - Marketing & Mockup Dashboard (Light Green Background) */}
      <div className="hidden lg:flex flex-col p-12 xl:p-16 bg-[#f3f7f5] border-r border-gray-150 relative overflow-hidden">
        {/* Subtle Background Waves */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-[#e8f3ee] to-transparent rounded-full opacity-60 filter blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-20 w-96 h-96 bg-gradient-to-tr from-[#e8f3ee] to-transparent rounded-full opacity-60 filter blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 bg-[#0f5c3a] rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="leading-none">
            <span className="font-bold text-gray-950 text-base tracking-tight block">AttendEase</span>
            <span className="text-[10px] text-gray-400 font-semibold mt-0.5 block">Attendance made easy</span>
          </div>
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

          {/* Features Vertical List */}
          <div className="flex flex-col gap-5 max-w-lg mt-2">
            {/* Feature 1 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-[#0f5c3a] bg-white shrink-0 shadow-sm">
                <Users className="w-5 h-5" />
              </div>
              <div className="pt-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-gray-800">Smart Capacity Planning</h3>
                <p className="text-[11px] sm:text-xs text-gray-400 font-semibold mt-0.5">Plan resources effectively</p>
              </div>
            </div>
            
            {/* Feature 2 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-[#0f5c3a] bg-white shrink-0 shadow-sm">
                <LineChart className="w-5 h-5" />
              </div>
              <div className="pt-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-gray-800">Resource Allocation</h3>
                <p className="text-[11px] sm:text-xs text-gray-400 font-semibold mt-0.5">Assign the right people to the right projects</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-[#0f5c3a] bg-white shrink-0 shadow-sm">
                <Clock className="w-5 h-5" />
              </div>
              <div className="pt-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-gray-800">Real-time Insights</h3>
                <p className="text-[11px] sm:text-xs text-gray-400 font-semibold mt-0.5">Track utilization and performance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Flat Login Container (White Background, NO CARD wrapper) */}
      <div className="flex flex-col justify-between items-center p-8 sm:p-12 min-h-screen bg-white">
        {/* Empty space/spacer to center the form card visually on desktop */}
        <div className="hidden lg:block h-6" />

        {/* Mobile Logo Block */}
        <div className="lg:hidden flex flex-col items-center mb-6">
          <div className="w-10 h-10 bg-[#0f5c3a] rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm">
            <BarChart3 className="w-5.5 h-5.5" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-2">AttendEase</h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Attendance made easy</p>
        </div>

        {/* Flat Form container (no border, no shadow, no bg) */}
        <div className="w-full max-w-[400px] flex flex-col items-center my-auto">
          {/* Light Green Icon Container with dark green chart */}
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
            {/* Email Address */}
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

            {/* Password */}
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

            {/* Forgot Password aligned right */}
            <div className="flex justify-end -mt-2">
              <a 
                href="#forgot" 
                onClick={(e) => {
                  e.preventDefault();
                  setError('Password reset is not configured.');
                }}
                className="font-bold text-[#0f5c3a] hover:text-[#0d4f31] hover:underline transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
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

        {/* Centered Right Copyright Footer */}
        <p className="mt-8 text-xs text-gray-400 font-semibold tracking-wide">
          © {new Date().getFullYear()} AttendEase. All rights reserved.
        </p>
      </div>
    </div>
  );
}
