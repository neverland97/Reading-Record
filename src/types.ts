export type ReadingStatus = '待閱讀' | '閱讀中' | '已完食' | '已放棄';

export interface Book {
  id: string;
  title: string;
  author: string;
  rating: number;
  status: ReadingStatus;
  genre: string;
  tags: string[];
  readingDate: string;
  quote: string;
  review: string;
  isFavorite: boolean;
  createdAt: number;
}

export interface AppData {
  books: Book[];
  customGenres: string[];
  customTags: string[];
  settings: {
    fontSize: 'small' | 'medium' | 'large';
    darkMode: boolean;
    accentColor?: string;
    darkAccentColor?: string;
  };
}
