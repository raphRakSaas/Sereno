export interface MerchantBrand {
  id: string;
  name: string;
  logoUrl: string;
  /** Fond de la pastille derrière le logo. */
  tint: string;
  aliases: readonly string[];
}

/** Marques reconnues dans les notes et libellés de transaction.
    Les alias sont comparés sans casse ni accents (voir merchant-brand.util). */
export const MERCHANT_BRANDS: readonly MerchantBrand[] = [
  {
    id: 'spotify',
    name: 'Spotify',
    logoUrl: '/brands/spotify.svg',
    tint: '#1db954',
    aliases: ['spotify', 'spotify premium', 'spotify family', 'spotify duo'],
  },
  {
    id: 'netflix',
    name: 'Netflix',
    logoUrl: '/brands/netflix.svg',
    tint: '#e50914',
    aliases: ['netflix'],
  },
  {
    id: 'amazon',
    name: 'Amazon',
    logoUrl: '/brands/amazon.svg',
    tint: '#ff9900',
    aliases: ['amazon', 'amazon prime', 'prime video', 'amzn'],
  },
  {
    id: 'uber',
    name: 'Uber',
    logoUrl: '/brands/uber.svg',
    tint: '#000000',
    aliases: ['uber', 'uber trip', 'uber one'],
  },
  {
    id: 'ubereats',
    name: 'Uber Eats',
    logoUrl: '/brands/uber-eats.svg',
    tint: '#06c167',
    aliases: ['uber eats', 'ubereats', 'uber eat'],
  },
  {
    id: 'deliveroo',
    name: 'Deliveroo',
    logoUrl: '/brands/deliveroo.svg',
    tint: '#00ccbc',
    aliases: ['deliveroo'],
  },
  {
    id: 'mcdonalds',
    name: "McDonald's",
    logoUrl: '/brands/mcdonalds.svg',
    tint: '#ffc72c',
    aliases: ['mcdonalds', 'mcdo', 'mc donalds', 'mac donald'],
  },
  {
    id: 'edf',
    name: 'EDF',
    logoUrl: '/brands/edf.svg',
    tint: '#0055a4',
    aliases: ['edf', 'electricite de france', 'électricité de france'],
  },
  {
    id: 'engie',
    name: 'Engie',
    logoUrl: '/brands/engie.svg',
    tint: '#00aaff',
    aliases: ['engie', 'gdf suez', 'gdf'],
  },
  {
    id: 'orange',
    name: 'Orange',
    logoUrl: '/brands/orange.svg',
    tint: '#ff7900',
    aliases: ['orange', 'orange bank', 'orange money'],
  },
  {
    id: 'sfr',
    name: 'SFR',
    logoUrl: '/brands/sfr.svg',
    tint: '#e2001a',
    aliases: ['sfr', 'red by sfr'],
  },
  {
    id: 'free',
    name: 'Free',
    logoUrl: '/brands/free.svg',
    tint: '#cd1719',
    aliases: ['free', 'free mobile', 'iliad'],
  },
  {
    id: 'bouygues',
    name: 'Bouygues',
    logoUrl: '/brands/bouygues.svg',
    tint: '#009bdf',
    aliases: ['bouygues', 'b and you', 'b&you'],
  },
  {
    id: 'carrefour',
    name: 'Carrefour',
    logoUrl: '/brands/carrefour.svg',
    tint: '#004e9f',
    aliases: ['carrefour', 'carrefour city', 'carrefour market'],
  },
  {
    id: 'leclerc',
    name: 'E.Leclerc',
    logoUrl: '/brands/leclerc.svg',
    tint: '#0066b3',
    aliases: ['leclerc', 'e leclerc', 'eleclerc'],
  },
  {
    id: 'apple',
    name: 'Apple',
    logoUrl: '/brands/apple.svg',
    tint: '#555555',
    aliases: ['apple', 'itunes', 'app store', 'icloud'],
  },
  {
    id: 'google',
    name: 'Google',
    logoUrl: '/brands/google.svg',
    tint: '#4285f4',
    aliases: ['google', 'google one', 'google play', 'youtube', 'youtube premium'],
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    logoUrl: '/brands/microsoft.svg',
    tint: '#00a4ef',
    aliases: ['microsoft', 'office 365', 'xbox', 'xbox game pass'],
  },
  {
    id: 'sncf',
    name: 'SNCF',
    logoUrl: '/brands/sncf.svg',
    tint: '#ab0434',
    aliases: ['sncf', 'sncf connect', 'oui sncf', 'ter', 'tgv'],
  },
  {
    id: 'revolut',
    name: 'Revolut',
    logoUrl: '/brands/revolut.svg',
    tint: '#191c1f',
    aliases: ['revolut'],
  },
  {
    id: 'disney',
    name: 'Disney+',
    logoUrl: '/brands/disney.svg',
    tint: '#113ccf',
    aliases: ['disney', 'disney plus', 'disney+'],
  },
  {
    id: 'canal',
    name: 'Canal+',
    logoUrl: '/brands/canal.svg',
    tint: '#000000',
    aliases: ['canal plus', 'canal+', 'canal'],
  },
  {
    id: 'decathlon',
    name: 'Decathlon',
    logoUrl: '/brands/decathlon.svg',
    tint: '#0082c3',
    aliases: ['decathlon'],
  },
  {
    id: 'ikea',
    name: 'IKEA',
    logoUrl: '/brands/ikea.svg',
    tint: '#0058a3',
    aliases: ['ikea'],
  },
];
