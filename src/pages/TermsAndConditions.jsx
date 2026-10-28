import LegalPageLayout from '../components/LegalPageLayout.jsx'

const sections = [
  {
    heading: 'Using this website',
    paragraphs: ['By using this website, you agree to use it lawfully and provide accurate information when creating an account, submitting an order request, or contacting us. Keep your sign-in details secure and notify us if you believe your account has been used without permission.'],
  },
  {
    heading: 'Products, prices, and availability',
    paragraphs: ['We aim to keep product descriptions, images, availability, and prices current, but information may change. Product images are illustrative. Prices shown are in Ugandan shillings unless stated otherwise. We may correct errors or update listings before confirming an order.'],
  },
  {
    heading: 'Order requests and delivery',
    paragraphs: ['Submitting an order through the website sends an order request to Legacy Coffee; it does not mean that the order has been accepted or paid for. Our team will review and confirm the request and arrange delivery details. Delivery costs and timing are confirmed separately. The pro forma invoice is for reference and does not indicate that payment has been collected.'],
  },
  {
    heading: 'Wholesale inquiries',
    paragraphs: ['Wholesale prices shown on the site may be estimates. Final pricing, quantities, availability, and delivery arrangements are confirmed by our team after receiving your inquiry or order request.'],
  },
  {
    heading: 'Accounts, reviews, and notifications',
    paragraphs: ['You are responsible for activity under your account and for keeping your contact details current. Reviews must be based on your own experience and may be submitted only for a product in your own order after that order is marked fulfilled. We may remove content that is unlawful, abusive, misleading, or unrelated to the product. Account and order notifications are provided through the site.'],
  },
  {
    heading: 'Newsletter',
    paragraphs: ['Newsletter subscription is optional. You can unsubscribe using the link in any newsletter message. Subscription and unsubscribe status are managed through the site.'],
  },
  {
    heading: 'Website availability and content',
    paragraphs: ['We work to keep the website available and accurate, but do not guarantee uninterrupted access or that every feature will always be error-free. Website text, design, and materials may not be copied or used in a way that infringes our rights or the rights of others.'],
  },
  {
    heading: 'Changes and contact',
    paragraphs: ['We may update these terms as our services change. The latest revision date appears above. For questions about these terms or an order request, contact info@legacycoffee.org or use our contact page.'],
  },
]

export default function TermsAndConditions() {
  return (
    <LegalPageLayout
      title="Terms and Conditions"
      introduction=""
      sections={sections}
    />
  )
}
