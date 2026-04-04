import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'

export function GoogleAuthButton({
  onError,
}: {
  onError: (message: string) => void
}) {
  const { completeGoogleSignIn, isConfigured } = useAuth()

  if (!isConfigured) {
    return (
      <div className="rounded-2xl border border-error/20 bg-error/10 p-4 text-sm text-error">
        Add `VITE_GOOGLE_CLIENT_ID` in `.env` to enable Google sign-in.
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          if (!credentialResponse.credential) {
            onError('Google sign-in did not return a credential.')
            return
          }

          const result = await completeGoogleSignIn(credentialResponse.credential)
          if (result.error) onError(result.error)
        }}
        onError={() => onError('Google sign-in failed.')}
        theme="outline"
        shape="pill"
        size="large"
        text="continue_with"
        width="320"
      />
    </div>
  )
}
