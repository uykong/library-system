// lib/mockData.ts

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  totalCopies: number;
  availableCopies: number;
}

export const MOCK_BOOKS: Book[] = [
  {
    id: "1",
    title: "Clean Code",
    author: "Robert C. Martin",
    isbn: "978-0132350884",
    totalCopies: 5,
    availableCopies: 3,
  },
  {
    id: "2",
    title: "Design Patterns",
    author: "Erich Gamma et al.",
    isbn: "978-0201633610",
    totalCopies: 2,
    availableCopies: 0, // Out of stock
  },
  {
    id: "3",
    title: "The Pragmatic Programmer",
    author: "Andrew Hunt & David Thomas",
    isbn: "978-0135957059",
    totalCopies: 4,
    availableCopies: 4,
  },
];