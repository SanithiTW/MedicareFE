import React, { useState, useEffect, useRef } from "react";
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import { ref, onValue } from "firebase/database";
import { database } from "../Firebase";
import { useNavigate } from "react-router-dom";
import './PharmacyMap.css';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const centerDefault = { lat: 6.0, lng: 80.0 }; // Default Sri Lanka center

const PharmacyMap = () => {
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const mapRef = useRef(null);

  // Load Google Maps
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyA7oJX_PnMnZeyTFys7fy5jU598vtDZBFg" // Replace with your key
  });

  // Load pharmacies from Firebase
  useEffect(() => {
    const pharmaciesRef = ref(database, "pharmacies");
    onValue(pharmaciesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const list = Object.keys(data).map(key => ({
        id: key,
        ...data[key],
        latitude: parseFloat(data[key].latitude),
        longitude: parseFloat(data[key].longitude),
      }));
      setPharmacies(list);
    });
  }, []);

  // Filter pharmacies based on search term
  const filteredPharmacies = pharmacies.filter(ph =>
    ph.pharmacyname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ph.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ph.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fit map bounds to all filtered pharmacies
  const onLoadMap = map => {
    mapRef.current = map;
    if (filteredPharmacies.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    filteredPharmacies.forEach(ph => {
      bounds.extend({ lat: ph.latitude, lng: ph.longitude });
    });
    map.fitBounds(bounds);
  };

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div className="pharmacy-map-page">
      {/* Header */}
      <header className="pharmacy-map-header">
        <button onClick={() => navigate(-1)}>← Back</button>
        <input
          type="text"
          placeholder="Search pharmacy by name, city, address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </header>

      {/* Map */}
      <div className="map-container">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={centerDefault}
          zoom={10}
          onLoad={onLoadMap}
        >
          {filteredPharmacies.map(ph => (
            <Marker
              key={ph.id}
              position={{ lat: ph.latitude, lng: ph.longitude }}
              onClick={() => setSelectedPharmacy(ph)}
            />
          ))}

          {selectedPharmacy && (
            <InfoWindow
              position={{ lat: selectedPharmacy.latitude, lng: selectedPharmacy.longitude }}
              onCloseClick={() => setSelectedPharmacy(null)}
            >
              <div className="google-map-infowindow">
                <h4>{selectedPharmacy.pharmacyname}</h4>
                {selectedPharmacy.address && <p>📍 {selectedPharmacy.address}</p>}
                {selectedPharmacy.city && <p>City: {selectedPharmacy.city}</p>}
                {selectedPharmacy.phone && <p>📞 {selectedPharmacy.phone}</p>}
                {selectedPharmacy.closingTime && <p>Closing Time: {selectedPharmacy.closingTime}</p>}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
};

export default PharmacyMap;