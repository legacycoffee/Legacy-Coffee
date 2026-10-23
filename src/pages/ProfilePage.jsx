import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LuArrowLeft, LuLogOut, LuMapPin, LuTrash2, LuUserRound } from 'react-icons/lu'
import { useAuth } from '../context/useAuth.js'
import { apiRequest } from '../context/api.js'
import { getCurrentCoordinates } from '../context/geolocation.js'

const inputClass = 'mt-1.5 w-full border border-peach-mid px-3.5 py-3 text-sm text-black outline-none placeholder:text-black/40 focus:border-primary focus:ring-2 focus:ring-primary/20'

export default function ProfilePage() {
  const { isAuthenticated, user, token, updateUser, clearAuth } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [nameForm, setNameForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
  })
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [nameError, setNameError] = useState('')
  const [nameSuccess, setNameSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)
  const [isSavingPhoto, setIsSavingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [photoSuccess, setPhotoSuccess] = useState('')
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [isNameEditing, setIsNameEditing] = useState(false)
  const [passwordStep, setPasswordStep] = useState('closed')
  const [isDeleteFormOpen, setIsDeleteFormOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false)
  const [accountActionError, setAccountActionError] = useState('')
  const [isAccountActionPending, setIsAccountActionPending] = useState(false)
  const [locationForm, setLocationForm] = useState({
    delivery_address: user?.delivery_address || '',
    delivery_city: user?.delivery_city || '',
    delivery_notes: user?.delivery_notes || '',
    location_latitude: user?.location_latitude || '',
    location_longitude: user?.location_longitude || '',
  })
  const [locationError, setLocationError] = useState('')
  const [locationSuccess, setLocationSuccess] = useState('')
  const [isSavingLocation, setIsSavingLocation] = useState(false)
  const [isFetchingLocation, setIsFetchingLocation] = useState(false)

  useEffect(() => {
    if (!location.hash) return
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
  }, [location.hash])

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: '/profile' }} />
  }

  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Not provided'

  const saveProfilePhoto = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setPhotoError('')
    setPhotoSuccess('')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Choose a JPEG, PNG, or WebP image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Choose an image smaller than 5 MB.')
      return
    }

    setIsSavingPhoto(true)
    try {
      const photo = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error('The selected image could not be read.'))
        reader.onload = () => {
          const image = new Image()
          image.onerror = () => reject(new Error('The selected file is not a valid image.'))
          image.onload = () => {
            const scale = Math.min(1, 512 / Math.max(image.width, image.height))
            const canvas = document.createElement('canvas')
            canvas.width = Math.round(image.width * scale)
            canvas.height = Math.round(image.height * scale)
            const context = canvas.getContext('2d')
            if (!context) {
              reject(new Error('Your browser could not process this image.'))
              return
            }
            context.drawImage(image, 0, 0, canvas.width, canvas.height)
            canvas.toBlob(blob => {
              if (blob) resolve(blob)
              else reject(new Error('Your browser could not process this image.'))
            }, 'image/jpeg', 0.8)
          }
          image.src = reader.result
        }
        reader.readAsDataURL(file)
      })
      const formData = new FormData()
      formData.append('photo', photo, 'profile-photo.jpg')
      const updatedUser = await apiRequest('/auth/profile-photo/', {
        method: 'POST',
        body: formData,
        token,
      })
      updateUser(updatedUser)
      setPhotoSuccess('Your profile photo has been saved.')
    } catch (requestError) {
      setPhotoError(requestError.message)
    } finally {
      setIsSavingPhoto(false)
    }
  }

  const removeProfilePhoto = async () => {
    setPhotoError('')
    setPhotoSuccess('')
    setIsSavingPhoto(true)
    try {
      const updatedUser = await apiRequest('/auth/me/', {
        method: 'PATCH',
        body: { profile_photo: '' },
        token,
      })
      updateUser(updatedUser)
      setPhotoSuccess('Your profile photo has been removed.')
    } catch (requestError) {
      setPhotoError(requestError.message)
    } finally {
      setIsSavingPhoto(false)
    }
  }

  const saveName = async event => {
    event.preventDefault()
    setNameError('')
    setNameSuccess('')
    setIsSavingName(true)
    try {
      const updatedUser = await apiRequest('/auth/me/', {
        method: 'PATCH',
        body: nameForm,
        token,
      })
      updateUser(updatedUser)
      setNameSuccess('Your name has been updated.')
      setIsNameEditing(false)
    } catch (requestError) {
      setNameError(requestError.message)
    } finally {
      setIsSavingName(false)
    }
  }

  const changePassword = async event => {
    event.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    setIsSavingPassword(true)
    try {
      const result = await apiRequest('/auth/change-password/', {
        method: 'POST',
        body: passwordForm,
        token,
      })
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
      setPasswordSuccess(result.detail)
      setPasswordStep('closed')
    } catch (requestError) {
      setPasswordError(requestError.message)
    } finally {
      setIsSavingPassword(false)
    }
  }

  const verifyCurrentPassword = async event => {
    event.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    setIsSavingPassword(true)
    try {
      await apiRequest('/auth/verify-password/', {
        method: 'POST',
        body: { current_password: passwordForm.current_password },
        token,
      })
      setPasswordStep('update')
    } catch (requestError) {
      setPasswordError(requestError.message)
    } finally {
      setIsSavingPassword(false)
    }
  }

  const resetPasswordChange = () => {
    setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
    setPasswordError('')
    setPasswordSuccess('')
    setPasswordStep('closed')
  }

  const saveLocation = async event => {
    event.preventDefault()
    setLocationError('')
    setLocationSuccess('')
    setIsSavingLocation(true)
    try {
      const updatedUser = await apiRequest('/auth/me/', {
        method: 'PATCH',
        body: {
          ...locationForm,
          location_latitude: locationForm.location_latitude || null,
          location_longitude: locationForm.location_longitude || null,
        },
        token,
      })
      updateUser(updatedUser)
      setLocationSuccess('Your delivery location has been saved.')
    } catch (requestError) {
      setLocationError(requestError.message)
    } finally {
      setIsSavingLocation(false)
    }
  }

  const fetchLocation = async () => {
    setLocationError('')
    setLocationSuccess('')
    setIsFetchingLocation(true)
    try {
      const coordinates = await getCurrentCoordinates()
      const updatedUser = await apiRequest('/auth/me/', {
        method: 'PATCH',
        body: {
          ...locationForm,
          ...coordinates,
        },
        token,
      })
      updateUser(updatedUser)
      setLocationForm({
        delivery_address: updatedUser.delivery_address || '',
        delivery_city: updatedUser.delivery_city || '',
        delivery_notes: updatedUser.delivery_notes || '',
        location_latitude: updatedUser.location_latitude || '',
        location_longitude: updatedUser.location_longitude || '',
      })
      setLocationSuccess('Device coordinates were fetched and saved to your account.')
    } catch (requestError) {
      setLocationError(requestError.message)
    } finally {
      setIsFetchingLocation(false)
    }
  }

  const logOut = async () => {
    setAccountActionError('')
    setIsAccountActionPending(true)
    try {
      await apiRequest('/auth/logout/', { method: 'POST', token })
      clearAuth()
      navigate('/', { replace: true })
    } catch (requestError) {
      setAccountActionError(requestError.message)
    } finally {
      setIsAccountActionPending(false)
    }
  }

  const deleteAccount = async event => {
    event.preventDefault()
    setAccountActionError('')
    setIsAccountActionPending(true)
    try {
      await apiRequest('/auth/delete-account/', {
        method: 'POST',
        body: { current_password: deletePassword },
        token,
      })
      clearAuth()
      navigate('/', { replace: true })
    } catch (requestError) {
      setAccountActionError(requestError.message)
    } finally {
      setIsAccountActionPending(false)
    }
  }

  return (
    <section className="min-h-[55vh] bg-[#fffdfa] px-4 py-9 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl lg:max-w-none">
        <Link to="/my-account" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-black/65 hover:text-primary">
          <LuArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to My account
        </Link>
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">Your account</p>
        <h1 className="text-2xl font-bold tracking-tight text-black">Profile information</h1>
        <p className="mt-2 text-sm text-black/65">Your profile details associated with this account.</p>

        <section aria-labelledby="profile-heading" className="mt-7 border border-peach-mid/50 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-peach-mid/40 pb-4">
            <div className="flex items-center gap-3">
              {user?.profile_photo ? (
                <img src={user.profile_photo} alt="Your profile" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-peach-light text-primary">
                  <LuUserRound aria-hidden="true" className="h-5 w-5" />
                </span>
              )}
              <div>
                <h2 id="profile-heading" className="font-bold text-black">Account details</h2>
                <p className="text-xs text-black/60">Personal information and profile photo</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label
                htmlFor="profile-photo"
                className={`cursor-pointer border border-primary px-4 py-2.5 text-sm font-semibold text-primary hover:bg-peach-light/40 ${isSavingPhoto ? 'pointer-events-none opacity-60' : ''}`}
              >
                {isSavingPhoto ? 'Saving photo…' : user?.profile_photo ? 'Change photo' : 'Add photo'}
              </label>
              <input
                id="profile-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={saveProfilePhoto}
                disabled={isSavingPhoto}
                className="sr-only"
              />
              {user?.profile_photo && (
                <button
                  type="button"
                  onClick={removeProfilePhoto}
                  disabled={isSavingPhoto}
                  className="text-sm font-semibold text-red-700 hover:underline disabled:opacity-60"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          {photoError && <p role="alert" className="mt-3 text-sm text-red-700">{photoError}</p>}
          {photoSuccess && <p role="status" className="mt-3 text-sm text-green-700">{photoSuccess}</p>}

          <dl className="mt-5 grid grid-cols-3 gap-3 sm:gap-5">
            <div>
              <dt className="text-xs font-bold text-black/70">Full name</dt>
              <dd className="mt-1 text-sm font-normal text-black">{name}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-black/70">Email address</dt>
              <dd className="mt-1 break-all text-sm font-normal text-black">{user?.email || 'Not provided'}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-black/70">Username</dt>
              <dd className="mt-1 text-sm font-normal text-black">{user?.username || 'Not provided'}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="location-heading" className="mt-7 border border-peach-mid/50 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3 border-b border-peach-mid/40 pb-4">
            <span className="flex h-11 w-11 items-center justify-center bg-peach-light text-primary">
              <LuMapPin aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 id="location-heading" className="font-bold text-black">Location</h2>
              <p className="text-xs text-black/60">Saved delivery details for your next order.</p>
            </div>
          </div>
          <form onSubmit={saveLocation} className="mt-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-black" htmlFor="profile-delivery-city">
                Town or city
                <input
                  id="profile-delivery-city"
                  autoComplete="address-level2"
                  value={locationForm.delivery_city}
                  onChange={event => setLocationForm(current => ({ ...current, delivery_city: event.target.value }))}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-medium text-black" htmlFor="profile-delivery-address">
                Street address
                <input
                  id="profile-delivery-address"
                  autoComplete="street-address"
                  value={locationForm.delivery_address}
                  onChange={event => setLocationForm(current => ({ ...current, delivery_address: event.target.value }))}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-medium text-black sm:col-span-2" htmlFor="profile-delivery-notes">
                Delivery notes <span className="font-normal text-black/60">(optional)</span>
                <textarea
                  id="profile-delivery-notes"
                  value={locationForm.delivery_notes}
                  onChange={event => setLocationForm(current => ({ ...current, delivery_notes: event.target.value }))}
                  rows={3}
                  className={`${inputClass} resize-y`}
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-black/60">
                {locationForm.location_latitude && locationForm.location_longitude
                  ? `GPS coordinates saved: ${locationForm.location_latitude}, ${locationForm.location_longitude}`
                  : 'GPS coordinates are optional and are not sent to a geocoding service.'}
              </div>
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  disabled={isFetchingLocation}
                  onClick={fetchLocation}
                  className="border border-primary px-4 py-3 text-sm font-semibold text-primary hover:bg-peach-light/40 disabled:opacity-60"
                >
                  {isFetchingLocation ? 'Fetching…' : 'Fetch device location'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingLocation}
                  className="bg-[#F58537] px-5 py-3 text-sm font-bold text-white hover:bg-[#e8742b] disabled:opacity-60"
                >
                  {isSavingLocation ? 'Saving…' : 'Save location'}
                </button>
              </div>
            </div>
            {locationError && <p role="alert" className="mt-3 text-sm text-red-700">{locationError}</p>}
            {locationSuccess && <p role="status" className="mt-3 text-sm text-green-700">{locationSuccess}</p>}
          </form>
        </section>

        <section aria-labelledby="change-details-heading" className="mt-7 border border-peach-mid/50 bg-white p-5 shadow-sm sm:p-7">
          <h2 id="change-details-heading" className="text-lg font-bold text-black">Change details</h2>
          <p className="mt-1 text-sm text-black/65">Update your name or change your account password.</p>

          <div className="mt-5 grid gap-7 border-t border-peach-mid/40 pt-5 lg:grid-cols-2">
          <form onSubmit={saveName} className="lg:border-r lg:border-peach-mid/50 lg:pr-7">
            <h3 className="font-semibold text-black">Name</h3>
            {!isNameEditing ? (
              <button
                type="button"
                onClick={() => {
                  setNameError('')
                  setNameSuccess('')
                  setIsNameEditing(true)
                }}
                className="mt-3 block ml-auto border border-primary px-5 py-3 text-sm font-bold text-primary transition-colors hover:bg-peach-light/40"
              >
                Change account name
              </button>
            ) : (
              <>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-black" htmlFor="profile-first-name">
                    First name
                    <input
                      id="profile-first-name"
                      autoComplete="given-name"
                      autoFocus
                      value={nameForm.first_name}
                      onChange={event => setNameForm(current => ({ ...current, first_name: event.target.value }))}
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-sm font-medium text-black" htmlFor="profile-last-name">
                    Last name
                    <input
                      id="profile-last-name"
                      autoComplete="family-name"
                      value={nameForm.last_name}
                      onChange={event => setNameForm(current => ({ ...current, last_name: event.target.value }))}
                      className={inputClass}
                    />
                  </label>
                </div>
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={isSavingName}
                    onClick={() => {
                      setNameForm({
                        first_name: user?.first_name || '',
                        last_name: user?.last_name || '',
                      })
                      setNameError('')
                      setIsNameEditing(false)
                    }}
                    className="border border-black/20 px-5 py-3 text-sm font-semibold text-black/70 hover:bg-black/5 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingName}
                    className="bg-[#F58537] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#e8742b] disabled:cursor-wait disabled:opacity-60"
                  >
                    {isSavingName ? 'Saving…' : 'Save name'}
                  </button>
                </div>
              </>
            )}
            {nameError && <p role="alert" className="mt-3 text-sm text-red-700">{nameError}</p>}
            {nameSuccess && <p role="status" className="mt-3 text-sm text-green-700">{nameSuccess}</p>}
          </form>

          <form
            onSubmit={passwordStep === 'verify' ? verifyCurrentPassword : changePassword}
            className="lg:pl-7"
          >
            <h3 className="font-semibold text-black">Password</h3>
            {passwordStep === 'closed' ? (
              <button
                type="button"
                onClick={() => {
                  setPasswordStep('verify')
                  setPasswordSuccess('')
                  setPasswordError('')
                }}
                className="mt-3 block ml-auto border border-primary px-5 py-3 text-sm font-bold text-primary transition-colors hover:bg-peach-light/40"
              >
                Change password
              </button>
            ) : (
              <div className="mt-3">
                {passwordStep === 'verify' ? (
                  <div className="grid gap-4 lg:grid-cols-2 lg:items-end lg:gap-6">
                    <label className="block text-sm font-medium text-black" htmlFor="profile-current-password">
                      Enter current password to continue
                      <input
                        id="profile-current-password"
                        type="password"
                        autoComplete="current-password"
                        required
                        autoFocus
                        value={passwordForm.current_password}
                        onChange={event => setPasswordForm(current => ({ ...current, current_password: event.target.value }))}
                        className={inputClass}
                      />
                    </label>
                    <p className="border-l-2 border-peach-mid/60 py-2 pl-4 text-sm leading-relaxed text-black/60">
                      Verify your current password here. Once confirmed, this field will be replaced with the new password fields.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-black" htmlFor="profile-new-password">
                      New password
                      <input
                        id="profile-new-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        autoFocus
                        value={passwordForm.new_password}
                        onChange={event => setPasswordForm(current => ({ ...current, new_password: event.target.value }))}
                        className={inputClass}
                      />
                    </label>
                    <label className="block text-sm font-medium text-black" htmlFor="profile-confirm-password">
                      Confirm new password
                      <input
                        id="profile-confirm-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={passwordForm.confirm_password}
                        onChange={event => setPasswordForm(current => ({ ...current, confirm_password: event.target.value }))}
                        className={inputClass}
                      />
                    </label>
                  </div>
                )}
              </div>
            )}
            {passwordError && <p role="alert" className="mt-3 text-sm text-red-700">{passwordError}</p>}
            {passwordSuccess && <p role="status" className="mt-3 text-sm text-green-700">{passwordSuccess}</p>}
            {passwordStep !== 'closed' && (
              <div className="mt-4 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  disabled={isSavingPassword}
                  onClick={passwordStep === 'verify' ? verifyCurrentPassword : changePassword}
                  className="bg-[#F58537] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#e8742b] disabled:cursor-wait disabled:opacity-60"
                >
                  {isSavingPassword
                    ? passwordStep === 'verify' ? 'Checking…' : 'Changing…'
                    : passwordStep === 'verify' ? 'Continue' : 'Save new password'}
                </button>
                <button
                  type="button"
                  disabled={isSavingPassword}
                  onClick={resetPasswordChange}
                  className="border border-black/20 px-5 py-3 text-sm font-semibold text-black/70 hover:bg-black/5 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
          </div>
        </section>

        <section aria-labelledby="account-actions-heading" className="mt-7 border border-peach-mid/50 bg-white p-5 shadow-sm sm:p-7">
          <h2 id="account-actions-heading" className="text-lg font-bold text-black">Account actions</h2>
          <p className="mt-1 text-sm text-black/65">Sign out or manage your account.</p>

          {accountActionError && (
            <p role="alert" className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {accountActionError}
            </p>
          )}

          <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-peach-mid/40 pt-5">
            <button
              type="button"
              disabled={isAccountActionPending}
              onClick={logOut}
              className="inline-flex items-center gap-2 border border-black/20 px-5 py-3 text-sm font-semibold text-black/75 hover:bg-black/5 disabled:cursor-wait disabled:opacity-60"
            >
              <LuLogOut aria-hidden="true" className="h-4 w-4" />
              {isAccountActionPending ? 'Please wait…' : 'Log out'}
            </button>
            <button
              type="button"
              disabled={isAccountActionPending}
              onClick={() => {
                setIsDeleteFormOpen(open => !open)
                setDeletePassword('')
                setDeleteAcknowledged(false)
                setAccountActionError('')
              }}
              className="inline-flex items-center gap-2 border border-red-300 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
            >
              <LuTrash2 aria-hidden="true" className="h-4 w-4" />
              Delete account
            </button>
          </div>

          {isDeleteFormOpen && (
            <form onSubmit={deleteAccount} className="mt-5 border-t border-red-200 bg-red-50/50 p-4 sm:p-5">
              <h3 className="font-semibold text-red-900">Confirm account deletion</h3>
              <p className="mt-1 text-sm text-red-800">
                Enter your password to permanently delete your account. Accounts with order history cannot be deleted.
              </p>
              <label className="mt-4 block text-sm font-medium text-black lg:max-w-md" htmlFor="delete-account-password">
                Current password
                <input
                  id="delete-account-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={deletePassword}
                  onChange={event => setDeletePassword(event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="mt-4 flex items-start gap-2 text-sm text-black/80">
                <input
                  type="checkbox"
                  required
                  checked={deleteAcknowledged}
                  onChange={event => setDeleteAcknowledged(event.target.checked)}
                  className="mt-1 accent-primary"
                />
                <span>I understand this action is permanent and I will lose access to this account.</span>
              </label>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isAccountActionPending}
                  onClick={() => {
                    setIsDeleteFormOpen(false)
                    setDeletePassword('')
                    setDeleteAcknowledged(false)
                    setAccountActionError('')
                  }}
                  className="border border-black/20 px-5 py-3 text-sm font-semibold text-black/70 hover:bg-white disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAccountActionPending || !deleteAcknowledged}
                  className="bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAccountActionPending ? 'Deleting…' : 'Permanently delete'}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </section>
  )
}
