```markdown
# CIDIKA TRAVEL & TOUR – Official Website  

**Live Demo**: [https://cidika-travel.netlify.app](https://cidika-travel.netlify.app)  
**GitHub**: https://github.com/your-username/cidika-travel  

---

## Overview

**CIDIKA TRAVEL & TOUR** is a modern, fully responsive travel booking platform built for adventure seekers exploring **Nusa Penida** and beyond. Designed with a clean, luxurious aesthetic inspired by premium travel brands, the site delivers a seamless user experience across desktop and mobile devices.

This project showcases a **production-ready frontend architecture** using **React (Create React App)**, **Tailwind CSS**, **Supabase** for backend services, and **Netlify** for global deployment.

---

## Key Features

### User-Facing Experience
- **Stunning Hero Carousel** with parallax, auto-transition, and Ken Burns zoom effects  
- **Interactive Circular Gallery** – 3D rotating image showcase with drag-to-rotate (pure CSS + React)  
- **Dynamic Package Explorer** with multi-tier pricing (per pax), audience filters (domestic/foreign), and real-time currency formatting  
- **Multilingual Support** (`en`, `id`, `ja`) powered by `react-i18next`  
- **Dark/Light Mode** with smooth transitions and system preference detection  
- **Testimonial Carousel + Submission Form** with Google Translate fallback  
- **Sticky WhatsApp CTA** and animated shimmer buttons for high conversion  
- **Fully Accessible** – semantic HTML, ARIA labels, keyboard navigation  

### Admin & Content Management
- **Headless CMS via Supabase** – all page content, hero text, pricing, and packages are editable without redeploy  
- **Admin Dashboard** (protected route) with:
  - Real-time stats (trips, photos, ratings)
  - Full CRUD for multilingual content
  - Order management panel
- **Supabase Auth** – email/password login for admins (session-aware)

### Performance & UX
- **Lazy loading**, **image preloading**, and **reduced motion** support  
- **Framer Motion** animations with `viewport` triggers and `staggerChildren`  
- **Glassmorphism UI**, subtle grain textures, and micro-interactions  
- **SEO-ready** with dynamic meta tags and structured data potential  

---

## Tech Stack

| Layer        | Technology |
|-------------|------------|
| **Framework** | React 18 + Create React App |
| **Styling**   | Tailwind CSS + Custom Design System |
| **Animations**| Framer Motion |
| **Backend**   | Supabase (PostgreSQL, Auth, RLS) |
| **i18n**      | `react-i18next` + JSON locale files |
| **Routing**   | React Router DOM v6 |
| **State**     | React Context (Currency, Cart) |
| **Deployment**| Netlify (CI/CD, Preview URLs) |
| **Icons**     | Lucide React |
| **Fonts**     | Google Fonts (`Cinzel`, `League Spartan`, `Berkshire Swash`) |

---

## Project Structure (Highlights)

```
src/
├── components/     → Reusable UI (BlurText, ShimmerButton, CircularGallery)
├── pages/          → Home, Explore, FAQ, Contact, Admin/*
├── hooks/          → usePackages, usePageSections, useCurrency
├── context/        → CurrencyContext, CartContext
├── lib/            → supabaseClient.js
├── locales/        → en, id, ja translation files
├── assets/         → Images, icons
└── utils/          → currency formatting, URL helpers
```

---

## Design Philosophy

- **Mobile-First Responsive** – fluid typography, touch-friendly interactions  
- **Performance-First** – code splitting, lazy loading, minimal re-renders  
- **Maintainability** – modular components, centralized content via Supabase  
- **Scalability** – ready for e-commerce, booking engine, or blog integration  

---

## Why This Project?

This repository serves as a **reference implementation** for:
- Building **beautiful, high-converting travel websites**
- Integrating **Supabase as a full backend replacement**
- Creating **smooth, cinematic UI animations** without heavy libraries
- Managing **multilingual content at scale**
- Deploying **secure, static-first apps with admin panels**

---

## Screenshots

| Home Hero | Circular Gallery | Package Card |
|---------|---------|---------|
| ![Hero](https://your-screenshot-url/hero.jpg) | ![Gallery](https://your-screenshot-url/gallery.jpg) | ![Package](https://your-screenshot-url/package.jpg) |

---

## Contributing

Contributions are welcome! Feel free to:
- Open issues for bugs or feature requests
- Submit pull requests with improvements (UI, accessibility, performance)
- Suggest new destinations or UI enhancements

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md) and include clear descriptions.

---

## License

This project is **open source** under the [MIT License](LICENSE). Use it, modify it, and build your own travel empire.

---

> **CIDIKA TRAVEL & TOUR** – *Where Adventure Meets Elegance.*  
> Built with passion by [Your Name/Team].
```