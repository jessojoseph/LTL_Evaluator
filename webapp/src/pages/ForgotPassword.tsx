import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/client';
import { BarChart3, Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await authApi.forgotPassword(email);
      setSuccess(response.data.message || 'If that email is registered, a reset link has been sent.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Something went wrong. Please try again.';
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
        
        {/* Back Link */}
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-xs font-bold text-[#0f5c3a] hover:text-[#0d4f31] mb-6 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          Back to Login
        </Link>

        {/* Logo / Icon */}
        <div className="w-14 h-14 bg-[#e8f3ee] rounded-2xl flex items-center justify-center mb-6 shrink-0 shadow-inner">
          <BarChart3 className="w-7 h-7 text-[#0f5c3a]" />
        </div>

        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
          Forgot Password
        </h2>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed mb-6">
          Enter your registered email address and we'll send you a link to reset your password.
        </p>

        {/* Status Alerts */}
        {error && (
          <div className="w-full bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl px-4 py-3 mb-5 animate-slide-down">
            {error}
          </div>
        )}

        {success && (
          <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-xl px-4 py-3 mb-5 animate-slide-down">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#1a7a4c] focus:ring-4 focus:ring-[#d1fae5]/50 transition-all duration-200 shadow-sm"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
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
                Sending link...
              </span>
            ) : (
              <span>Send Reset Link</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
