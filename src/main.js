import Navigator from "@ogis/navigator";
import "@ogis/navigator/navigator.css";

const nav = Navigator.create({
  id: "app",
  debug: false, // Optional: Enable debug mode
  messages: {
    // English (default)
    en: {
      "modal.welcome.title": "On Route",
      "modal.welcome.introOne":
        "An outdoor map for everyone, right in the browser.",
      "modal.welcome.introTwo":
        "No app stores, no accounts, no tracking. Powered by Open-Source.",
      "panel.about.title": "About On Route",
      "panel.about.descriptionOne":
        "An outdoor map for everyone, right in the browser.",
      "panel.about.descriptionTwo":
        "On Route is a tool for not getting lost! Built with Open-Source software and Open data.",
      "panel.privacy.noTrackingBody":
        "This app contains no analytics, no advertising, and no tracking scripts of any kind.",
    },
    // French
    fr: {
      "modal.welcome.title": "En Route",
      "modal.welcome.introOne":
        "Une carte de plein air pour tous, directement dans le navigateur.",
      "modal.welcome.introTwo":
        "Pas de boutiques d'applications, pas de comptes, pas de suivi. Propulsé par l'Open-Source.",
      "panel.about.title": "À propos de On Route",
      "panel.about.descriptionOne":
        "Une carte de plein air pour tous, directement dans le navigateur.",
      "panel.about.descriptionTwo":
        "On Route est un outil pour ne pas se perdre ! Construit avec des logiciels Open-Source et des données ouvertes.",
      "panel.privacy.noTrackingBody":
        "Cette application ne contient aucune analyse, aucune publicité et aucun script de suivi.",
    },
  },
  onMapReady: ({ map }) => console.log("Map loaded"),
});

nav.mount();
