from django.conf import settings
from google.auth.exceptions import TransportError
from google.auth.transport.requests import Request
from google.oauth2 import id_token


class GoogleCredentialInvalid(Exception):
    pass


class GoogleProviderUnavailable(Exception):
    pass


class GoogleOAuthNotConfigured(Exception):
    pass


def verify_google_credential(credential):
    client_id = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', '')
    if not client_id:
        raise GoogleOAuthNotConfigured

    try:
        claims = id_token.verify_oauth2_token(
            credential,
            Request(),
            audience=client_id,
        )
    except TransportError as error:
        raise GoogleProviderUnavailable from error
    except ValueError as error:
        raise GoogleCredentialInvalid from error

    email = claims.get('email')
    subject = claims.get('sub')
    if (
        not isinstance(email, str)
        or not email.strip()
        or not isinstance(subject, str)
        or not subject.strip()
        or claims.get('email_verified') is not True
    ):
        raise GoogleCredentialInvalid

    return {'email': email.strip().lower(), 'google_sub': subject}
