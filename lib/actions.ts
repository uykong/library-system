// lib/actions.ts
"use server";
import bcrypt from "bcryptjs";

import { prisma } from "./prisma";

// 1. Fetch all books from the database
export async function getBooks() {
  const books = await prisma.book.findMany({
    orderBy: {
      createdAt: 'desc' // Shows the newest books at the top!
    }
  });
  return books;
}

// 2. Add a new book to the database
export async function addBook(title: string, author: string, isbn: string, totalCopies: number) {
  const newBook = await prisma.book.create({
    data: {
      title,
      author,
      isbn,
      totalCopies,
      availableCopies: totalCopies, // Brand new books have all copies available
    }
  });
  
  return newBook;
}


// 3. Borrow a book (Relational Transaction)
export async function borrowBook(bookId: string, userId: string) {
  // A $transaction guarantees all steps succeed, or everything rolls back safely
  return await prisma.$transaction(async (tx) => {
    
    // Step 1: Check if the book actually has copies available
    const book = await tx.book.findUnique({ where: { id: bookId } });
    if (!book || book.availableCopies <= 0) {
      throw new Error("Sorry, no copies available right now.");
    }

    // Step 2: Check if this specific user already checked out this exact book
    const existingBorrow = await tx.borrowRecord.findFirst({
      where: { 
        userId: userId, 
        bookId: bookId, 
        status: "ACTIVE" 
      }
    });

    if (existingBorrow) {
      throw new Error("You already have an active copy of this book!");
    }

    // Step 3: Create the official Borrow Receipt
    await tx.borrowRecord.create({
      data: { 
        userId: userId, 
        bookId: bookId, 
        status: "ACTIVE" 
      }
    });

    // Step 4: Subtract one from the available copies
    const updatedBook = await tx.book.update({
      where: { id: bookId },
      data: { availableCopies: book.availableCopies - 1 }
    });

    return updatedBook;
  });
}

// 4. Return a book (Relational Transaction)
export async function returnBook(bookId: string, userId: string) {
  // Use a transaction so both steps happen safely together
  return await prisma.$transaction(async (tx) => {
    
    // Step 1: Find the user's active receipt for this specific book
    const activeBorrow = await tx.borrowRecord.findFirst({
      where: { 
        userId: userId, 
        bookId: bookId, 
        status: "ACTIVE" 
      }
    });

    if (!activeBorrow) {
      throw new Error("You don't have an active copy of this book to return.");
    }

    // Step 2: Mark the receipt as "RETURNED" and stamp the time
    await tx.borrowRecord.update({
      where: { id: activeBorrow.id },
      data: { 
        status: "RETURNED",
        returnedAt: new Date()
      }
    });

    // Step 3: Add +1 back to the available book copies
    const book = await tx.book.findUnique({ where: { id: bookId } });
    const updatedBook = await tx.book.update({
      where: { id: bookId },
      data: { availableCopies: book!.availableCopies + 1 }
    });

    return updatedBook;
  });
}

// 5. Delete a book permanently (Relational Transaction)
export async function deleteBook(id: string) {
  // Use a transaction so we don't accidentally leave ghost records
  return await prisma.$transaction(async (tx) => {
    
    // Step 1: Shred all borrow receipts connected to this specific book
    await tx.borrowRecord.deleteMany({
      where: { bookId: id }
    });

    // Step 2: Now that the ties are cut, it is safely allowed to delete the book!
    const deletedBook = await tx.book.delete({
      where: { id: id }
    });

    return deletedBook;
  });
}

// 6. Authenticate a user
export async function loginUser(email: string, password: string) {
  // Find the user by their email
  const user = await prisma.user.findUnique({
    where: { email: email }
  });

  // If no user is found
  if (!user) {
    return { success: false, error: "Account not found." };
  }

  // NEW: Securely compare the typed password against the hashed database password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return { success: false, error: "Incorrect password." };
  }

  // If everything matches, return success and their specific role!
  return { 
    success: true, 
    role: user.role,
    id: user.id 
  };
}

// 7. Register a new user securely
export async function registerUser(email: string, password: string, secretKey: string) {
  // 1. Check if this email is already registered
  const existingUser = await prisma.user.findUnique({
    where: { email: email }
  });

  if (existingUser) {
    return { success: false, error: "An account with this email already exists." };
  }

  // NEW 2: Calculate the role based on the secret key!
  // If they type the exact master key, they are a librarian. Otherwise, student.
  const assignedRole = secretKey === "LIB2026" ? "librarian" : "student";

  // 3. Scramble the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 4. Save the new user with the SECURE assigned role
  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: assignedRole // Using our secure variable instead of trusting the frontend!
    }
  });

  return { success: true, user: newUser };
}

