// services/googleAuthService.ts

interface GoogleUser {
  email: string;
  name: string;
}

/**
 * Mocks the Google Sign-In process.
 * In a real application, this would use the Google Identity Services library (gapi).
 * Here, we use a simple prompt to simulate the account selection pop-up.
 * @returns A promise that resolves with a mock Google user object, or null if cancelled.
 */
export const signIn = (): Promise<GoogleUser | null> => {
  return new Promise((resolve) => {
    // We use a timeout to ensure the prompt appears after the current render cycle, preventing UI freezes.
    setTimeout(() => {
        const email = window.prompt("Simulating Google Sign-In.\nPlease enter your Google email address:", "test.user@gmail.com");

        if (email && email.includes('@')) {
            // Create a mock name from the email address for display purposes.
            const name = email.split('@')[0]
                .replace(/[._]/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
            resolve({ email, name });
        } else if (email !== null) {
            // Handle cases where the user enters an invalid email but doesn't cancel.
             alert("Invalid email provided. Please try again.");
             resolve(null);
        }
        else {
            // User cancelled the prompt.
            resolve(null);
        }
    }, 100);
  });
};