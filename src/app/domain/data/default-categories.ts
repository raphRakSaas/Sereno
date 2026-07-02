import { Category } from '../models/category.model';

/* Catégories globales de Sereno. Les UUID sont FIXES et identiques dans le seed
   SQL Supabase (schema.sql) : en mode invité comme en mode connecté, une
   transaction "Courses" pointe vers le même id, ce qui rend la migration
   Dexie → Supabase triviale (aucun remappage de catégories par défaut). */

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'c0000000-0000-4000-8000-000000000001',
    name: 'Salaire',
    type: 'income',
    icon: 'work',
    color: '#1E6D9C',
    isDefault: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000002',
    name: 'Autres revenus',
    type: 'income',
    icon: 'sparkle',
    color: '#3694BC',
    isDefault: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000003',
    name: 'Logement',
    type: 'expense',
    icon: 'home',
    color: '#196E44',
    isDefault: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000004',
    name: 'Courses',
    type: 'expense',
    icon: 'basket',
    color: '#018472',
    isDefault: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000005',
    name: 'Transports',
    type: 'expense',
    icon: 'transit',
    color: '#7D8F3A',
    isDefault: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000006',
    name: 'Restaurants & cafés',
    type: 'expense',
    icon: 'dining',
    color: '#A07417',
    isDefault: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000007',
    name: 'Santé',
    type: 'expense',
    icon: 'health',
    color: '#6D9755',
    isDefault: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000008',
    name: 'Loisirs',
    type: 'expense',
    icon: 'leisure',
    color: '#7B6CBF',
    isDefault: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000009',
    name: 'Abonnements',
    type: 'expense',
    icon: 'repeat',
    color: '#8D4826',
    isDefault: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000010',
    name: 'Vêtements',
    type: 'expense',
    icon: 'clothing',
    color: '#A85769',
    isDefault: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000011',
    name: 'Autres dépenses',
    type: 'expense',
    icon: 'dots',
    color: '#945818',
    isDefault: true,
  },
];
