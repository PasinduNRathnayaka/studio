export function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} CineMagic. All rights reserved.</p>
        <p className="mt-2">
          Powered by AI to bring your photos to life.
        </p>
      </div>
    </footer>
  );
}
