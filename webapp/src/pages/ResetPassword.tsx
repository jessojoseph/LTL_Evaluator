import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../api/client';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { launcherIcon } from '../assets';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Redirect countdown
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      navigate('/login');
    }
  }, [success, countdown, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or missing password reset token.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ token, password });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to reset password. The link may have expired.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f7f5] p-6">
      {/* Subtle Background Waves */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-[#e8f3ee] to-transparent rounded-full opacity-60 filter blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-20 w-96 h-96 bg-gradient-to-tr from-[#e8f3ee] to-transparent rounded-full opacity-60 filter blur-3xl pointer-events-none" />

      <div className="w-full max-w-[440px] bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-150 relative z-10">
        
        {/* Brand Logo */}
        <BrandLogo size="sm" showText={false} imageSrc={launcherIcon} className="mb-6" />

        {success ? (
          <div className="text-center py-4 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <CheckCircle className="w-8 h-8 text-[#1a7a4c]" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Password Reset!</h2>
            <p className="text-sm text-gray-500 font-medium mb-6">
              Your password has been changed successfully.
            </p>
            <div className="bg-[#f3f7f5] border border-gray-100 rounded-2xl p-4 text-xs font-semibold text-gray-600">
              Redirecting you to login in <span className="text-[#0f5c3a] font-bold text-sm">{countdown}</span> seconds...
            </div>
            <Link to="/login" className="btn-primary w-full mt-6 inline-flex justify-center items-center">
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            {/* Heading */}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
              Reset Password
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed mb-6">
              Set a strong, secure new password for your account.
            </p>

            {/* Error Message */}
            {error && (
              <div className="w-full bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl px-4 py-3 mb-5 animate-slide-down">
                {error}
              </div>
            )}

            {!token && (
              <div className="w-full bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs rounded-xl px-4 py-3 mb-5">
                Warning: No reset token detected in the URL. Please verify your reset link.
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              {/* New Password */}
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-700 mb-2 block" htmlFor="password">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-gray-400 pointer-events-none">
                    <Lock className="w-[18px] h-[18px]" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-11 pr-11 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#1a7a4c] focus:ring-4 focus:ring-[#d1fae5]/50 transition-all duration-200 shadow-sm"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
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

              {/* Confirm Password */}
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-700 mb-2 block" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-gray-400 pointer-events-none">
                    <Lock className="w-[18px] h-[18px]" />
                  </span>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-11 pr-11 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#1a7a4c] focus:ring-4 focus:ring-[#d1fae5]/50 transition-all duration-200 shadow-sm"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !token}
                className="w-full py-3.5 bg-[#0f5c3a] hover:bg-[#0d4f31] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#0f5c3a]/10 active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#d1fae5] disabled:opacity-50 disabled:pointer-events-none mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Resetting...
                  </span>
                ) : (
                  <span>Reset Password</span>
                )}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}
