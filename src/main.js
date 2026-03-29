import Navigator from "@ogis/navigator";
import "@ogis/navigator/navigator.css";

const nav = Navigator.create({
  id: "my-map",
  mapOptions: { center: [-128.0094, 50.6539], zoom: 12 },
  onMapReady: ({ map }) => console.log("Map loaded"),
});

nav.mount();
