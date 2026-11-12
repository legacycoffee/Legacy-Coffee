import { products } from './products.js'
import { getProductUrl } from '../utils/productUrl.js'

const defaultImage = 'https://res.cloudinary.com/adfm8lvp/image/upload/v1792498215/Legacy_logo.png'
export const canonicalOrigin = 'https://legacycoffee.org'

export const defaultSeo = {
  path: '/',
  title: 'Legacy Coffee Limited | Fresh Roasted Coffee & Wholesale',
  description: 'Discover quality Ugandan coffee from Legacy Coffee in Kyenjojo. Shop freshly roasted Arabica and Robusta coffee, coffee seedlings and wholesale coffee.',
  keywords: 'Legacy Coffee, Ugandan coffee, coffee Kyenjojo, roasted coffee Uganda, Arabica coffee Uganda, Robusta coffee Uganda, wholesale coffee Uganda, coffee seedlings Uganda',
  image: defaultImage,
  imageAlt: 'Legacy Coffee logo',
}

const fixedSeoPages = [
  defaultSeo,
  {
    path: '/coffee-farm',
    title: 'Visit Our Coffee Farm in Uganda | Legacy Coffee',
    description: 'Visit Legacy Coffee Farm in Kyenjojo, Uganda, for educational coffee tours, hands-on coffee experiences and coffee tasting. Explore sustainable farming and buy quality coffee seedlings.',
    keywords: 'coffee farm tours Uganda, coffee farm visits Uganda, coffee farm Kyenjojo, coffee tourism Uganda, educational coffee tours Uganda, coffee farming experience Uganda, coffee farm experience Western Uganda, sustainable coffee farming Uganda, regenerative coffee farming Uganda, coffee processing Uganda, coffee harvesting Uganda, coffee farm tasting Uganda, school coffee tours Uganda, coffee seedlings for sale Uganda, buy coffee seedlings Uganda, Robusta coffee seedlings Uganda, approved coffee seedlings Uganda, Legacy Coffee Farm, Ugandan coffee farm, farm to cup coffee experience',
    image: 'https://res.cloudinary.com/adfm8lvp/image/upload/v1792508243/coffee_farm.jpg',
    imageAlt: 'Legacy Coffee farm in Uganda',
  },
  {
    path: '/services',
    title: 'Coffee Farming Services Uganda | Legacy Coffee',
    description: 'Are You Looking for Coffee Farming Services in Uganda? Are you an NGO, company or individual looking for coffee research, farmer training or professional coffee farm setup services? Legacy Coffee is here to help. Get in touch with us today!',
    keywords: 'coffee farming services Uganda, coffee consultancy Uganda, coffee research Uganda, coffee feasibility studies Uganda, coffee farmer training Uganda, agricultural extension services Uganda, coffee farm setup Uganda, coffee farm management Uganda, Robusta coffee farming Uganda, sustainable coffee farming Uganda, coffee farmer mapping Uganda, coffee supply chain research Uganda, coffee agronomy Uganda, farmer outreach Uganda, coffee development projects Uganda, coffee farm planning Kyenjojo, Legacy Coffee services, coffee agricultural services Uganda',
    image: 'https://res.cloudinary.com/vgko5mna/image/upload/v1793259784/farm_4.jpg',
    imageAlt: 'Coffee farm in Kyenjojo District, Uganda',
  },
  {
    path: '/about',
    title: 'About Legacy Coffee | Ugandan Coffee, Sustainability & Community',
    description: 'Discover the story behind Legacy Coffee, transforming the coffee value chain through farmer empowerment, quality coffee production, sustainable practices and community development.',
    keywords: 'Legacy Coffee, Ugandan coffee company, coffee company Uganda, sustainable coffee Uganda, Ugandan coffee farmers, smallholder coffee farmers Uganda, farmer empowerment Uganda, coffee farming Western Uganda, coffee production Uganda, ethical coffee sourcing Uganda, coffee from Kyenjojo, Rwenzori coffee, community development Uganda, sustainable agriculture Uganda, Arabica coffee Uganda, Robusta coffee Uganda, coffee value chain Uganda, women empowerment coffee Uganda, youth empowerment Uganda, quality Ugandan coffee',
    image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600',
    imageAlt: 'Coffee beans featured in the Legacy Coffee hero',
  },
  {
    path: '/about/patrick-muhereza',
    title: 'Patrick Muhereza and Legacy Coffee | Uganda Robusta',
    description: 'Discover how Legacy Coffee founder Patrick Muhereza works with smallholder farmers to improve Robusta coffee quality, incomes, and access to global markets.',
    image: 'https://res.cloudinary.com/vgko5mna/image/upload/v1792754496/Pato.jpg',
    imageAlt: 'Patrick Muhereza, founder of Legacy Coffee',
  },
  {
    path: '/wholesale',
    title: 'Ugandan Coffee Wholesale | Legacy Coffee',
    description: 'Buy Ugandan Robusta and Arabica coffee wholesale from Legacy Coffee. Explore our coffee and request wholesale pricing for your business.',
    image: defaultImage,
    imageAlt: 'Coffee from Legacy Coffee Limited',
  },
  {
    path: '/contact',
    title: 'Contact Legacy Coffee | Kyenjojo, Uganda',
    description: 'Contact Legacy Coffee in Butiiti, Kyenjojo District, Uganda, about coffee, wholesale orders, farm visits, or partnerships.',
    image: 'https://res.cloudinary.com/vgko5mna/image/upload/v1792767454/contact_image.png',
    imageAlt: 'Contact Legacy Coffee in Uganda',
  },
  {
    path: '/newsletter',
    title: 'Legacy Coffee Newsletter | Coffee News from Uganda',
    description: 'Subscribe to Legacy Coffee updates for coffee news, product releases, and stories from our Ugandan farming community.',
    image: defaultImage,
    imageAlt: 'Coffee farm in Uganda',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | Legacy Coffee',
    description: 'Read how Legacy Coffee collects, uses, and protects personal information when you use our website and services.',
    image: defaultImage,
    imageAlt: 'Legacy Coffee',
  },
  {
    path: '/terms-and-conditions',
    title: 'Terms and Conditions | Legacy Coffee',
    description: 'Review the terms and conditions for using the Legacy Coffee website, ordering products, and requesting services.',
    image: defaultImage,
    imageAlt: 'Legacy Coffee',
  },
  {
    path: '/cookies',
    title: 'Cookie Policy | Legacy Coffee',
    description: 'Learn how Legacy Coffee uses cookies and manages your website storage preferences.',
    image: defaultImage,
    imageAlt: 'Legacy Coffee',
  },
]

const productSeoPages = products.flatMap(product => {
  const page = {
    title: `${product.name} | Ugandan Coffee | Legacy Coffee`,
    description: product.description,
    image: product.image,
    imageAlt: product.imageAlt,
    type: 'product',
  }

  return [{ path: getProductUrl(product), ...page }]
})

export const seoPages = [...fixedSeoPages, ...productSeoPages]

export const privateSeoPages = [
  { path: '/admin', title: 'Admin Dashboard | Legacy Coffee' },
  { path: '/cart', title: 'Shopping Cart | Legacy Coffee' },
  { path: '/checkout', title: 'Checkout | Legacy Coffee' },
  { path: '/confirm', title: 'Order Confirmation | Legacy Coffee' },
  { path: '/my-orders', title: 'My Orders | Legacy Coffee' },
  { path: '/my-account', title: 'My Account | Legacy Coffee' },
  { path: '/wishlist', title: 'My Wishlist | Legacy Coffee' },
  { path: '/notifications', title: 'Notifications | Legacy Coffee' },
  { path: '/profile', title: 'My Profile | Legacy Coffee' },
  { path: '/signin', title: 'Sign In | Legacy Coffee' },
  { path: '/signup', title: 'Create an Account | Legacy Coffee' },
  { path: '/review', title: 'Coffee Review | Legacy Coffee' },
]

export function getSeoMetadata(pathname) {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  const page = seoPages.find(item => item.path === normalizedPath)
  if (page) return page

  if (normalizedPath.startsWith('/products/')) {
    return { ...defaultSeo, title: 'Ugandan Coffee Products | Legacy Coffee' }
  }

  const privatePage = privateSeoPages.find(item => (
    normalizedPath.toLowerCase() === item.path
    || normalizedPath.toLowerCase().startsWith(`${item.path}/`)
  ))
  if (privatePage) {
    return { ...defaultSeo, ...privatePage, keywords: undefined, robots: 'noindex,nofollow' }
  }

  return { ...defaultSeo, title: 'Page Not Found | Legacy Coffee', keywords: undefined, robots: 'noindex,follow' }
}