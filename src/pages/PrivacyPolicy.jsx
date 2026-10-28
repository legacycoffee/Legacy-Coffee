import LegalPageLayout from '../components/LegalPageLayout.jsx'

const sections = [
  {
    heading: 'Information we collect',
    paragraphs: ['We collect information you choose to provide when you create an account, place an order, contact us, subscribe to email updates, or submit a product review. Depending on the feature, this may include your name, email address, phone number, delivery address, business name, message, and order details.'],
    items: [
      'Optional delivery coordinates, if you choose to provide or fetch them during sign-up or checkout.',
      'Product ratings and review text submitted from an account eligible to review a fulfilled purchase. Your reviewer username, rating, and review may be displayed publicly with the product.',
      'Newsletter email address and subscription status. Newsletter messages include an unsubscribe option.',
      'Product and channel information when a share event is recorded. The share event does not store your account identity or IP address.',
    ],
  },
  {
    heading: 'How we use information',
    paragraphs: ['We use information to provide account features, process and follow up on order requests, coordinate delivery, respond to inquiries, provide order and account notifications, manage newsletter subscriptions, and display product reviews. We also use it to protect and operate the service.'],
  },
  {
    heading: 'Storage on your device',
    paragraphs: ['This site uses browser local storage to keep you signed in and to retain your cart, checkout-related wholesale details, and latest order information between pages or visits. You can clear this data in your browser settings; doing so may sign you out or clear saved cart information.'],
  },
  {
    heading: 'Sharing and retention',
    paragraphs: ['We do not sell personal information. We share it with service providers as needed to operate the services described above, or when required to protect rights, comply with law, or respond to a valid legal request. We retain information for as long as needed to operate accounts, orders, support, and subscriptions, and to meet applicable legal or operational requirements.'],
  },
  {
    heading: 'Your choices and requests',
    paragraphs: ['You may update account details through your account features, unsubscribe from newsletter messages using the link in the email, and contact us with questions or requests about your information. We may need to verify your identity before acting on a request.'],
  },
  {
    heading: 'Children and policy changes',
    paragraphs: ['The site is intended for people able to use its shopping and account features; it is not designed to knowingly collect personal information from children. We may update this notice when our practices or services change. The latest revision date appears above.'],
  },
]

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      introduction="This notice explains how Legacy Coffee Uganda handles information when you use this website, place an order request, contact us, or subscribe to updates. It is a plain-language summary of our current site features, not legal advice."
      sections={sections}
    />
  )
}
