import { useState } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, sendSignInLinkToEmail } from 'firebase/auth';
import { app } from './firebase'; // Your Firebase config

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [showOTPField, setShowOTPField] = useState(false);
  const [otp, setOtp] = useState('');
  const auth = getAuth(app);

  // OAuth Handlers
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await sendOTP(result.user.email); // Send OTP after OAuth
    } catch (error) {
      console.error("Google OAuth error:", error);
    }
  };

  const handleFacebookSignIn = async () => {
    const provider = new FacebookAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await sendOTP(result.user.email);
    } catch (error) {
      console.error("Facebook OAuth error:", error);
    }
  };

  // OTP Functions
  const sendOTP = async (emailToSend) => {
    const actionCodeSettings = {
      url: `${window.location.origin}/verify`,
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, emailToSend, actionCodeSettings);
    setShowOTPField(true);
    alert(`OTP sent to ${emailToSend}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!showOTPField) {
      sendOTP(email);
    } else {
      verifyOTP(); // Implement your OTP verification logic
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        {/* Header */}
        <h1 className="text-3xl font-bold text-center mb-2">CONNECTIFY</h1>
        <p className="text-center text-gray-600 mb-6">Sign in to continue to Connectify</p>

        {/* OAuth Buttons */}
        <div className="space-y-4 mb-6">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>
          <button
            onClick={handleFacebookSignIn}
            className="w-full flex items-center justify-center gap-2 bg-blue-800 hover:bg-blue-900 text-white py-2 px-4 rounded transition"
          >
            <img src="https://static.xx.fbcdn.net/rsrc.php/yT/r/aGT3gskzWBf.ico" alt="Facebook" className="w-5 h-5" />
            Continue with Facebook
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-500">or</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Email/OTP Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">
              Email address or username
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {showOTPField && (
            <div className="mb-4">
              <label htmlFor="otp" className="block text-gray-700 mb-2">
                Enter OTP
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
          >
            {showOTPField ? 'VERIFY OTP' : 'CONTINUE'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center mt-6 text-gray-600">
          No account? <a href="/signup" className="text-blue-600 hover:underline">Sign up</a>
        </p>
      </div>
    </div>
  );
}