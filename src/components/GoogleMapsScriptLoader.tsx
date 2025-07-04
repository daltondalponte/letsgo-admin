"use client";
import { useEffect } from "react";

export default function GoogleMapsScriptLoader() {
  useEffect(() => {
    const scriptId = 'google-maps-places-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);
  return null;
} 