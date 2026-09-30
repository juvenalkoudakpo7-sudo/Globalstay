import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  ArrowLeft, ArrowRight, BedDouble, Building2, CalendarCheck2, CalendarDays,
  CarFront, CircleUserRound, Film, Heart, House, MapPin, Search, ShieldCheck,
  Sparkles, Star, Trees, Utensils, Users, Wrench, X, type LucideIcon,
} from 'lucide-react'
import './globalstay.css'
import { loadLocal, saveLocal } from './localStore'
import { loadListingVideo, saveListingVideo } from './videoStore'

type Category = 'Hôtels' | 'Villas' | 'Voitures' | 'Restaurants' | 'Taxis' | 'Services' | 'Expériences' | 'Maisons' | 'Terrains'
type Currency = 'EUR' | 'XOF' | 'USD' | 'GBP' | 'AED' | 'JPY' | 'CAD' | 'IDR'

type Listing = {
  id: number
  category: Category
  title: string
  location: string
  rating: string
  reviews: number
  price: number
  currency?: Currency
  unit: string
  image: string
  badge?: string
  description?: string
  amenities?: string[]
  owner?: string
  verified?: boolean
  hasVideo?: boolean
}

type GuestProfile = { name: string; email: string }

type LocalBooking = {
  id: number
  listingId: number
  title: string
  category: Category
  arrival: string
  departure: string
  guests: number
  total: number
  currency?: Currency
  contactName: string
  contactEmail: string
  paymentMethod: 'Sur place' | 'Mobile Money (simulation)' | 'Carte bancaire (simulation)' | 'PayPal (simulation)'
  paymentStatus: 'À confirmer' | 'Simulation uniquement'
  serviceTime?: string
  pickupLocation?: string
  dropoffLocation?: string
  quantityLabel?: string
  requestType: 'séjour' | 'visite' | 'restaurant' | 'taxi' | 'service' | 'experience'
  status: 'Demande envoyée' | 'Confirmée' | 'Refusée' | 'Annulée'
}

type LocalNotification = {
  id: number
  title: string
  message: string
  createdAt: string
  read: boolean
}

const requestLabels: Record<LocalBooking['requestType'], string> = {
  'séjour': 'Séjour / location',
  visite: 'Visite immobilière',
  restaurant: 'Réservation restaurant',
  taxi: 'Course de taxi',
  service: 'Service à domicile',
  experience: 'Expérience locale',
}

type LocalReview = {
  id: number
  listingId: number
  name: string
  rating: number
  comment: string
  date: string
}

const today = new Date().toLocaleDateString('sv-SE')

const amenitiesByCategory: Record<Category, string[]> = {
  'Hôtels': ['Wi-Fi', 'Petit-déjeuner', 'Réception 24h/24', 'Climatisation'],
  'Villas': ['Piscine', 'Wi-Fi', 'Cuisine équipée', 'Parking'],
  'Voitures': ['Climatisation', 'Assistance incluse', 'Kilométrage inclus'],
  'Restaurants': ['Cuisine locale', 'Réservation de table', 'Menu à confirmer'],
  'Taxis': ['Trajet porte-à-porte', 'Tarif estimatif', 'Chauffeur à confirmer'],
  'Services': ['Intervention planifiée', 'Durée à choisir', 'Prestataire à confirmer'],
  'Expériences': ['Guide local', 'Petit groupe', 'Réservation à confirmer'],
  'Maisons': ['Jardin', 'Parking', 'Quartier résidentiel'],
  'Terrains': ['Titre foncier à vérifier', 'Accès routier', 'Zone résidentielle'],
}

const descriptionsByCategory: Record<Category, string> = {
  'Hôtels': 'Un accueil attentif, une adresse idéalement située et tout le confort pour profiter pleinement de votre séjour.',
  'Villas': 'Posez vos valises dans un lieu soigneusement choisi, pensé pour ralentir, se retrouver et découvrir la région.',
  'Voitures': 'Un véhicule confortable pour explorer à votre rythme, avec remise des clés organisée avec le propriétaire.',
  'Restaurants': 'Choisissez votre date et votre heure préférées. Le restaurant doit confirmer la disponibilité de la table.',
  'Taxis': 'Indiquez votre heure de départ et vos adresses. Le chauffeur et le tarif final restent à confirmer.',
  'Services': 'Planifiez une intervention avec un prestataire local. La durée et les détails restent à confirmer.',
  'Expériences': 'Découvrez une activité guidée proposée par des hôtes locaux. Le programme et les places restent à confirmer.',
  'Maisons': 'Une propriété sélectionnée pour son emplacement et son potentiel. Organisez une visite pour la découvrir sur place.',
  'Terrains': 'Une parcelle proposée à titre indicatif. Faites vérifier le titre foncier, le bornage et l’urbanisme avant toute décision.',
}

const imageByCategory: Record<Category, string> = {
  'Hôtels': 'photo-1566073771259-6a8506099945',
  'Villas': 'photo-1613490493576-7fde63acd811',
  'Voitures': 'photo-1503376780353-7e6692767b70',
  'Restaurants': 'photo-1414235077428-338989a2e8c0',
  'Taxis': 'photo-1549317661-bd32c8ce0db2',
  'Services': 'photo-1581578731548-c64695cc6952',
  'Expériences': 'photo-1555939594-58d7cb561ad1',
  'Maisons': 'photo-1600596542815-ffad4c1539a9',
  'Terrains': 'photo-1500382017468-9049fed747ef',
}

const unitByCategory: Record<Category, string> = {
  'Hôtels': 'nuit',
  'Villas': 'nuit',
  'Voitures': 'jour',
  'Restaurants': 'par personne',
  'Taxis': 'trajet estimé',
  'Services': 'par heure',
  'Expériences': 'par personne',
  'Maisons': 'prix total',
  'Terrains': 'prix total',
}

const currencies: Currency[] = ['EUR', 'USD', 'GBP', 'XOF', 'AED', 'JPY', 'CAD', 'IDR']

const formatPrice = (amount: number, currency: Currency = 'EUR') =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: ['XOF', 'JPY', 'IDR'].includes(currency) ? 0 : 2,
  }).format(amount)

const categories: { label: Category; icon: LucideIcon }[] = [
  { label: 'Hôtels', icon: BedDouble },
  { label: 'Villas', icon: House },
  { label: 'Voitures', icon: CarFront },
  { label: 'Restaurants', icon: Utensils },
  { label: 'Taxis', icon: CarFront },
  { label: 'Services', icon: Wrench },
  { label: 'Expériences', icon: Sparkles },
  { label: 'Maisons', icon: Building2 },
  { label: 'Terrains', icon: Trees },
]

const listings: Listing[] = [
  { id: 1, category: 'Hôtels', title: 'Hôtel & Spa Les Almadies', location: 'Dakar, Sénégal', rating: '4,92', reviews: 128, price: 99000, currency: 'XOF', unit: 'nuit', image: 'photo-1566073771259-6a8506099945', badge: 'Très apprécié' },
  { id: 2, category: 'Villas', title: 'Villa Saly, les pieds dans l’eau', location: 'Saly, Sénégal', rating: '4,98', reviews: 64, price: 150000, currency: 'XOF', unit: 'nuit', image: 'photo-1613490493576-7fde63acd811', badge: 'Coup de cœur' },
  { id: 3, category: 'Voitures', title: 'Mercedes-Benz Classe C', location: 'Aéroport de Dakar, Sénégal', rating: '4,89', reviews: 37, price: 55000, currency: 'XOF', unit: 'jour', image: 'photo-1503376780353-7e6692767b70' },
  { id: 4, category: 'Maisons', title: 'Maison contemporaine avec jardin', location: 'Ngor, Dakar, Sénégal', rating: '4,96', reviews: 22, price: 260000000, currency: 'XOF', unit: 'prix total', image: 'photo-1600596542815-ffad4c1539a9', badge: 'Nouveau' },
  { id: 5, category: 'Terrains', title: 'Parcelle résidentielle à la Somone', location: 'La Somone, Sénégal', rating: '4,85', reviews: 16, price: 32000000, currency: 'XOF', unit: 'prix total', image: 'photo-1500382017468-9049fed747ef' },
  { id: 6, category: 'Hôtels', title: 'La Maison Abaka', location: 'Ngor, Dakar, Sénégal', rating: '4,87', reviews: 93, price: 78000, currency: 'XOF', unit: 'nuit', image: 'photo-1571896349842-33c89424de2d' },
  { id: 7, category: 'Villas', title: 'Villa baobab, patio & piscine', location: 'Somone, Sénégal', rating: '4,91', reviews: 41, price: 125000, currency: 'XOF', unit: 'nuit', image: 'photo-1600210492486-724fe5c67fb0' },
  { id: 8, category: 'Voitures', title: 'Toyota RAV4 hybride', location: 'Dakar, Sénégal', rating: '4,95', reviews: 29, price: 45000, currency: 'XOF', unit: 'jour', image: 'photo-1519641471654-76ce0107ad1b', badge: 'Économique' },
  { id: 9, category: 'Maisons', title: 'Maison de ville, terrasse ensoleillée', location: 'Almadies, Dakar, Sénégal', rating: '4,9', reviews: 18, price: 185000000, currency: 'XOF', unit: 'prix total', image: 'photo-1600047509807-ba8f99d2cdde' },
  { id: 10, category: 'Terrains', title: 'Terrain arboré proche de l’océan', location: 'Popenguine, Sénégal', rating: '4,88', reviews: 12, price: 24000000, currency: 'XOF', unit: 'prix total', image: 'photo-1518837695005-2083093ee35b' },
  { id: 11, category: 'Restaurants', title: 'Le Jardin d’Ébène', location: 'Plateau, Dakar, Sénégal', rating: '4,9', reviews: 76, price: 21000, currency: 'XOF', unit: 'par personne', image: 'photo-1414235077428-338989a2e8c0', badge: 'Cuisine locale' },
  { id: 12, category: 'Taxis', title: 'Transfert AIBD · Dakar', location: 'Dakar, Sénégal', rating: '4,92', reviews: 54, price: 23000, currency: 'XOF', unit: 'trajet estimé', image: 'photo-1549317661-bd32c8ce0db2', badge: 'Chauffeur à confirmer' },
  { id: 13, category: 'Services', title: 'Ménage et intendance à domicile', location: 'Almadies, Dakar, Sénégal', rating: '4,86', reviews: 31, price: 16000, currency: 'XOF', unit: 'par heure', image: 'photo-1581578731548-c64695cc6952', badge: 'À planifier' },
  { id: 14, category: 'Services', title: 'Conciergerie et courses', location: 'Dakar, Sénégal', rating: '4,91', reviews: 24, price: 13000, currency: 'XOF', unit: 'par heure', image: 'photo-1556911220-e15b29be8c8f' },
  { id: 15, category: 'Expériences', title: 'Atelier de cuisine sénégalaise', location: 'Dakar, Sénégal', rating: '4,98', reviews: 42, price: 36000, currency: 'XOF', unit: 'par personne', image: 'photo-1555939594-58d7cb561ad1', badge: 'Petit groupe' },
  { id: 16, category: 'Expériences', title: 'Balade guidée sur l’île de Gorée', location: 'Dakar, Sénégal', rating: '4,95', reviews: 68, price: 26000, currency: 'XOF', unit: 'par personne', image: 'photo-1500530855697-b586d89ba3ee', badge: 'Guide local' },
  { id: 17, category: 'Hôtels', title: 'Maison des Jardins', location: 'Paris, France', rating: '4,91', reviews: 86, price: 185, currency: 'EUR', unit: 'nuit', image: 'photo-1542314831-068cd1dbfeeb', badge: 'Centre historique' },
  { id: 18, category: 'Hôtels', title: 'Harbor House', location: 'New York, États-Unis', rating: '4,88', reviews: 104, price: 265, currency: 'USD', unit: 'nuit', image: 'photo-1566073771259-6a8506099945' },
  { id: 19, category: 'Villas', title: 'Villa Ubud, jardin tropical', location: 'Ubud, Indonésie', rating: '4,97', reviews: 53, price: 2800000, currency: 'IDR', unit: 'nuit', image: 'photo-1613490493576-7fde63acd811' },
  { id: 20, category: 'Voitures', title: 'Mini Cooper · centre de Londres', location: 'Londres, Royaume-Uni', rating: '4,9', reviews: 38, price: 78, currency: 'GBP', unit: 'jour', image: 'photo-1503376780353-7e6692767b70' },
  { id: 21, category: 'Restaurants', title: 'Trattoria San Luca', location: 'Rome, Italie', rating: '4,93', reviews: 62, price: 48, currency: 'EUR', unit: 'par personne', image: 'photo-1414235077428-338989a2e8c0', badge: 'Cuisine romaine' },
  { id: 22, category: 'Taxis', title: 'Transfert aéroport · Heathrow', location: 'Londres, Royaume-Uni', rating: '4,9', reviews: 91, price: 68, currency: 'GBP', unit: 'trajet estimé', image: 'photo-1549317661-bd32c8ce0db2' },
  { id: 23, category: 'Services', title: 'Conciergerie de quartier', location: 'Toronto, Canada', rating: '4,86', reviews: 29, price: 42, currency: 'CAD', unit: 'par heure', image: 'photo-1556911220-e15b29be8c8f' },
  { id: 24, category: 'Expériences', title: 'Cérémonie du thé et balade', location: 'Kyoto, Japon', rating: '4,98', reviews: 71, price: 8500, currency: 'JPY', unit: 'par personne', image: 'photo-1500530855697-b586d89ba3ee', badge: 'Guide local' },
  { id: 25, category: 'Villas', title: 'Maison avec piscine · Palm Jumeirah', location: 'Dubaï, Émirats arabes unis', rating: '4,94', reviews: 47, price: 1900, currency: 'AED', unit: 'nuit', image: 'photo-1600596542815-ffad4c1539a9' },
  { id: 26, category: 'Maisons', title: 'Maison lumineuse à Alfama', location: 'Lisbonne, Portugal', rating: '4,89', reviews: 35, price: 395000, currency: 'EUR', unit: 'prix total', image: 'photo-1600047509807-ba8f99d2cdde' },
]

const featuredDestinations = [
  { city: 'Paris', country: 'France', image: 'photo-1502602898657-3e91760cbb34' },
  { city: 'New York', country: 'États-Unis', image: 'photo-1534430480872-3498386e7856' },
  { city: 'Londres', country: 'Royaume-Uni', image: 'photo-1513635269975-59663e0ac1ad' },
  { city: 'Tokyo', country: 'Japon', image: 'photo-1540959733332-eab4deabeeaf' },
  { city: 'Lisbonne', country: 'Portugal', image: 'photo-1555881400-74d7acaacd8b' },
  { city: 'Dubaï', country: 'Émirats arabes unis', image: 'photo-1512453979798-5ea266f8880c' },
]

const homepageHighlights = listings.filter((listing) => [21, 23, 24].includes(listing.id))

const galleryByCategory: Record<Category, string[]> = {
  'Hôtels': ['photo-1566073771259-6a8506099945', 'photo-1571896349842-33c89424de2d', 'photo-1542314831-068cd1dbfeeb', 'photo-1578774204375-826dc5d996ed'],
  'Villas': ['photo-1613490493576-7fde63acd811', 'photo-1600210492486-724fe5c67fb0', 'photo-1600607687939-ce8a6c25118c', 'photo-1600596542815-ffad4c1539a9'],
  'Voitures': ['photo-1503376780353-7e6692767b70', 'photo-1492144534655-ae79c964c9d7', 'photo-1507136566006-cfc505b114fc', 'photo-1489824904134-891ab64532f1'],
  'Restaurants': ['photo-1414235077428-338989a2e8c0', 'photo-1559339352-11d035aa65de', 'photo-1517248135467-4c7edcad34c4', 'photo-1552566626-52f8b828add9'],
  'Taxis': ['photo-1549317661-bd32c8ce0db2', 'photo-1449965408869-eaa3f722e40d', 'photo-1541899481282-d53bffe3c35d', 'photo-1511919884226-fd3cad34687c'],
  'Services': ['photo-1581578731548-c64695cc6952', 'photo-1556911220-e15b29be8c8f', 'photo-1527515637462-cff94eecc1ac', 'photo-1584622650111-993a426fbf0a'],
  'Expériences': ['photo-1555939594-58d7cb561ad1', 'photo-1500530855697-b586d89ba3ee', 'photo-1513364776144-60967b0f800f', 'photo-1507003211169-0a1dd7228f2d'],
  'Maisons': ['photo-1600596542815-ffad4c1539a9', 'photo-1600047509807-ba8f99d2cdde', 'photo-1600607687939-ce8a6c25118c', 'photo-1600566753086-00f18fb6b3ea'],
  'Terrains': ['photo-1500382017468-9049fed747ef', 'photo-1518837695005-2083093ee35b', 'photo-1500530855697-b586d89ba3ee', 'photo-1470770841072-f978cf4d019e'],
}

const imageUrl = (photo: string, width = 720) =>
  `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=${width}&q=85`

function App() {
  const initialStandalonePage = window.location.pathname === '/favoris' ? 'favorites' : window.location.pathname === '/mes-demandes' ? 'requests' : null
  const [standalonePage, setStandalonePage] = useState<'favorites' | 'requests' | null>(initialStandalonePage)
  const [activeCategory, setActiveCategory] = useState<Category | 'Tout'>('Tout')
  const [destination, setDestination] = useState('')
  const [appliedDestination, setAppliedDestination] = useState('')
  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [serviceTime, setServiceTime] = useState('19:00')
  const [pickupLocation, setPickupLocation] = useState('')
  const [dropoffLocation, setDropoffLocation] = useState('')
  const [guests, setGuests] = useState('2')
  const [favorites, setFavorites] = useState<number[]>(() => loadLocal('favorites', []))
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [requestSubmitted, setRequestSubmitted] = useState(false)
  const [userListings, setUserListings] = useState<Listing[]>(() => loadLocal('listings', []))
  const [bookings, setBookings] = useState<LocalBooking[]>(() => loadLocal<LocalBooking[]>('bookings', []).map((booking) => ({
    ...booking,
    currency: booking.currency || 'EUR',
    paymentMethod: booking.paymentMethod || 'Sur place',
    paymentStatus: booking.paymentStatus || 'À confirmer',
  })))
  const [reviews, setReviews] = useState<LocalReview[]>(() => loadLocal('reviews', []))
  const [profile, setProfile] = useState<GuestProfile | null>(() => loadLocal('profile', null))
    const [notifications, setNotifications] = useState<LocalNotification[]>(() => loadLocal('notifications', []))
  const [accountOpen, setAccountOpen] = useState(false)
  const [bookingsOpen, setBookingsOpen] = useState(false)
    const [hostDashboardOpen, setHostDashboardOpen] = useState(false)
    const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [hostOpen, setHostOpen] = useState(() => window.location.pathname === '/deposer-annonce')
  const [maxPrice, setMaxPrice] = useState('')
  const [budgetCurrency, setBudgetCurrency] = useState<Currency>('EUR')
  const [sortBy, setSortBy] = useState<'recommended' | 'price-low' | 'price-high'>('recommended')
  const [requestError, setRequestError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<LocalBooking['paymentMethod']>('Sur place')
  const [lastBookingId, setLastBookingId] = useState<number | null>(null)
  const [receiptBooking, setReceiptBooking] = useState<LocalBooking | null>(null)
  const [hostSubmitted, setHostSubmitted] = useState(false)
  const [reviewRating, setReviewRating] = useState('5')
  const [reviewComment, setReviewComment] = useState('')
  const [profileName, setProfileName] = useState(profile?.name ?? '')
  const [profileEmail, setProfileEmail] = useState(profile?.email ?? '')
  const [newListingTitle, setNewListingTitle] = useState('')
  const [newListingCategory, setNewListingCategory] = useState<Category>('Villas')
  const [newListingLocation, setNewListingLocation] = useState('')
  const [newListingPrice, setNewListingPrice] = useState('')
  const [newListingDescription, setNewListingDescription] = useState('')
  const [hostVideo, setHostVideo] = useState<File | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const [listingVideo, setListingVideo] = useState<{ id: number; url: string | null; status: 'ready' | 'missing' } | null>(null)
  const [videoError, setVideoError] = useState('')

  useEffect(() => saveLocal('favorites', favorites), [favorites])
  useEffect(() => saveLocal('listings', userListings), [userListings])
  useEffect(() => saveLocal('bookings', bookings), [bookings])
  useEffect(() => saveLocal('reviews', reviews), [reviews])
  useEffect(() => saveLocal('profile', profile), [profile])
  useEffect(() => saveLocal('notifications', notifications), [notifications])
  useEffect(() => saveLocal('notifications', notifications), [notifications])
  useEffect(() => {
    if (!selectedListing?.hasVideo) return

    let isActive = true
    let objectUrl: string | null = null
    loadListingVideo(selectedListing.id).then((video) => {
      if (!isActive) return
      if (!video) {
        setListingVideo({ id: selectedListing.id, url: null, status: 'missing' })
        return
      }
      objectUrl = URL.createObjectURL(video)
      setListingVideo({ id: selectedListing.id, url: objectUrl, status: 'ready' })
    }).catch(() => {
      if (isActive) setListingVideo({ id: selectedListing.id, url: null, status: 'missing' })
    })

    return () => {
      isActive = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [selectedListing?.hasVideo, selectedListing?.id])
  useEffect(() => () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl)
  }, [videoPreviewUrl])
  useEffect(() => {
    const syncListingRoute = () => {
      if (window.location.pathname === '/favoris' || window.location.pathname === '/mes-demandes') {
        setSelectedListing(null)
        setHostOpen(false)
        setStandalonePage(window.location.pathname === '/favoris' ? 'favorites' : 'requests')
        return
      }
      setStandalonePage(null)
      if (window.location.pathname === '/deposer-annonce') {
        setSelectedListing(null)
        setHostOpen(true)
        return
      }
      setHostOpen(false)
      const match = window.location.pathname.match(/^\/annonce\/(\d+)$/)
      if (!match) {
        setSelectedListing(null)
        return
      }
      const routeListing = [...listings, ...userListings].find((listing) => listing.id === Number(match[1]))
      setSelectedListing(routeListing || null)
    }
    window.addEventListener('popstate', syncListingRoute)
    if (window.location.pathname.startsWith('/annonce/') || window.location.pathname === '/deposer-annonce' || window.location.pathname === '/favoris' || window.location.pathname === '/mes-demandes') syncListingRoute()
    return () => window.removeEventListener('popstate', syncListingRoute)
  }, [userListings])
  useEffect(() => {
    if (!hostOpen && window.location.pathname === '/deposer-annonce') {
      window.history.replaceState({}, '', '/')
    }
  }, [hostOpen])
  useEffect(() => {
    if (hostOpen) document.querySelector('.host-dialog .dialog-close')?.setAttribute('aria-label', 'Retour à Global Stay')
  }, [hostOpen])

  const visibleListings = useMemo(() => {
    const query = appliedDestination.trim().toLocaleLowerCase('fr')
    const hasValidDates = arrival !== '' && departure !== '' && arrival < departure
    const filtered = [...listings, ...userListings].filter((listing) => {
      const categoryMatches = activeCategory === 'Tout' || listing.category === activeCategory
      const queryMatches = !query || `${listing.title} ${listing.location} ${listing.category}`.toLocaleLowerCase('fr').includes(query)
      const favoriteMatches = !favoritesOnly || favorites.includes(listing.id)
      const priceMatches = !maxPrice || (listing.currency || 'EUR') === budgetCurrency && listing.price <= Number(maxPrice)
      const availabilityMatches = !hasValidDates || !bookings.some((booking) =>
        booking.listingId === listing.id
        && booking.status !== 'Annulée'
        && booking.status !== 'Refusée'
        && booking.arrival < departure
        && booking.departure > arrival,
      )
      return categoryMatches && queryMatches && favoriteMatches && priceMatches && availabilityMatches
    })
    if (sortBy === 'price-low') return filtered.sort((first, second) => {
      const currencyOrder = (first.currency || 'EUR').localeCompare(second.currency || 'EUR')
      return currencyOrder || first.price - second.price
    })
    if (sortBy === 'price-high') return filtered.sort((first, second) => {
      const currencyOrder = (first.currency || 'EUR').localeCompare(second.currency || 'EUR')
      return currencyOrder || second.price - first.price
    })
    return filtered
  }, [activeCategory, appliedDestination, arrival, bookings, budgetCurrency, departure, favorites, favoritesOnly, maxPrice, sortBy, userListings])

  const favoriteListings = useMemo(() => [...listings, ...userListings].filter((listing) => favorites.includes(listing.id)), [favorites, userListings])

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAppliedDestination(destination)
    setFavoritesOnly(false)
    setShowAll(false)
    document.getElementById('explorer')?.scrollIntoView({ behavior: 'smooth' })
  }

  const exploreDestination = (city: string) => {
    setDestination(city)
    setAppliedDestination(city)
    setActiveCategory('Tout')
    setFavoritesOnly(false)
    setShowAll(true)
    document.getElementById('explorer')?.scrollIntoView({ behavior: 'smooth' })
  }

  const setCategory = (category: Category | 'Tout') => {
    setActiveCategory(category)
    setFavoritesOnly(false)
    setShowAll(false)
  }

  const openListingPage = (listing: Listing) => {
    window.history.pushState({}, '', `/annonce/${listing.id}`)
    setSelectedListing(listing)
    setRequestSubmitted(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeListingPage = () => {
    if (window.location.pathname.startsWith('/annonce/')) window.history.pushState({}, '', '/')
    setSelectedListing(null)
    setRequestSubmitted(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openStandalonePage = (page: 'favorites' | 'requests') => {
    const path = page === 'favorites' ? '/favoris' : '/mes-demandes'
    window.history.pushState({}, '', path)
    setSelectedListing(null)
    setHostOpen(false)
    setStandalonePage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeStandalonePage = () => {
    window.history.pushState({}, '', '/')
    setStandalonePage(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleFavorite = (id: number) => {
    setFavorites((current) => current.includes(id)
      ? current.filter((favorite) => favorite !== id)
      : [...current, id])
  }

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextProfile = { name: profileName.trim(), email: profileEmail.trim() }
    setProfile(nextProfile)
    setAccountOpen(false)
  }

  const updateBookingStatus = (bookingId: number, status: 'Confirmée' | 'Refusée') => {
    const booking = bookings.find((item) => item.id === bookingId)
    if (!booking) return
    setBookings((current) => current.map((item) => item.id === bookingId ? { ...item, status } : item))
    setNotifications((current) => [{
      id: Date.now() + Math.random(),
      title: status === 'Confirmée' ? 'Demande confirmée' : 'Demande refusée',
      message: `${requestLabels[booking.requestType]} · ${booking.title}`,
      createdAt: new Date().toLocaleString('fr-FR'),
      read: false,
    }, ...current])
  }

  const submitRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedListing) return

    const isVisit = selectedListing.category === 'Maisons' || selectedListing.category === 'Terrains'
    const isRestaurant = selectedListing.category === 'Restaurants'
    const isTaxi = selectedListing.category === 'Taxis'
    const isService = selectedListing.category === 'Services'
    const isExperience = selectedListing.category === 'Expériences'
    const isOvernightOrRental = !isVisit && !isRestaurant && !isTaxi && !isService && !isExperience
    const conflict = isOvernightOrRental && bookings.some((booking) =>
      booking.listingId === selectedListing.id
      && booking.status !== 'Annulée'
      && booking.status !== 'Refusée'
      && booking.arrival < departure
      && booking.departure > arrival,
    )
    if (conflict) {
      setRequestError('Ces dates ne sont plus disponibles dans vos demandes enregistrées. Choisissez une autre période.')
      return
    }

    const requestDate = isVisit ? visitDate : arrival
    const start = new Date(`${requestDate}T00:00:00`).getTime()
    const end = new Date(`${(isOvernightOrRental ? departure : requestDate) || requestDate}T00:00:00`).getTime()
    const days = Math.max(1, Math.round((end - start) / 86_400_000))
    const quantity = Number(guests)
    const quantityLabel = isVisit
      ? quantity === 1 ? 'personne' : 'personnes'
      : isRestaurant
        ? quantity === 1 ? 'couvert' : 'couverts'
        : isTaxi
          ? quantity === 1 ? 'passager' : 'passagers'
          : isService
            ? quantity === 1 ? 'heure' : 'heures'
            : isExperience
              ? quantity === 1 ? 'participant' : 'participants'
              : quantity === 1 ? 'voyageur' : 'voyageurs'
    const booking: LocalBooking = {
      id: Date.now(),
      listingId: selectedListing.id,
      title: selectedListing.title,
      category: selectedListing.category,
      arrival: requestDate,
      departure: isOvernightOrRental ? departure : '',
      guests: quantity,
      total: isVisit || isTaxi
        ? selectedListing.price
        : isRestaurant || isExperience || isService
          ? selectedListing.price * quantity
          : selectedListing.price * days,
          currency: selectedListing.currency || 'EUR',
      contactName: profileName.trim(),
      contactEmail: profileEmail.trim(),
      paymentMethod: isVisit ? 'Sur place' : paymentMethod,
      paymentStatus: 'À confirmer',
      serviceTime: isRestaurant || isTaxi ? serviceTime : undefined,
      pickupLocation: isTaxi ? pickupLocation.trim() : undefined,
      dropoffLocation: isTaxi ? dropoffLocation.trim() : undefined,
      quantityLabel,
      requestType: isVisit ? 'visite' : isRestaurant ? 'restaurant' : isTaxi ? 'taxi' : isService ? 'service' : isExperience ? 'experience' : 'séjour',
      status: 'Demande envoyée',
    }
    setBookings((current) => [booking, ...current])
    setNotifications((current) => [{
      id: Date.now() + 1,
      title: 'Nouvelle demande à traiter',
      message: `${requestLabels[booking.requestType]} · ${booking.title}`,
      createdAt: new Date().toLocaleString('fr-FR'),
      read: false,
    }, ...current])
    setLastBookingId(booking.id)
    setProfile({ name: booking.contactName, email: booking.contactEmail })
    setRequestError('')
    setRequestSubmitted(true)
  }

  const submitReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedListing) return
    setReviews((current) => [{
      id: Date.now(),
      listingId: selectedListing.id,
      name: profile?.name || profileName.trim() || 'Voyageur',
      rating: Number(reviewRating),
      comment: reviewComment.trim(),
      date: new Date().toLocaleDateString('fr-FR'),
    }, ...current])
    setReviewComment('')
  }

  const reviewSummary = (listing: Listing) => {
    const localReviews = reviews.filter((review) => review.listingId === listing.id)
    const count = listing.reviews + localReviews.length
    if (count === 0) return { rating: listing.rating, count }
    const seededRating = Number(listing.rating.replace(',', '.')) || 0
    const total = seededRating * listing.reviews + localReviews.reduce((sum, review) => sum + review.rating, 0)
    return { rating: (total / count).toFixed(2).replace('.', ','), count }
  }

  const completedBooking = bookings.find((booking) => booking.id === lastBookingId)
  const unreadNotificationCount = notifications.filter((notification) => !notification.read).length
  const currentListingVideo = selectedListing?.hasVideo && listingVideo?.id === selectedListing.id ? listingVideo : null
  const selectedGallery = selectedListing
    ? [...new Set([selectedListing.image, ...galleryByCategory[selectedListing.category]])].slice(0, 5)
    : []
  const selectedIsVisit = selectedListing?.category === 'Maisons' || selectedListing?.category === 'Terrains'
  const selectedIsRestaurant = selectedListing?.category === 'Restaurants'
  const selectedIsTaxi = selectedListing?.category === 'Taxis'
  const selectedIsService = selectedListing?.category === 'Services'
  const selectedIsExperience = selectedListing?.category === 'Expériences'
  const selectedNeedsTime = selectedIsRestaurant || selectedIsTaxi || selectedIsService || selectedIsExperience
  const selectedNeedsStayDates = Boolean(selectedListing && !selectedIsVisit && !selectedNeedsTime)

  const submitListing = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const listingId = Date.now()
    const save = async () => {
      if (hostVideo) await saveListingVideo(listingId, hostVideo)
      const listing: Listing = {
        id: listingId,
        category: newListingCategory,
        title: newListingTitle.trim(),
        location: newListingLocation.trim(),
        rating: 'Nouveau',
        reviews: 0,
        price: Number(newListingPrice),
        currency: 'EUR',
        unit: unitByCategory[newListingCategory],
        image: imageByCategory[newListingCategory],
        badge: hostVideo ? 'Vidéo · à vérifier' : 'À vérifier',
        description: newListingDescription.trim() || descriptionsByCategory[newListingCategory],
        amenities: amenitiesByCategory[newListingCategory],
        owner: profileName.trim(),
        verified: false,
        hasVideo: Boolean(hostVideo),
      }
      setUserListings((current) => [listing, ...current])
      setProfile({ name: profileName.trim(), email: profileEmail.trim() })
      setHostVideo(null)
      setVideoPreviewUrl(null)
      setVideoError('')
      setHostSubmitted(true)
    }
    void save().catch(() => setVideoError('La vidéo n’a pas pu être enregistrée. Réessayez avec un fichier MP4 ou WebM plus petit.'))
  }

  const handleVideoSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    if (!file) return
    if (!['video/mp4', 'video/webm'].includes(file.type)) {
      setVideoError('Choisissez une vidéo au format MP4 ou WebM.')
      setHostVideo(null)
      setVideoPreviewUrl(null)
      event.currentTarget.value = ''
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      setVideoError('La vidéo doit faire 50 Mo maximum.')
      setHostVideo(null)
      setVideoPreviewUrl(null)
      event.currentTarget.value = ''
      return
    }
    setVideoError('')
    setHostVideo(file)
    setVideoPreviewUrl(URL.createObjectURL(file))
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <a aria-label="Global Stay, accueil" className="brand" href={selectedListing || hostOpen || standalonePage ? '/' : '#top'} onClick={(event) => { if (selectedListing) { event.preventDefault(); closeListingPage() } else if (hostOpen) { event.preventDefault(); setHostOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) } else if (standalonePage) { event.preventDefault(); closeStandalonePage() } }}>
          <span className="brand-mark"><MapPin size={18} strokeWidth={2.5} /></span>
          <span>global<span className="brand-light">stay</span></span>
        </a>
        <div className="header-actions">
          <button aria-label={`Favoris${favorites.length ? `, ${favorites.length} enregistrés` : ''}`} aria-pressed={standalonePage === 'favorites'} className={standalonePage === 'favorites' ? 'saved-link is-active' : 'saved-link'} onClick={() => openStandalonePage('favorites')} title="Favoris" type="button">
            <Heart size={17} fill={favoritesOnly ? 'currentColor' : 'none'} /><span>Favoris</span>
            {favorites.length > 0 && <span className="favorite-count">{favorites.length}</span>}
          </button>
          <button aria-label={`Mes demandes${bookings.length ? `, ${bookings.length}` : ''}`} className={standalonePage === 'requests' ? 'requests-link is-active' : 'requests-link'} onClick={() => openStandalonePage('requests')} title="Mes demandes" type="button"><CalendarCheck2 size={17} /><span>Mes demandes</span>{bookings.length > 0 && <span className="favorite-count">{bookings.length}</span>}</button>
          <button aria-label={profile ? `Mon compte, ${profile.name}` : 'Mon compte'} className="account-link" onClick={() => setAccountOpen(true)} title="Mon compte" type="button"><CircleUserRound size={17} /><span>{profile?.name || 'Mon compte'}</span></button>
          <button aria-label="Déposer une annonce" className="host-link" onClick={() => { window.history.pushState({}, '', '/deposer-annonce'); setHostOpen(true); setHostSubmitted(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }} title="Déposer une annonce" type="button">Déposer <span>une annonce</span> <ArrowRight size={15} /></button>
        </div>
      </header>

      <main className={selectedListing || hostOpen || standalonePage ? 'home-content is-hidden' : 'home-content'} id="top">
        <section className="hero" aria-labelledby="hero-title">
          <img alt="Maison de vacances ouverte sur un jardin tropical" className="hero-image" fetchPriority="high" src={imageUrl('photo-1510798831971-661eb04b3739', 2000)} />
          <div className="hero-shade" />
          <div className="hero-content">
            <p className="eyebrow"><span /> LE MONDE, À VOTRE FAÇON</p>
            <h1 id="hero-title">L’ailleurs<br />vous va bien.</h1>
            <p className="hero-copy">Un séjour, une maison, une voiture. Tout commence ici.</p>
            <a className="hero-link" href="#explorer">Explorer les adresses <ArrowRight size={16} /></a>
          </div>
          <div className="hero-note"><span>01</span><span>Des adresses choisies, des horizons sans limites</span></div>
        </section>

        <form className="search-panel" onSubmit={handleSearch}>
          <div className="category-tabs" role="tablist" aria-label="Que recherchez-vous ?">
            <button aria-selected={activeCategory === 'Tout'} className={activeCategory === 'Tout' ? 'category-tab is-selected' : 'category-tab'} onClick={() => setCategory('Tout')} role="tab" type="button">Tout</button>
            {categories.map(({ label, icon: Icon }) => (
              <button aria-selected={activeCategory === label} className={activeCategory === label ? 'category-tab is-selected' : 'category-tab'} key={label} onClick={() => setCategory(label)} role="tab" type="button"><Icon size={17} strokeWidth={1.8} /> {label}</button>
            ))}
          </div>
          <div className="search-fields">
            <label className="search-field destination-field"><MapPin size={18} /><span><strong>Destination</strong><input onChange={(event) => setDestination(event.target.value)} placeholder="Ville, région…" value={destination} /></span></label>
            <label className="search-field date-field"><CalendarDays size={18} /><span><strong>Arrivée</strong><input aria-label="Date d’arrivée" min={today} onChange={(event) => setArrival(event.target.value)} type="date" value={arrival} /></span></label>
            <label className="search-field date-field"><CalendarDays size={18} /><span><strong>Départ</strong><input aria-label="Date de départ" min={arrival || today} onChange={(event) => setDeparture(event.target.value)} type="date" value={departure} /></span></label>
            <label className="search-field guests-field"><Users size={18} /><span><strong>Voyageurs</strong><input aria-label="Nombre de voyageurs" min="1" onChange={(event) => setGuests(event.target.value)} type="number" value={guests} /></span></label>
            <button className="search-button" type="submit"><Search size={19} /><span>Rechercher</span></button>
          </div>
        </form>

        <section className="explore-section" id="explorer">
          <div className="section-heading">
            <div>
              <p className="eyebrow eyebrow-dark"><span /> LE BON ENDROIT VOUS ATTEND</p>
              <h2>{favoritesOnly ? 'Vos adresses préférées' : appliedDestination ? `À découvrir : ${appliedDestination}` : 'Des lieux qui restent avec vous.'}</h2>
              <p className="section-subtitle">Sélection Global Stay · Destinations dans le monde</p>
            </div>
            <div className="section-tools">
              <span className="result-count">{visibleListings.length} adresse{visibleListings.length === 1 ? '' : 's'}</span>
              <label className="sort-control"><span>Trier</span><select aria-label="Trier les annonces" onChange={(event) => setSortBy(event.target.value as typeof sortBy)} value={sortBy}><option value="recommended">Recommandé</option><option value="price-low">Prix croissant</option><option value="price-high">Prix décroissant</option></select></label>
              <label className="price-control"><span>Devise</span><select aria-label="Devise du budget" onChange={(event) => { setBudgetCurrency(event.target.value as Currency); setMaxPrice('') }} value={budgetCurrency}>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label>
              <label className="price-control"><span>Budget max.</span><select aria-label="Budget maximum" onChange={(event) => setMaxPrice(event.target.value)} value={maxPrice}><option value="">Sans limite</option>{[100, 500, 1000, 5000, 50000].map((amount) => <option key={amount} value={amount}>{formatPrice(amount, budgetCurrency)}</option>)}</select></label>
              <button className="all-link" onClick={() => { setShowAll((current) => !current); if (favoritesOnly) setFavoritesOnly(false) }} type="button">{showAll ? 'Voir moins' : 'Tout explorer'} <ArrowRight size={16} /></button>
            </div>
          </div>
          <div className="quick-categories" aria-label="Explorer par catégorie">
            <button className={activeCategory === 'Tout' ? 'quick-chip is-current' : 'quick-chip'} onClick={() => setCategory('Tout')} type="button">Tout découvrir</button>
            {categories.map(({ label, icon: Icon }) => <button className={activeCategory === label ? 'quick-chip is-current' : 'quick-chip'} key={label} onClick={() => setCategory(label)} type="button"><Icon size={15} />{label}</button>)}
          </div>

          {visibleListings.length > 0 ? (
            <div className="listing-grid">
              {(showAll ? visibleListings : visibleListings.slice(0, 5)).map((listing) => (
                <article className="listing-card" key={listing.id}>
                  <button className="listing-image-link" onClick={() => openListingPage(listing)} type="button" aria-label={`Découvrir ${listing.title}`}>
                    <img alt={listing.title} className="listing-image" loading="lazy" src={imageUrl(listing.image)} />
                    {listing.badge && <span className="listing-badge">{listing.badge}</span>}
                    {listing.hasVideo && <span className="video-flag"><Film size={13} /> Vidéo</span>}
                    <span className="image-index">{String(listing.id).padStart(2, '0')}</span>
                  </button>
                  <button aria-label={favorites.includes(listing.id) ? `Retirer ${listing.title} des favoris` : `Ajouter ${listing.title} aux favoris`} aria-pressed={favorites.includes(listing.id)} className={favorites.includes(listing.id) ? 'favorite-button is-saved' : 'favorite-button'} onClick={() => toggleFavorite(listing.id)} type="button"><Heart size={19} fill={favorites.includes(listing.id) ? 'currentColor' : 'none'} /></button>
                  <div className="listing-details">
                    <div className="listing-meta"><span>{listing.category.slice(0, -1)}</span><span className="rating"><Star size={13} fill="currentColor" /> {reviewSummary(listing).rating} <span className="review-count">({reviewSummary(listing).count})</span></span></div>
                    <h3>{listing.title}</h3>
                    <p className="listing-location"><MapPin size={13} />{listing.location}</p>
                    <p className="listing-price"><strong>{formatPrice(listing.price, listing.currency)}</strong> / {listing.unit}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state"><Search size={25} /><h3>{favoritesOnly ? 'Aucun favori pour le moment' : 'Aucune adresse disponible'}</h3><p>Essayez une autre destination, un autre budget ou une autre période.</p><button onClick={() => { setAppliedDestination(''); setDestination(''); setArrival(''); setDeparture(''); setMaxPrice(''); setFavoritesOnly(false); setActiveCategory('Tout') }} type="button">Réinitialiser les filtres</button></div>
          )}
        </section>

        <section className="destinations-section" aria-labelledby="destinations-title">
          <div className="destinations-heading">
            <div><p className="eyebrow eyebrow-dark"><span /> DES IDÉES POUR PARTIR</p><h2 id="destinations-title">Explorer le monde</h2></div>
            <span>Des adresses à découvrir, partout.</span>
          </div>
          <div className="destinations-grid">
            {featuredDestinations.map((destinationCard) => {
              const listingCount = [...listings, ...userListings].filter((listing) => listing.location.toLocaleLowerCase('fr').includes(destinationCard.city.toLocaleLowerCase('fr'))).length
              return <button className="destination-card" key={destinationCard.city} onClick={() => exploreDestination(destinationCard.city)} type="button"><img alt={`Destination ${destinationCard.city}`} loading="lazy" src={imageUrl(destinationCard.image, 760)} /><span className="destination-shade" /><span className="destination-copy"><strong>{destinationCard.city}</strong><span>{destinationCard.country} · {listingCount} adresse{listingCount === 1 ? '' : 's'}</span></span><ArrowRight className="destination-arrow" size={18} /></button>
            })}
          </div>
        </section>

        <section className="highlights-section" aria-labelledby="highlights-title">
          <div className="highlights-heading"><div><p className="eyebrow eyebrow-dark"><span /> DES IDÉES À VIVRE</p><h2 id="highlights-title">À découvrir maintenant</h2></div><span>Tables, expériences et services autour du monde</span></div>
          <div className="highlights-grid">
            {homepageHighlights.map((listing) => <button className="highlight-card" key={listing.id} onClick={() => openListingPage(listing)} type="button"><span className="highlight-image"><img alt={listing.title} loading="lazy" src={imageUrl(listing.image, 900)} />{listing.badge && <span className="listing-badge">{listing.badge}</span>}</span><span className="highlight-copy"><span>{listing.category} · {listing.location}</span><strong>{listing.title}</strong><span className="highlight-price">{formatPrice(listing.price, listing.currency)} / {listing.unit}<ArrowRight size={15} /></span></span></button>)}
          </div>
        </section>

        <section className="host-banner" id="host">
          <div className="host-copy">
            <p className="eyebrow"><span /> ENSEMBLE, ON VA PLUS LOIN</p>
            <h2>Votre adresse a<br />sa place ici.</h2>
            <p>Faites découvrir votre logement, votre voiture ou votre terrain à de nouveaux voyageurs.</p>
            <a className="host-button" href="#explorer">Explorer les annonces <ArrowRight size={16} /></a>
          </div>
          <img alt="Terrasse ouverte sur la mer au coucher du soleil" loading="lazy" src={imageUrl('photo-1499793983690-e29da59ef1c2', 1200)} />
        </section>
      </main>

      {standalonePage === 'favorites' && (
        <main className="standalone-page" aria-labelledby="favorites-page-title">
          <div className="standalone-container">
            <div className="standalone-toolbar"><button className="back-link" onClick={closeStandalonePage} type="button"><ArrowLeft size={17} /> Retour à Global Stay</button><span className="standalone-count">{favoriteListings.length} adresse{favoriteListings.length === 1 ? '' : 's'} enregistrée{favoriteListings.length === 1 ? '' : 's'}</span></div>
            <header className="standalone-heading"><p className="eyebrow eyebrow-dark"><span /> VOS SÉLECTIONS</p><h1 id="favorites-page-title">Vos favoris</h1><p>Retrouvez ici les adresses que vous souhaitez garder sous la main.</p></header>
            {favoriteListings.length === 0 ? <div className="standalone-empty"><Heart size={28} /><h2>Votre liste est vide</h2><p>Ajoutez une adresse avec le cœur pour la retrouver ici.</p><button className="standalone-action" onClick={closeStandalonePage} type="button">Explorer les annonces</button></div> : <div className="standalone-listing-grid">{favoriteListings.map((listing) => <article className="listing-card" key={listing.id}><button className="listing-image-link" onClick={() => openListingPage(listing)} type="button" aria-label={`Ouvrir ${listing.title}`}><img alt={listing.title} className="listing-image" loading="lazy" src={imageUrl(listing.image)} />{listing.badge && <span className="listing-badge">{listing.badge}</span>}</button><button aria-label={`Retirer ${listing.title} des favoris`} className="favorite-button is-saved" onClick={() => toggleFavorite(listing.id)} type="button"><Heart size={19} fill="currentColor" /></button><div className="listing-details"><div className="listing-meta"><span>{listing.category.slice(0, -1)}</span><span className="rating"><Star size={13} fill="currentColor" /> {reviewSummary(listing).rating}</span></div><h3>{listing.title}</h3><p className="listing-location"><MapPin size={13} />{listing.location}</p><p className="listing-price"><strong>{formatPrice(listing.price, listing.currency)}</strong> / {listing.unit}</p></div></article>)}</div>}
          </div>
        </main>
      )}

      {standalonePage === 'requests' && (
        <main className="standalone-page" aria-labelledby="requests-page-title">
          <div className="standalone-container requests-page-container">
            <div className="standalone-toolbar"><button className="back-link" onClick={closeStandalonePage} type="button"><ArrowLeft size={17} /> Retour à Global Stay</button><span className="standalone-count">{bookings.length} demande{bookings.length === 1 ? '' : 's'}</span></div>
            <header className="standalone-heading"><p className="eyebrow eyebrow-dark"><span /> VOTRE ESPACE</p><h1 id="requests-page-title">Mes demandes</h1><p>Suivez vos séjours, tables, taxis, services et expériences depuis un seul endroit.</p></header>
            <div className="standalone-request-actions"><button onClick={() => { setHostDashboardOpen(true) }} type="button">Espace hôte · gérer les demandes</button><button onClick={() => { setNotificationsOpen(true); setNotifications((current) => current.map((notification) => ({ ...notification, read: true }))) }} type="button">Notifications{unreadNotificationCount > 0 ? ` · ${unreadNotificationCount} nouvelle(s)` : ''}</button></div>
            {bookings.length === 0 ? <div className="standalone-empty"><CalendarCheck2 size={28} /><h2>Aucune demande pour le moment</h2><p>Vos réservations et demandes de visite apparaîtront ici.</p><button className="standalone-action" onClick={closeStandalonePage} type="button">Commencer à explorer</button></div> : <div className="standalone-booking-list">{bookings.map((booking) => <article className="standalone-booking-item" key={booking.id}><div className="standalone-booking-main"><span className="booking-kind">{requestLabels[booking.requestType]}</span><h2>{booking.title}</h2><p>{booking.arrival}{booking.departure ? ` → ${booking.departure}` : ''}{booking.serviceTime ? ` · ${booking.serviceTime}` : ''} · {booking.guests} {booking.quantityLabel || (booking.guests === 1 ? 'personne' : 'personnes')}</p>{booking.requestType === 'taxi' && <p className="booking-route">{booking.pickupLocation} → {booking.dropoffLocation}</p>}<strong>{formatPrice(booking.total, booking.currency)} estimés</strong><span className="booking-payment">{booking.paymentMethod} · {booking.paymentStatus}</span></div><div className="standalone-booking-side"><span className={`standalone-status status-${booking.status.toLocaleLowerCase().replaceAll(' ', '-')}`}>{booking.status}</span><button className="receipt-link" onClick={() => setReceiptBooking(booking)} type="button">Voir le reçu</button>{(booking.status === 'Demande envoyée' || booking.status === 'Confirmée') && <button className="standalone-cancel" onClick={() => setBookings((current) => current.map((item) => item.id === booking.id ? { ...item, status: 'Annulée' } : item))} type="button">Annuler</button>}</div></article>)}</div>}
          </div>
        </main>
      )}

      {selectedListing && (
        <main className="product-page" id="product-page">
          <div className="product-container">
            <div className="product-toolbar">
              <button className="back-link" onClick={closeListingPage} type="button"><ArrowLeft size={17} /> Retour aux résultats</button>
              <button aria-pressed={favorites.includes(selectedListing.id)} className={favorites.includes(selectedListing.id) ? 'product-favorite is-saved' : 'product-favorite'} onClick={() => toggleFavorite(selectedListing.id)} type="button"><Heart size={17} fill={favorites.includes(selectedListing.id) ? 'currentColor' : 'none'} />{favorites.includes(selectedListing.id) ? 'Enregistré' : 'Ajouter aux favoris'}</button>
            </div>
            <header className="product-heading">
              <div><p className="product-kicker">{selectedListing.category} <span>·</span> {selectedListing.location}</p><h1 id="listing-dialog-title">{selectedListing.title}</h1><div className="product-rating"><Star size={15} fill="currentColor" /> <strong>{reviewSummary(selectedListing).rating}</strong><span>({reviewSummary(selectedListing).count} avis)</span><span>·</span><MapPin size={14} /><span>{selectedListing.location}</span></div></div>
              <span className={selectedListing.verified ? 'verification-status is-verified' : 'verification-status'}><ShieldCheck size={15} />{selectedListing.verified ? 'Annonce vérifiée' : 'Vérification en attente'}</span>
            </header>
            <section aria-label="Photos de l’annonce" className="product-gallery">
              <img alt={`${selectedListing.title}, vue principale`} className="gallery-cover" src={imageUrl(selectedGallery[0], 1200)} />
              <div className="gallery-secondary">{selectedGallery.slice(1, 5).map((photo, index) => <img alt={`${selectedListing.title}, photo ${index + 2}`} key={`${photo}-${index}`} loading="lazy" src={imageUrl(photo, 680)} />)}</div>
            </section>
            <div className="product-layout">
              <div className="product-information">
                {selectedListing.hasVideo && <section className="product-section listing-video-panel"><h2><Film size={17} /> Visite vidéo</h2>{currentListingVideo?.url ? <video aria-label={`Vidéo de ${selectedListing.title}`} controls playsInline preload="metadata" src={currentListingVideo.url} /> : <p>{currentListingVideo?.status === 'missing' ? 'Vidéo enregistrée sur un autre appareil ou indisponible.' : 'Chargement de la vidéo…'}</p>}</section>}
                <section className="product-section product-host"><div className="host-avatar"><CircleUserRound size={24} /></div><div><h2>Proposé par {selectedListing.owner || 'un partenaire Global Stay'}</h2><p>{selectedListing.verified ? 'Profil partenaire vérifié' : 'Profil partenaire en attente de vérification'}</p></div></section>
                <section className="product-section"><h2>À propos de cette annonce</h2><p className="product-description">{selectedListing.description || descriptionsByCategory[selectedListing.category]}</p><div className="product-highlights"><span><MapPin size={17} /><strong>Destination</strong>{selectedListing.location}</span><span><CalendarDays size={17} /><strong>Disponibilité</strong>À confirmer avec le prestataire</span><span><ShieldCheck size={17} /><strong>Réservation</strong>Demande avec confirmation requise</span></div></section>
                <section className="product-section"><h2>Ce que propose cette annonce</h2><div className="product-amenities">{(selectedListing.amenities || amenitiesByCategory[selectedListing.category]).map((amenity) => <span key={amenity}><span className="amenity-check">✓</span>{amenity}</span>)}</div></section>
                <section className="product-section location-section"><h2>Emplacement</h2><p><MapPin size={16} />{selectedListing.location}</p><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedListing.location)}`} rel="noreferrer" target="_blank">Voir la zone sur la carte <ArrowRight size={14} /></a></section>
                <section className="product-section"><h2>À savoir</h2><p className="product-description">La disponibilité, les conditions d’annulation et les éventuels frais supplémentaires sont à confirmer auprès du prestataire avant tout engagement.</p></section>
                <section className="product-section product-reviews"><h2>Avis voyageurs <span>({reviewSummary(selectedListing).count})</span></h2>{reviews.filter((review) => review.listingId === selectedListing.id).length > 0 ? reviews.filter((review) => review.listingId === selectedListing.id).map((review) => <article className="review-item" key={review.id}><strong>{review.name}</strong><span><Star size={12} fill="currentColor" /> {review.rating}/5 · {review.date}</span><p>{review.comment}</p></article>) : <p className="product-description">Les avis seront publiés après une demande enregistrée.</p>}{bookings.some((booking) => booking.listingId === selectedListing.id && booking.requestType !== 'visite' && booking.status !== 'Annulée' && booking.status !== 'Refusée') && <form className="review-form" onSubmit={submitReview}><label>Votre note<select onChange={(event) => setReviewRating(event.target.value)} value={reviewRating}><option value="5">5 · Excellent</option><option value="4">4 · Très bien</option><option value="3">3 · Bien</option><option value="2">2 · Moyen</option><option value="1">1 · À éviter</option></select></label><label>Votre avis<textarea maxLength={400} onChange={(event) => setReviewComment(event.target.value)} required value={reviewComment} /></label><button type="submit">Publier mon avis</button></form>}</section>
              </div>
              <aside className="product-booking">
                <div className="product-booking-panel">
                  <div className="product-price"><strong>{formatPrice(selectedListing.price, selectedListing.currency)}</strong><span> / {selectedListing.unit}</span></div>
                  <div className="booking-rating"><Star size={14} fill="currentColor" /> {reviewSummary(selectedListing).rating} <span>· {reviewSummary(selectedListing).count} avis</span></div>
                  {requestSubmitted ? <div className="request-confirmation" role="status"><span className="confirmation-mark">✓</span><h3>{completedBooking?.requestType === 'visite' ? 'Demande de visite enregistrée' : completedBooking?.requestType === 'restaurant' ? 'Demande de table enregistrée' : completedBooking?.requestType === 'taxi' ? 'Demande de taxi enregistrée' : completedBooking?.requestType === 'service' ? 'Demande de service enregistrée' : completedBooking?.requestType === 'experience' ? 'Demande d’expérience enregistrée' : 'Demande enregistrée'}</h3><p>Estimation : {completedBooking ? formatPrice(completedBooking.total, completedBooking.currency) : ''}. Aucune réservation n’est confirmée.</p>{completedBooking?.requestType !== 'visite' && completedBooking?.paymentStatus === 'À confirmer' && <button className="payment-demo-button" onClick={() => setBookings((current) => current.map((booking) => booking.id === completedBooking.id ? { ...booking, paymentStatus: 'Simulation uniquement' } : booking))} type="button">Simuler le paiement · aucun débit</button>}<button className="dialog-submit" onClick={() => setBookingsOpen(true)} type="button">Voir mes demandes</button></div> : <form className="request-form" onSubmit={submitRequest}><h3>{selectedIsVisit ? 'Organiser une visite' : selectedIsRestaurant ? 'Réserver une table' : selectedIsTaxi ? 'Réserver un taxi' : selectedIsService ? 'Planifier un service' : selectedIsExperience ? 'Réserver une expérience' : 'Demander une réservation'}</h3><div className="request-fields"><label>{selectedIsVisit ? 'Date de visite' : selectedIsRestaurant ? 'Date souhaitée' : selectedIsTaxi ? 'Date du trajet' : selectedIsService ? 'Date du service' : selectedIsExperience ? 'Date de l’expérience' : 'Arrivée'}<input min={today} onChange={(event) => selectedIsVisit ? setVisitDate(event.target.value) : setArrival(event.target.value)} required type="date" value={selectedIsVisit ? visitDate : arrival} /></label><label>{selectedIsVisit ? 'Personnes' : selectedIsRestaurant ? 'Couverts' : selectedIsTaxi ? 'Passagers' : selectedIsService ? 'Durée (heures)' : selectedIsExperience ? 'Participants' : 'Voyageurs'}<input min="1" onChange={(event) => setGuests(event.target.value)} required type="number" value={guests} /></label></div>{selectedNeedsTime && <label className="service-time-field">Heure souhaitée<input onChange={(event) => setServiceTime(event.target.value)} required type="time" value={serviceTime} /></label>}{selectedIsTaxi && <div className="route-fields"><label>Adresse de prise en charge<input autoComplete="street-address" onChange={(event) => setPickupLocation(event.target.value)} placeholder="Adresse de départ" required value={pickupLocation} /></label><label>Destination<input onChange={(event) => setDropoffLocation(event.target.value)} placeholder="Adresse d’arrivée" required value={dropoffLocation} /></label></div>}{selectedNeedsStayDates && <label className="departure-field">Départ<input min={arrival || today} onChange={(event) => setDeparture(event.target.value)} required type="date" value={departure} /></label>}<div className="contact-fields"><label>Votre nom<input autoComplete="name" onChange={(event) => setProfileName(event.target.value)} required value={profileName} /></label><label>E-mail de contact<input autoComplete="email" onChange={(event) => setProfileEmail(event.target.value)} required type="email" value={profileEmail} /></label></div>{selectedListing.category !== 'Maisons' && selectedListing.category !== 'Terrains' && <label className="payment-select">Mode de règlement<select onChange={(event) => setPaymentMethod(event.target.value as LocalBooking['paymentMethod'])} value={paymentMethod}><option value="Sur place">À confirmer avec le prestataire</option><option value="Carte bancaire (simulation)">Carte bancaire · simulation</option><option value="PayPal (simulation)">PayPal · simulation</option><option value="Mobile Money (simulation)">Mobile Money · simulation</option></select></label>}{requestError && <p className="form-error" role="alert">{requestError}</p>}<button className="dialog-submit" type="submit">{selectedIsVisit ? 'Demander une visite' : selectedIsRestaurant ? 'Demander une table' : selectedIsTaxi ? 'Demander le taxi' : selectedIsService ? 'Demander ce service' : selectedIsExperience ? 'Réserver cette expérience' : 'Envoyer la demande'} <ArrowRight size={16} /></button><p className="demo-note">Demande indicative. Le prestataire doit confirmer la disponibilité et le prix final.</p></form>}
                </div>
              </aside>
            </div>
          </div>
        </main>
      )}

      {accountOpen && <div className="modal-backdrop" onClick={() => setAccountOpen(false)}><section aria-labelledby="account-title" aria-modal="true" className="compact-dialog" onClick={(event) => event.stopPropagation()} role="dialog"><button aria-label="Fermer" className="dialog-close" onClick={() => setAccountOpen(false)} type="button"><X size={20} /></button><p className="dialog-kicker">ESPACE PERSONNEL · DÉMO LOCALE</p><h2 id="account-title">{profile ? 'Votre profil' : 'Créer votre profil'}</h2><form className="account-form" onSubmit={saveProfile}><label>Nom complet<input autoComplete="name" onChange={(event) => setProfileName(event.target.value)} required value={profileName} /></label><label>Adresse e-mail<input autoComplete="email" onChange={(event) => setProfileEmail(event.target.value)} required type="email" value={profileEmail} /></label><p className="demo-note">Aucun compte serveur n’est créé. Ces coordonnées sont stockées sans chiffrement dans ce navigateur : utilisez des données fictives.</p><button className="dialog-submit" type="submit">Enregistrer le profil</button></form>{profile && <p className="account-summary">{bookings.length} demande{bookings.length === 1 ? '' : 's'} · {userListings.length} annonce{userListings.length === 1 ? '' : 's'} déposée{userListings.length === 1 ? '' : 's'}</p>}</section></div>}

      {hostDashboardOpen && (
        <div className="modal-backdrop" onClick={() => setHostDashboardOpen(false)}>
          <section aria-labelledby="host-dashboard-title" aria-modal="true" className="compact-dialog requests-dialog" onClick={(event) => event.stopPropagation()} role="dialog">
            <button aria-label="Fermer" className="dialog-close" onClick={() => setHostDashboardOpen(false)} type="button"><X size={20} /></button>
            <p className="dialog-kicker">ESPACE HÔTE · MODE DÉMONSTRATION</p>
            <h2 id="host-dashboard-title">Tableau prestataire</h2>
            <p className="demo-note">Vue locale des demandes enregistrées dans ce navigateur. Les voyageurs ne reçoivent pas de message externe.</p>
            <section className="host-queue">
              <h3>Demandes à traiter ({bookings.filter((booking) => booking.status === 'Demande envoyée').length})</h3>
              {bookings.filter((booking) => booking.status === 'Demande envoyée').length === 0 ? (
                <div className="empty-requests"><CalendarCheck2 size={22} /><p>Aucune demande en attente.</p></div>
              ) : bookings.filter((booking) => booking.status === 'Demande envoyée').map((booking) => (
                <article className="provider-request" key={booking.id}>
                  <div><span className="booking-kind">{requestLabels[booking.requestType]}</span><h3>{booking.title}</h3><p>{booking.arrival}{booking.departure ? ` → ${booking.departure}` : ''}{booking.serviceTime ? ` · ${booking.serviceTime}` : ''} · {booking.guests} {booking.quantityLabel || 'personnes'}</p>{booking.requestType === 'taxi' && <p className="booking-route">{booking.pickupLocation} → {booking.dropoffLocation}</p>}<p>{booking.contactName} · {booking.contactEmail}</p><strong>{formatPrice(booking.total, booking.currency)} estimés</strong></div>
                  <div className="provider-actions"><button onClick={() => updateBookingStatus(booking.id, 'Confirmée')} type="button">Confirmer</button><button onClick={() => updateBookingStatus(booking.id, 'Refusée')} type="button">Refuser</button></div>
                </article>
              ))}
            </section>
            <section className="owner-listings">
              <h3>Annonces déposées ({userListings.length})</h3>
              {userListings.length === 0 ? <p className="demo-note">Aucune annonce déposée dans cette démo.</p> : userListings.map((listing) => <div className="owner-listing" key={listing.id}><span>{listing.title}<small>{listing.category} · {listing.location} · {formatPrice(listing.price, listing.currency)}</small></span><span className="pending-badge">À vérifier</span></div>)}
            </section>
            <button className="provider-notifications-link" onClick={() => { setHostDashboardOpen(false); setNotificationsOpen(true); setNotifications((current) => current.map((notification) => ({ ...notification, read: true }))) }} type="button">Ouvrir les notifications ({unreadNotificationCount} non lue{unreadNotificationCount === 1 ? '' : 's'})</button>
          </section>
        </div>
      )}

      {notificationsOpen && (
        <div className="modal-backdrop" onClick={() => setNotificationsOpen(false)}>
          <section aria-labelledby="notifications-title" aria-modal="true" className="compact-dialog requests-dialog" onClick={(event) => event.stopPropagation()} role="dialog">
            <button aria-label="Fermer" className="dialog-close" onClick={() => setNotificationsOpen(false)} type="button"><X size={20} /></button>
            <p className="dialog-kicker">CENTRE DE NOTIFICATIONS · LOCAL</p>
            <h2 id="notifications-title">Notifications</h2>
            {notifications.length === 0 ? <div className="empty-requests"><CalendarCheck2 size={22} /><p>Aucune notification pour le moment.</p></div> : <div className="notification-list">{notifications.map((notification) => <article className={notification.read ? 'notification-item' : 'notification-item is-unread'} key={notification.id}><span className="notification-dot" /><div><strong>{notification.title}</strong><p>{notification.message}</p><time>{notification.createdAt}</time></div></article>)}</div>}
            <p className="demo-note">Les notifications sont enregistrées localement. Aucun e-mail ni message WhatsApp n’est envoyé.</p>
          </section>
        </div>
      )}

      {bookingsOpen && (
        <div className="modal-backdrop" onClick={() => setBookingsOpen(false)}>
          <section aria-labelledby="bookings-title" aria-modal="true" className="compact-dialog requests-dialog" onClick={(event) => event.stopPropagation()} role="dialog">
            <button aria-label="Fermer" className="dialog-close" onClick={() => setBookingsOpen(false)} type="button"><X size={20} /></button>
            <p className="dialog-kicker">VOTRE ESPACE</p>
            <h2 id="bookings-title">Mes demandes</h2>
            <div className="provider-shortcuts">
              <button onClick={() => { setBookingsOpen(false); setHostDashboardOpen(true) }} type="button">Espace hôte · gérer les demandes</button>
              <button onClick={() => { setBookingsOpen(false); setNotificationsOpen(true); setNotifications((current) => current.map((notification) => ({ ...notification, read: true }))) }} type="button">Notifications{unreadNotificationCount > 0 ? ` · ${unreadNotificationCount} nouvelle(s)` : ''}</button>
            </div>
            {bookings.length === 0 ? (
              <div className="empty-requests"><CalendarCheck2 size={25} /><p>Vos réservations, tables, taxis et demandes de visite apparaîtront ici.</p></div>
            ) : (
              <div className="booking-list">
                {bookings.map((booking) => (
                  <article className="booking-item" key={booking.id}>
                    <div>
                      <span className="booking-kind">{requestLabels[booking.requestType]}</span>
                      <h3>{booking.title}</h3>
                      <p>{booking.arrival}{booking.departure ? ` → ${booking.departure}` : ''}{booking.serviceTime ? ` · ${booking.serviceTime}` : ''} · {booking.guests} {booking.quantityLabel || (booking.guests === 1 ? 'personne' : 'personnes')}</p>
                      {booking.requestType === 'taxi' && <p className="booking-route">{booking.pickupLocation} → {booking.dropoffLocation}</p>}
                      <strong>{formatPrice(booking.total, booking.currency)} estimés</strong>
                      <p className="booking-payment">{booking.paymentMethod} · {booking.paymentStatus}</p>
                      <button className="receipt-link" onClick={() => { setReceiptBooking(booking); setBookingsOpen(false) }} type="button">Voir le reçu de demande</button>
                    </div>
                    <div className="booking-status"><span>{booking.status}</span>{(booking.status === 'Demande envoyée' || booking.status === 'Confirmée') && <button onClick={() => setBookings((current) => current.map((item) => item.id === booking.id ? { ...item, status: 'Annulée' } : item))} type="button">Annuler</button>}</div>
                  </article>
                ))}
              </div>
            )}
            <p className="demo-note">Historique stocké localement. Les demandes ne sont pas transmises aux prestataires.</p>
          </section>
        </div>
      )}

      {hostOpen && <div className="modal-backdrop" onClick={() => setHostOpen(false)}><section aria-labelledby="host-title" aria-modal="true" className="compact-dialog host-dialog" onClick={(event) => event.stopPropagation()} role="dialog"><button aria-label="Fermer" className="dialog-close" onClick={() => setHostOpen(false)} type="button"><X size={20} /></button><p className="dialog-kicker">ESPACE PROPRIÉTAIRE · DÉMO</p><h2 id="host-title">Déposer une annonce</h2>{hostSubmitted ? <div className="request-confirmation" role="status"><span className="confirmation-mark">✓</span><h3>Annonce enregistrée pour vérification</h3><p>Elle apparaît maintenant dans les annonces de cette démo. La vérification réelle des documents et de la propriété reste à mettre en place.</p><button className="dialog-submit" onClick={() => setHostSubmitted(false)} type="button">Déposer une autre annonce</button></div> : <form className="host-form" onSubmit={submitListing}><label>Type de bien<select onChange={(event) => setNewListingCategory(event.target.value as Category)} value={newListingCategory}>{categories.map(({ label }) => <option key={label}>{label}</option>)}</select></label><label>Nom de l’annonce<input onChange={(event) => setNewListingTitle(event.target.value)} required value={newListingTitle} /></label><label>Ville ou quartier<input onChange={(event) => setNewListingLocation(event.target.value)} required value={newListingLocation} /></label><label>Prix en euros<input min="1" onChange={(event) => setNewListingPrice(event.target.value)} required type="number" value={newListingPrice} /></label><label>Description<textarea maxLength={500} onChange={(event) => setNewListingDescription(event.target.value)} value={newListingDescription} /></label><label className="video-upload">Vidéo de visite<input accept="video/mp4,video/webm" onChange={handleVideoSelection} type="file" /><span>MP4 ou WebM · 50 Mo max · stockée sur cet appareil</span></label>{videoPreviewUrl && <div className="video-preview"><video controls playsInline preload="metadata" src={videoPreviewUrl} /><button onClick={() => { setHostVideo(null); setVideoPreviewUrl(null) }} type="button">Retirer la vidéo</button></div>}{videoError && <p className="form-error" role="alert">{videoError}</p>}<label>Votre nom<input autoComplete="name" onChange={(event) => setProfileName(event.target.value)} required value={profileName} /></label><label>E-mail de contact<input autoComplete="email" onChange={(event) => setProfileEmail(event.target.value)} required type="email" value={profileEmail} /></label><button className="dialog-submit" type="submit">Enregistrer l’annonce <ArrowRight size={16} /></button></form>}{userListings.length > 0 && <div className="owner-listings"><h3>Mes annonces ({userListings.length})</h3>{userListings.map((listing) => <div className="owner-listing" key={listing.id}><span>{listing.title}<small>{listing.category} · {listing.location}{listing.hasVideo ? ' · vidéo ajoutée' : ''}</small></span><span className="pending-badge">À vérifier</span></div>)}</div>}<p className="demo-note">Les annonces et vidéos sont enregistrées sur cet appareil, pas publiées en ligne.</p></section></div>}

      {receiptBooking && (
        <div className="modal-backdrop" onClick={() => setReceiptBooking(null)}>
          <section aria-labelledby="receipt-title" aria-modal="true" className="compact-dialog receipt-dialog" onClick={(event) => event.stopPropagation()} role="dialog">
            <button aria-label="Fermer" className="dialog-close" onClick={() => setReceiptBooking(null)} type="button"><X size={20} /></button>
            <p className="dialog-kicker">GLOBAL STAY · RÉCAPITULATIF</p>
            <h2 id="receipt-title">Reçu de demande</h2>
            <dl className="receipt-details">
              <div><dt>Référence</dt><dd>GS-{receiptBooking.id}</dd></div>
              <div><dt>Annonce</dt><dd>{receiptBooking.title}</dd></div>
              <div><dt>Type</dt><dd>{requestLabels[receiptBooking.requestType]}</dd></div>
              <div><dt>Date</dt><dd>{receiptBooking.arrival}{receiptBooking.departure ? ` → ${receiptBooking.departure}` : ''}</dd></div>
              {receiptBooking.serviceTime && <div><dt>Heure</dt><dd>{receiptBooking.serviceTime}</dd></div>}
              {receiptBooking.requestType === 'taxi' && <div><dt>Trajet</dt><dd>{receiptBooking.pickupLocation} → {receiptBooking.dropoffLocation}</dd></div>}
              <div><dt>{receiptBooking.quantityLabel ? 'Quantité' : 'Personnes'}</dt><dd>{receiptBooking.guests} {receiptBooking.quantityLabel || ''}</dd></div>
              <div><dt>Montant estimé</dt><dd>{formatPrice(receiptBooking.total, receiptBooking.currency)}</dd></div>
              <div><dt>Règlement</dt><dd>{receiptBooking.paymentMethod} · {receiptBooking.paymentStatus}</dd></div>
            </dl>
            <p className="demo-note">Ce reçu récapitule une demande de démonstration, pas un paiement ni une réservation confirmée.</p>
            <button className="dialog-submit print-button" onClick={() => window.print()} type="button">Imprimer le récapitulatif</button>
          </section>
        </div>
      )}

      <footer className="site-footer">
        <a className="brand footer-brand" href="#top"><span className="brand-mark"><MapPin size={17} strokeWidth={2.5} /></span><span>global<span className="brand-light">stay</span></span></a>
        <p>Des clés pour aller plus loin.</p>
        <span className="footer-note">© 2026 Global Stay</span>
      </footer>
    </div>
  )
}

export default App
