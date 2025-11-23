from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed

class TokenAuthSupportCSRF(TokenAuthentication):
    """
    Extend the TokenAuthentication to support CSRF
    """
    def authenticate(self, request):
        # Get the token-based user
        user_auth_tuple = super().authenticate(request)
        
        if user_auth_tuple is not None:
            user, token = user_auth_tuple
            # Enforce CSRF validation for session-based authentication
            self.enforce_csrf(request)
            return (user, token)
        return None

    def enforce_csrf(self, request):
        """
        Enforce CSRF validation for session-based authentication.
        """
        from django.middleware.csrf import CsrfViewMiddleware
        from django.core.exceptions import PermissionDenied
        
        # Check CSRF only for safe methods (POST, PUT, DELETE, etc.)
        if request.method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            reason = CsrfViewMiddleware().process_view(request, None, (), {})
            if reason:
                raise PermissionDenied(f'CSRF Failed: {reason}')