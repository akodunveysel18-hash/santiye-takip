import { useState } from "react";

export default function Home() {
  const [mode, setMode] = useState("office");

  return (
    <div style={{ padding: 20 }}>
      <h1>Şantiye Takip Sistemi</h1>

      <button onClick={() => setMode("office")}>Ofis Modu</button>
      <button onClick={() => setMode("chief")} style={{ marginLeft: 10 }}>
        Şantiye Şefi Modu
      </button>

      {mode === "office" && (
        <div>
          <h2>Ofis Ekranı</h2>
        </div>
      )}

      {mode === "chief" && (
        <div>
          <h2>Şantiye Şefi Ekranı</h2>
        </div>
      )}
    </div>
  );
}
