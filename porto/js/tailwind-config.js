/* Optional Tailwind CDN configuration. Local fallback CSS is bundled. */
if(window.tailwind){

    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            cairo: ['Cairo', 'sans-serif'],
            tajawal: ['Tajawal', 'Cairo', 'sans-serif'],
            almarai: ['Almarai', 'Cairo', 'sans-serif'],
            amiri: ['Amiri', 'serif'],
          }
        }
      }
    }
  
}
