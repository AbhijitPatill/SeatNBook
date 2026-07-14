function Footer() {
  return (
    <footer className="border-t border-border p-12">
      <div className="max-w-6xl mx-auto flex justify-between gap-10 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="font-display text-2xl mb-2.5">
            SEAT<span className="text-gold">N</span>BOOK
          </div>
          <p className="text-muted text-sm leading-relaxed max-w-[260px]">
            Live seat maps, instant holds, and real tickets in your inbox — for movies and concerts.
          </p>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-wider text-muted mb-3.5">Explore</h4>
          <a href="#" className="block text-ivory text-sm mb-2.5 opacity-85 hover:text-teal hover:opacity-100">Movies</a>
          <a href="#" className="block text-ivory text-sm mb-2.5 opacity-85 hover:text-teal hover:opacity-100">Concerts</a>
          <a href="#" className="block text-ivory text-sm mb-2.5 opacity-85 hover:text-teal hover:opacity-100">Cities</a>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-wider text-muted mb-3.5">Account</h4>
          <a href="#" className="block text-ivory text-sm mb-2.5 opacity-85 hover:text-teal hover:opacity-100">My bookings</a>
          <a href="#" className="block text-ivory text-sm mb-2.5 opacity-85 hover:text-teal hover:opacity-100">Waitlist</a>
          <a href="#" className="block text-ivory text-sm mb-2.5 opacity-85 hover:text-teal hover:opacity-100">Sign in</a>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-wider text-muted mb-3.5">Support</h4>
          <a href="#" className="block text-ivory text-sm mb-2.5 opacity-85 hover:text-teal hover:opacity-100">Help centre</a>
          <a href="#" className="block text-ivory text-sm mb-2.5 opacity-85 hover:text-teal hover:opacity-100">Refund policy</a>
          <a href="#" className="block text-ivory text-sm mb-2.5 opacity-85 hover:text-teal hover:opacity-100">Contact us</a>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-5 border-t border-border text-muted text-xs flex justify-between">
        <span>© 2026 SeatNBook</span>
        <span>Made for people who hate missing the good seats</span>
      </div>
    </footer>
  );
}

export default Footer;