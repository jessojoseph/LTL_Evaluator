import { useState, FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Eye, EyeOff, Mail, Lock, 
  Users, BarChart3, CheckSquare, 
  ShieldCheck
} from 'lucide-react';
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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#f4f8f6] font-sans antialiased">
      {/* Left Column — Marketing and CSS Mockup (Light Green-Gray Background) */}
      <div className="hidden lg:flex flex-col p-12 xl:p-16 bg-[#f9fbfb] relative overflow-hidden justify-between">
        {/* Rich Background Gradients & SVG Waves */}
        <div className="absolute -top-30 -left-30 w-[600px] h-[600px] bg-gradient-to-br from-[#d1fae5]/40 to-transparent rounded-full opacity-70 filter blur-3xl pointer-events-none animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] bg-gradient-to-tr from-[#34d399]/25 to-transparent rounded-full opacity-60 filter blur-3xl pointer-events-none" />
        
        {/* Decorative Floating Waves (Top-Right) */}
        <svg className="absolute top-[10%] right-[-10%] w-[600px] h-[600px] opacity-40 pointer-events-none select-none" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M150 100 C 280 220, 320 400, 600 350" stroke="#10b981" strokeWidth="1" strokeOpacity="0.08" />
          <path d="M170 100 C 300 230, 340 410, 600 370" stroke="#10b981" strokeWidth="1" strokeOpacity="0.12" />
          <path d="M190 100 C 320 240, 360 420, 600 390" stroke="#10b981" strokeWidth="1" strokeOpacity="0.16" />
          <path d="M210 100 C 340 250, 380 430, 600 410" stroke="#10b981" strokeWidth="1" strokeOpacity="0.20" />
          <path d="M230 100 C 360 260, 400 440, 600 430" stroke="#10b981" strokeWidth="1" strokeOpacity="0.16" />
          <path d="M250 100 C 380 270, 420 450, 600 450" stroke="#10b981" strokeWidth="1" strokeOpacity="0.12" />
          <path d="M270 100 C 400 280, 440 460, 600 470" stroke="#10b981" strokeWidth="1" strokeOpacity="0.08" />
        </svg>

        {/* Decorative Floating Waves (Bottom-Left) */}
        <svg className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] opacity-40 pointer-events-none select-none" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 420 C 130 390, 180 260, 400 440" stroke="#10b981" strokeWidth="1" strokeOpacity="0.08" />
          <path d="M0 400 C 120 370, 170 240, 400 420" stroke="#10b981" strokeWidth="1" strokeOpacity="0.12" />
          <path d="M0 380 C 110 350, 160 220, 400 400" stroke="#10b981" strokeWidth="1" strokeOpacity="0.16" />
          <path d="M0 360 C 100 330, 150 200, 400 380" stroke="#10b981" strokeWidth="1" strokeOpacity="0.20" />
          <path d="M0 340 C 90 310, 140 180, 400 360" stroke="#10b981" strokeWidth="1" strokeOpacity="0.16" />
          <path d="M0 320 C 80 290, 130 160, 400 340" stroke="#10b981" strokeWidth="1" strokeOpacity="0.12" />
          <path d="M0 300 C 70 270, 120 140, 400 320" stroke="#10b981" strokeWidth="1" strokeOpacity="0.08" />
        </svg>

        {/* Brand Header */}
        <div className="flex items-center gap-3.5 relative z-10">
          <img src={launcherIcon} alt="AttendEase" className="w-12 h-12 object-contain shrink-0" />
          <div className="leading-tight">
            <span className="font-extrabold text-gray-900 text-lg tracking-tight block">AttendEase</span>
            <span className="text-[11px] text-gray-400 font-bold tracking-wider uppercase block">Resource Planning</span>
          </div>
        </div>

        {/* Content & Dashboard Mockup Block */}
        <div className="my-auto py-12 relative z-10 flex flex-col gap-8">
          
          <div className="flex flex-col gap-4">
            {/* Pill Badge */}
            <div className="self-start inline-flex items-center gap-1.5 bg-[#e8f3ee] text-[#0c4e32] text-xs font-bold px-3.5 py-1.5 rounded-full shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              <span>Resource Planning Management System</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl xl:text-4xl font-extrabold text-gray-900 tracking-tight leading-[1.2] max-w-lg">
              Plan smarter.<br />
              Allocate better.<br />
              <span className="text-[#0c4e32]">Achieve together.</span>
            </h2>

            {/* Description */}
            <p className="text-sm xl:text-base text-gray-500 font-medium leading-relaxed max-w-md mt-1">
              Streamline resource planning, track utilization, and optimize team capacity — all in one place.
            </p>
          </div>

          {/* Features and Mockup Dashboard (Side by Side) */}
          <div className="flex flex-col xl:flex-row gap-8 items-start mt-4">
            
            {/* Features list */}
            <div className="flex flex-col gap-4 max-w-sm w-full xl:w-5/12 relative z-10">
              {/* Feature 1 */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
                <div className="w-12 h-12 rounded-xl bg-[#e8f3ee] flex items-center justify-center text-[#0c4e32] shrink-0 shadow-sm">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Smarter Planning</h3>
                  <p className="text-[11px] text-gray-400 font-semibold mt-0.5 leading-normal">Allocate the right resources to the right projects.</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
                <div className="w-12 h-12 rounded-xl bg-[#e8f3ee] flex items-center justify-center text-[#0c4e32] shrink-0 shadow-sm">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Real-time Insights</h3>
                  <p className="text-[11px] text-gray-400 font-semibold mt-0.5 leading-normal">Track utilization and project health in real time.</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
                <div className="w-12 h-12 rounded-xl bg-[#e8f3ee] flex items-center justify-center text-[#0c4e32] shrink-0 shadow-sm">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Team Success</h3>
                  <p className="text-[11px] text-gray-400 font-semibold mt-0.5 leading-normal">Optimize capacity and drive results together.</p>
                </div>
              </div>
            </div>

            {/* Dashboard Mockup card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-4 flex flex-row gap-4 max-w-[360px] w-full shrink-0 animate-fade-in select-none">
              {/* Green Sidebar */}
              <div className="w-11 bg-[#0c4e32] rounded-2xl py-3 flex flex-col items-center gap-5 shrink-0">
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center text-white text-[10px] font-bold">L</div>
                <div className="flex flex-col gap-4 mt-2">
                  <div className="w-4 h-4 bg-white/30 rounded-md" />
                  <div className="w-4 h-4 bg-white/10 rounded-md" />
                  <div className="w-4 h-4 bg-white/10 rounded-md" />
                  <div className="w-4 h-4 bg-white/10 rounded-md" />
                </div>
              </div>

              {/* Main Contents */}
              <div className="flex-1 flex flex-col gap-3.5">
                {/* Stats cards */}
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="bg-[#e8f3ee] p-1.5 rounded-xl border border-green-100 text-center">
                    <span className="text-[9px] text-gray-400 font-semibold block">Employees</span>
                    <span className="text-xs font-bold text-[#0c4e32]">124</span>
                  </div>
                  <div className="bg-blue-50/50 p-1.5 rounded-xl border border-blue-100 text-center">
                    <span className="text-[9px] text-gray-400 font-semibold block">Utilization</span>
                    <span className="text-xs font-bold text-blue-700">86%</span>
                  </div>
                  <div className="bg-amber-50/50 p-1.5 rounded-xl border border-amber-100 text-center">
                    <span className="text-[9px] text-gray-400 font-semibold block">Projects</span>
                    <span className="text-xs font-bold text-amber-700">28</span>
                  </div>
                </div>

                {/* Utilization bar chart mockup */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Utilization Overview</span>
                  <div className="flex items-end justify-between h-[70px] px-2.5 bg-gray-50 rounded-xl pt-3 pb-1.5">
                    <div className="h-[25%] w-2 bg-[#0c4e32]/60 rounded-t-sm" />
                    <div className="h-[50%] w-2 bg-[#0c4e32]/80 rounded-t-sm" />
                    <div className="h-[40%] w-2 bg-[#0c4e32] rounded-t-sm" />
                    <div className="h-[75%] w-2 bg-[#0c4e32] rounded-t-sm" />
                    <div className="h-[60%] w-2 bg-[#0c4e32]/70 rounded-t-sm" />
                    <div className="h-[90%] w-2 bg-[#0c4e32] rounded-t-sm" />
                    <div className="h-[55%] w-2 bg-[#0c4e32]/90 rounded-t-sm" />
                    <div className="h-[80%] w-2 bg-[#0c4e32] rounded-t-sm" />
                  </div>
                </div>

                {/* Bottom row metrics */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 p-2 rounded-xl border border-gray-100 flex flex-col gap-1.5">
                    <span className="text-[8px] text-gray-400 font-bold uppercase block leading-none">Projects on Track</span>
                    <span className="text-xs font-extrabold text-gray-800 leading-none">72%</span>
                    <div className="w-full bg-gray-250 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#0c4e32] h-full w-[72%] rounded-full" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-2 rounded-xl border border-gray-100 flex items-center justify-between gap-1">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-gray-400 font-bold uppercase leading-none">Project Status</span>
                      <div className="flex flex-col gap-0.5 mt-1.5">
                        <span className="text-[7px] text-gray-500 flex items-center gap-0.5"><span className="w-1 h-1 bg-[#0c4e32] rounded-full" /> On Track</span>
                        <span className="text-[7px] text-gray-500 flex items-center gap-0.5"><span className="w-1 h-1 bg-amber-500 rounded-full" /> At Risk</span>
                      </div>
                    </div>
                    {/* Tiny Donut Chart SVG */}
                    <svg className="w-7 h-7 transform -rotate-90 shrink-0" viewBox="0 0 32 32">
                      <circle r="12" cx="16" cy="16" fill="transparent" stroke="#e2e8f0" strokeWidth="4" />
                      <circle r="12" cx="16" cy="16" fill="transparent" stroke="#0c4e32" strokeWidth="4" 
                        strokeDasharray="75.39" strokeDashoffset="22" />
                      <circle r="12" cx="16" cy="16" fill="transparent" stroke="#f59e0b" strokeWidth="4" 
                        strokeDasharray="75.39" strokeDashoffset="60" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Left Bottom empty space placeholder */}
        <div className="text-[10px] text-gray-400 font-semibold tracking-wider">
          PLANNING • ALLOCATION • CAPACITY UTILIATION
        </div>
      </div>

      {/* Right Column — Login Card Container (Deep Teal Gradient) */}
      <div className="flex flex-col justify-between items-center p-6 sm:p-12 relative overflow-hidden bg-gradient-to-br from-[#0a3a23] via-[#082a1b] to-[#041a10]">
        
        {/* Vibrant Glowing Blobs */}
        <div className="absolute -top-20 -right-20 w-[450px] h-[450px] bg-[#10b981]/20 rounded-full filter blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[450px] h-[450px] bg-[#0c4e32]/45 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="absolute top-[40%] right-[10%] w-96 h-96 bg-[#059669]/10 rounded-full filter blur-[80px] pointer-events-none" />

        {/* Concentric Dotted Circles in Top Right Corner */}
        <svg className="absolute -top-10 -right-10 w-96 h-96 text-white/[0.04] pointer-events-none select-none" viewBox="0 0 100 100">
          <circle cx="85" cy="15" r="15" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1.5 1.5" />
          <circle cx="85" cy="15" r="25" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1.5 1.5" />
          <circle cx="85" cy="15" r="35" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1.5 1.5" />
          <circle cx="85" cy="15" r="45" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1.5 1.5" />
          <circle cx="85" cy="15" r="55" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1.5 1.5" />
          <circle cx="85" cy="15" r="65" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1.5 1.5" />
          <circle cx="85" cy="15" r="75" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1.5 1.5" />
        </svg>

        <div className="hidden lg:block h-6" />

        {/* Mobile Header (Shows only on small screen sizes) */}
        <div className="lg:hidden flex flex-col items-center mb-6 z-10">
          <img src={launcherIcon} alt="AttendEase" className="w-14 h-14 object-contain" />
          <h1 className="text-white font-extrabold text-lg mt-2">AttendEase</h1>
          <p className="text-xs text-green-300/60 font-semibold">Resource Planning Management System</p>
        </div>

        {/* White Card Container */}
        <div className="w-full max-w-[460px] bg-white rounded-[2.5rem] shadow-2xl p-8 sm:p-10 border border-gray-150/40 relative z-10 my-auto flex flex-col gap-6 animate-fade-in">
          
          {/* Brand Mark — launcher icon */}
          <div className="mx-auto transition-transform hover:scale-105 duration-300 shrink-0">
            <img src={launcherIcon} alt="AttendEase" className="w-20 h-20 object-contain" />
          </div>

          <div className="text-center">
            {/* Heading */}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Welcome back 👋
            </h2>
            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed mt-1.5">
              Sign in to access your resource planning dashboard
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="w-full bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl px-4 py-3 animate-slide-down">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
            {/* Email Address */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-700 mb-2 block" htmlFor="email">
                Email address
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-gray-400 pointer-events-none">
                  <Mail className="w-[18px] h-[18px]" />
                </span>
                <input
                  id="email"
                  type="email"
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#10b981] focus:ring-4 focus:ring-[#d1fae5]/50 transition-all duration-200 shadow-sm"
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
              <label className="text-xs font-bold text-gray-700 mb-2 block" htmlFor="password">
                Password
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-gray-400 pointer-events-none">
                  <Lock className="w-[18px] h-[18px]" />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-11 pr-11 py-3 sm:py-3.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#10b981] focus:ring-4 focus:ring-[#d1fae5]/50 transition-all duration-200 shadow-sm"
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

            {/* Forgot Password Link */}
            <div className="flex justify-end -mt-1.5">
              <Link 
                to="/forgot-password" 
                className="text-xs font-bold text-[#0c4e32] hover:text-[#0a3a23] hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#10b981] hover:bg-[#0e9f6e] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#10b981]/15 active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#d1fae5] disabled:opacity-50 disabled:pointer-events-none mt-2 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  Sign In
                  <svg className="w-4 h-4 stroke-current stroke-[2.5]" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          {/* Footnote alert */}
          <div className="flex items-start gap-3 bg-[#e8f3ee] border border-green-100 rounded-2xl p-3">
            <ShieldCheck className="w-5 h-5 text-[#0c4e32] shrink-0 mt-0.5" />
            <div className="leading-tight">
              <span className="text-[10px] font-extrabold text-gray-800 block">Your data is secure and protected</span>
              <span className="text-[9px] text-gray-400 font-semibold mt-0.5 block">Enterprise-grade security you can trust</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <p className="mt-8 text-xs text-green-100/60 font-semibold tracking-wide z-10 relative">
          © {new Date().getFullYear()} AttendEase. All rights reserved.
        </p>
      </div>
    </div>
  );
}
