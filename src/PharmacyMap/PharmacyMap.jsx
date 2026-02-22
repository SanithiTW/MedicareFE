// src/PharmacyMap.jsx

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

const centerDefault = { lat: 6.0, lng: 80.0 };

const PharmacyMap = () => {
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyA7oJX_PnMnZeyTFys7fy5jU598vtDZBFg"
  });

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

  const filteredPharmacies = pharmacies.filter(ph =>
    ph.pharmacyname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ph.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ph.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleBuyItems = (pharmacy) => {
    navigate("/pharmacy-store", { state: { pharmacy } });
  };

  return (
    <div className="pharmacy-map-page">
      <header className="pharmacy-map-header">
        <button onClick={() => navigate(-1)}>← Back</button>
        <input
          type="text"
          placeholder="Search pharmacy by name, city, address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </header>

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
                {selectedPharmacy.closingTime && <p>⏰ Closes at: {selectedPharmacy.closingTime}</p>}
                {selectedPharmacy.deliverySupport && <p>🚚 Delivery: {selectedPharmacy.deliverySupport}</p>}
           
<button
  className="buy-items-btn"
  onClick={() => navigate("/pharmacy-store", { state: { selectedPharmacyFilter: selectedPharmacy } })}
>
  Buy Items
</button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
};

export default PharmacyMap;