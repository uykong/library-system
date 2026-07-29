// components/BookCatalog.tsx
"use client";

// Notice we added `useEffect` to load data when the page opens
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
// We are importing our new real database functions!
import { getBooks, addBook, borrowBook, returnBook, deleteBook } from "../lib/actions";

// We can define the Book type right here now
interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  totalCopies: number;
  availableCopies: number;
}

export default function BookCatalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [books, setBooks] = useState<Book[]>([]); // Starts empty!
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    isbn: "",
    totalCopies: 1,
  });
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  // NEW: Fetch books from Supabase when the component loads
  useEffect(() => {
    // 1. Grab their role (Student vs Librarian) to show/hide buttons
    const role = localStorage.getItem("userRole");
    

    // 2. Grab their specific ID to put on the borrow receipt
    const id = localStorage.getItem("userId");

    if (!id) {
      router.push("/login");
      return; // Stop the function here so it doesn't bother loading books
    }

    setUserRole(role);
    setUserId(id);

    async function loadBooks() {
      const data = await getBooks();
      setBooks(data);
    }
    loadBooks();
  }, []);

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBorrow = async (bookId: string) => {
    // 1. Stop them if they aren't logged in
    if (!userId) {
      alert("You must be logged in to borrow a book!");
      return;
    }
    
    try {
      // 2. Pass BOTH the book ID and the user ID to the database action!
      const updatedBook = await borrowBook(bookId, userId);
      
      // 3. Update the React UI to exactly match what the database returned
      setBooks((prevBooks) => 
        prevBooks.map((book) => {
          if (book.id === bookId) {
            return updatedBook;
          }
          return book;
        })
      );
    } catch (error: any) {
      // If our database transaction throws an error (like "already borrowed"), show it!
      alert(error.message); 
    }
  };

  const handleReturn = async (bookId: string) => {
    // 1. Check if they are logged in
    if (!userId) {
      alert("You must be logged in to return a book!");
      return;
    }
    
    try {
      // 2. Pass BOTH the book ID and the user ID to the database action!
      const updatedBook = await returnBook(bookId, userId);
      
      // 3. Update the UI to match the database
      setBooks((prevBooks) => 
        prevBooks.map((book) => {
          if (book.id === bookId) {
            return updatedBook;
          }
          return book;
        })
      );
    } catch (error: any) {
      alert(error.message); 
    }
  };

  const handleDelete = async (bookId: string) => {
    // Safety check!
    const isConfirmed = window.confirm("Are you sure you want to permanently delete this book?");
    if (!isConfirmed) return; // If they click cancel, stop the function here.

    // 1. Tell the Cloud Database to delete it
    await deleteBook(bookId);

    // 2. Update the React UI to remove it instantly
    setBooks((prevBooks) => prevBooks.filter((book) => book.id !== bookId));
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault(); 
    
    // NEW: Save to the REAL database!
    const savedBook = await addBook(
      newBook.title, 
      newBook.author, 
      newBook.isbn, 
      newBook.totalCopies
    );

    // Add the real saved book (with its new database ID) to our UI
    setBooks([savedBook, ...books]); 
    setIsModalOpen(false); 
    setNewBook({ title: "", author: "", isbn: "", totalCopies: 1 });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Library Catalog</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track library inventory</p>
        </div>
        {/* NEW: Only librarians can see this button! */}
        {userRole === 'librarian' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-sm"
          >
            + Add New Book
          </button>
        )}
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by title or author..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-black"
        />
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 text-sm">
              <th className="p-4">Title</th>
              <th className="p-4">Author</th>
              <th className="p-4">ISBN</th>
              <th className="p-4">Availability</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredBooks.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  {books.length === 0 ? "Loading books from database..." : `No books found matching "${searchTerm}"`}
                </td>
              </tr>
            ) : (
              filteredBooks.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-semibold text-gray-900">{book.title}</td>
                  <td className="p-4 text-gray-600">{book.author}</td>
                  <td className="p-4 text-gray-500 font-mono text-sm">{book.isbn}</td>
                  <td className="p-4">
                    {book.availableCopies > 0 ? (
                      <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                        {book.availableCopies} of {book.totalCopies} Available
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
                        Out of Stock
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleBorrow(book.id)}
                      disabled={book.availableCopies === 0}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        book.availableCopies > 0
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      Borrow
                    </button>
                    
                    <button
                      onClick={() => handleReturn(book.id)}
                      disabled={book.availableCopies === book.totalCopies}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        book.availableCopies < book.totalCopies
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      Return
                    </button>

                    {/* NEW: Only librarians can see the Delete button! */}
                    {userRole === 'librarian' && (
                      <button
                        onClick={() => handleDelete(book.id)}
                        className="px-3 py-2 rounded-md text-sm font-medium transition-all bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 shadow-sm border border-red-100"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Add a New Book</h2>
            
            <form onSubmit={handleAddBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newBook.title}
                  onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-black"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                <input
                  type="text"
                  required
                  value={newBook.author}
                  onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-black"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
                  <input
                    type="text"
                    required
                    value={newBook.isbn}
                    onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-black font-mono text-sm"
                  />
                </div>
                <div className="w-1/3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Copies</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newBook.totalCopies || ""}
                    onChange={(e) => setNewBook({ ...newBook, totalCopies: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-black"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Save Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}