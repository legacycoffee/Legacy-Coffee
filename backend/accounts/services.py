import hashlib
import json
import time
import uuid
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings
from rest_framework.exceptions import APIException, ValidationError


MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {
    'image/jpeg': b'\xff\xd8\xff',
    'image/png': b'\x89PNG\r\n\x1a\n',
    'image/webp': b'RIFF',
}


class CloudinaryConfigurationError(APIException):
    status_code = 503
    default_detail = 'Profile photo uploads are not configured. Set the Cloudinary server credentials and try again.'
    default_code = 'cloudinary_not_configured'


class CloudinaryUploadError(APIException):
    status_code = 502
    default_detail = 'Cloudinary could not save the profile photo. Please try again.'
    default_code = 'cloudinary_upload_failed'


def upload_profile_photo(uploaded_file, user_id):
    cloud_name = getattr(settings, 'CLOUDINARY_CLOUD_NAME', '')
    api_key = getattr(settings, 'CLOUDINARY_API_KEY', '')
    api_secret = getattr(settings, 'CLOUDINARY_API_SECRET', '')
    if not all((cloud_name, api_key, api_secret)):
        raise CloudinaryConfigurationError()

    content_type = uploaded_file.content_type
    signature = ALLOWED_IMAGE_TYPES.get(content_type)
    if not signature:
        raise ValidationError({'photo': 'Upload a JPEG, PNG, or WebP image.'})

    image_data = uploaded_file.read(MAX_PROFILE_PHOTO_BYTES + 1)
    if len(image_data) > MAX_PROFILE_PHOTO_BYTES:
        raise ValidationError({'photo': 'Choose an image smaller than 5 MB.'})
    if not image_data.startswith(signature):
        raise ValidationError({'photo': 'The uploaded file does not match its image type.'})
    if content_type == 'image/webp' and image_data[8:12] != b'WEBP':
        raise ValidationError({'photo': 'The uploaded file is not a valid WebP image.'})

    timestamp = int(time.time())
    parameters = {
        'overwrite': 'true',
        'public_id': f'profile-photos/user-{user_id}',
        'timestamp': str(timestamp),
    }
    signature_payload = '&'.join(
        f'{key}={parameters[key]}' for key in sorted(parameters)
    )
    signature_value = hashlib.sha1(
        f'{signature_payload}{api_secret}'.encode(),
    ).hexdigest()

    boundary = f'----LegacyCoffee{uuid.uuid4().hex}'
    fields = {
        **parameters,
        'api_key': api_key,
        'signature': signature_value,
    }
    body = bytearray()
    for key, value in fields.items():
        body.extend(f'--{boundary}\r\n'.encode())
        body.extend(f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode())
        body.extend(f'{value}\r\n'.encode())
    body.extend(f'--{boundary}\r\n'.encode())
    body.extend(
        f'Content-Disposition: form-data; name="file"; filename="profile-photo"\r\n'.encode()
    )
    body.extend(f'Content-Type: {content_type}\r\n\r\n'.encode())
    body.extend(image_data)
    body.extend(f'\r\n--{boundary}--\r\n'.encode())

    request = Request(
        f'https://api.cloudinary.com/v1_1/{cloud_name}/image/upload',
        data=bytes(body),
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'},
        method='POST',
    )
    try:
        with urlopen(request, timeout=30) as response:
            result = json.loads(response.read())
    except HTTPError as error:
        error_body = error.read()
        try:
            details = json.loads(error_body).get('error', {}).get('message')
        except (json.JSONDecodeError, AttributeError):
            details = None
        raise CloudinaryUploadError(details or 'Cloudinary could not save the profile photo.') from error
    except (URLError, TimeoutError) as error:
        raise CloudinaryUploadError('Cloudinary could not be reached. Please try again.') from error
    except json.JSONDecodeError as error:
        raise CloudinaryUploadError('Cloudinary returned an invalid upload response.') from error

    secure_url = result.get('secure_url') if isinstance(result, dict) else None
    if not secure_url or not secure_url.startswith('https://res.cloudinary.com/'):
        raise CloudinaryUploadError('Cloudinary did not return a valid profile photo URL.')
    return secure_url
