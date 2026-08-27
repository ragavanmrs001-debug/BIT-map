import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FavoritePlace {
  id: string;
  name: string;
  category: string;
  customName?: string;
  addedAt: number;
}

interface FavoritesState {
  favorites: FavoritePlace[];
  addFavorite: (place: { id: string; name: string; category?: string; customName?: string }) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (place: { id: string; name: string; category?: string; customName?: string }) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [
        { id: 'central-library', name: 'Central Library', category: 'Library', addedAt: Date.now() },
        { id: 'main-canteen', name: 'BIT Main Canteen', category: 'Canteens', addedAt: Date.now() },
      ],

      addFavorite: (place) =>
        set((state) => {
          if (state.favorites.some((f) => f.id === place.id)) return state;
          return {
            favorites: [
              ...state.favorites,
              {
                id: place.id,
                name: place.name,
                category: place.category || 'Location',
                customName: place.customName,
                addedAt: Date.now(),
              },
            ],
          };
        }),

      removeFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
        })),

      isFavorite: (id) => get().favorites.some((f) => f.id === id),

      toggleFavorite: (place) => {
        const { isFavorite, addFavorite, removeFavorite } = get();
        if (isFavorite(place.id)) {
          removeFavorite(place.id);
        } else {
          addFavorite(place);
        }
      },
    }),
    {
      name: 'bit-map-favorites',
    }
  )
);
