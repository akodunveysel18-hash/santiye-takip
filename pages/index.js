import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";
import dynamic from "next/dynamic";
import * as XLSX from "xlsx";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function Home() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState("chief");
  const [selectedPier, setSelectedPier] = useState("P1");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [productions, setProductions] = useState([]);
  const [steel, setSteel] = useState([]);
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState([]);

  const [productionName, setProductionName] = useState("");
  const [productionQty, setProductionQty] = useState("");

  const [steelName, setSteelName] = useState("");
  const [steelQty, setSteelQty] = useState("");
  const [steelType, setSteelType] = useState("giriş");

  const [logText, setLogText] = useState("");

  const [progressItem, setProgressItem] = useState("");
  const [progressTotal, setProgressTotal] = useState("");
  const [progressDone, setProgressDone] = useState("");

  async function loadRole(userEmail) {
    const { data, error } = await supabase
      .from("users")
      .select("role, email")
      .eq("email", userEmail)
      .maybeSingle();

    console.log("ROLE DATA:", data, error, userEmail);
    setUserRole(data?.role || "yok");
  }

  async function loadData() {
    const { data: p1 } = await supabase
      .from("productions")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: p2 } = await supabase
      .from("steel_stock")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: p3 } = await supabase
      .from("daily_logs")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: p4 } = await supabase
      .from("progress")
      .select("*")
      .order("created_at", { ascending: false });

    setProductions(p1 || []);
    setSteel(p2 || []);
    setLogs(p3 || []);
    setProgress(p4 || []);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const currentSession = data.session;
      setSession(currentSession || null);

      if (currentSession?.user?.email) {
        loadRole(currentSession.user.email);
        loadData();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession || null);

      if (newSession?.user?.email) {
        loadRole(newSession.user.email);
        loadData();
      } else {
        setUserRole("yok");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn() {
    setLoginError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoginError(error.message || "Giriş yapılamadı");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setUserRole("yok");
  }

  async function addProduction() {
    if (!productionName || !productionQty) return;

    await supabase.from("productions").insert([
      {
        name: productionName,
        quantity: Number(productionQty),
        pier: selectedPier,
      },
    ]);

    setProductionName("");
    setProductionQty("");
    loadData();
  }

  async function addSteel() {
    if (!steelName || !steelQty) return;

    await supabase.from("steel_stock").insert([
      {
        name: steelName,
        quantity: Number(steelQty),
        type: steelType,
        pier: selectedPier,
      },
    ]);

    setSteelName("");
    setSteelQty("");
    setSteelType("giriş");
    loadData();
  }

  async function addLog() {
    if (!logText) return;

    await supabase.from("daily_logs").insert([
      {
        description: logText,
        pier: selectedPier,
      },
    ]);

    setLogText("");
    loadData();
  }

  async function addProgress() {
    if (!progressItem || !progressTotal || !progressDone) return;

    await supabase.from("progress").insert([
      {
        item: progressItem,
        total_quantity: Number(progressTotal),
        completed_quantity: Number(progressDone),
        pier: selectedPier,
      },
    ]);

    setProgressItem("");
    setProgressTotal("");
    setProgressDone("");
    loadData();
  }

  const filteredProductions = useMemo(
    () => productions.filter((item) => (item.pier || "P1") === selectedPier),
    [productions, selectedPier]
  );

  const filteredSteel = useMemo(
    () => steel.filter((item) => (item.pier || "P1") === selectedPier),
    [steel, selectedPier]
  );

  const filteredLogs = useMemo(
    () => logs.filter((item) => (item.pier || "P1") === selectedPier),
    [logs, selectedPier]
  );

  const filteredProgress = useMemo(
    () => progress.filter((item) => (item.pier || "P1") === selectedPier),
    [progress, selectedPier]
  );

  const totalProduction = filteredProductions.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const totalSteel = filteredSteel.reduce((sum, item) => {
    const qty = Number(item.quantity || 0);
    return item.type === "çıkış" ? sum - qty : sum + qty;
  }, 0);

  const avgProgress =
    filteredProgress.length > 0
      ? (
          filteredProgress.reduce((sum, item) => {
            const total = Number(item.total_quantity || 0);
            const done = Number(item.completed_quantity || 0);
            if (!total) return sum;
            return sum + (done / total) * 100;
          }, 0) / filteredProgress.length
        ).toFixed(1)
      : "0";

  const pierTotals = ["P1", "P2", "P3", "P4"].map((pier) => {
    return productions
      .filter((item) => (item.pier || "P1") === pier)
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  });

  const productionByDay = useMemo(() => {
    const grouped = {};

    filteredProductions.forEach((item) => {
      const date = item.created_at
        ? new Date(item.created_at).toLocaleDateString("tr-TR")
        : "Tarihsiz";

      grouped[date] = (grouped[date] || 0) + Number(item.quantity || 0);
    });

    const entries = Object.entries(grouped).reverse().slice(-7);
    return {
      categories: entries.map(([date]) => date),
      values: entries.map(([, value]) => value),
    };
  }, [filteredProductions]);

  const logsByDay = useMemo(() => {
    const grouped = {};

    filteredLogs.forEach((item) => {
      const date = item.created_at
        ? new Date(item.created_at).toLocaleDateString("tr-TR")
        : "Tarihsiz";

      grouped[date] = (grouped[date] || 0) + 1;
    });

    const entries = Object.entries(grouped).reverse().slice(-7);
    return {
      categories: entries.map(([date]) => date),
      values: entries.map(([, value]) => value),
    };
  }, [filteredLogs]);

  function exportExcel() {
    const data = [
      ...filteredProductions.map((item) => ({
        Tür: "İmalat",
        Ayak: item.pier || "P1",
        Ad: item.name,
        Miktar: Number(item.quantity || 0),
        Ek: "",
        Tarih: item.created_at || "",
      })),
      ...filteredSteel.map((item) => ({
        Tür: "Demir Stok",
        Ayak: item.pier || "P1",
        Ad: item.name,
        Miktar: Number(item.quantity || 0),
        Ek: item.type || "",
        Tarih: item.created_at || "",
      })),
      ...filteredProgress.map((item) => ({
        Tür: "Hakediş",
        Ayak: item.pier || "P1",
        Ad: item.item,
        Miktar: Number(item.completed_quantity || 0),
        Ek: `%${
          Number(item.total_quantity || 0)
            ? (
                (Number(item.completed_quantity || 0) /
                  Number(item.total_quantity || 0)) *
                100
              ).toFixed(1)
            : "0"
        }`,
        Tarih: item.created_at || "",
      })),
      ...filteredLogs.map((item) => ({
        Tür: "Günlük Rapor",
        Ayak: item.pier || "P1",
        Ad: item.description,
        Miktar: "",
        Ek: "",
        Tarih: item.created_at || "",
      })),
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, selectedPier);
    XLSX.writeFile(workbook, `santiye_${selectedPier}.xlsx`);
  }

  const styles = {
    page: {
      padding: 16,
      maxWidth: 1200,
      margin: "0 auto",
      fontFamily: "Arial, sans-serif",
      background: "#f7f7f7",
      minHeight: "100vh",
    },
    title: {
      fontSize: 28,
      fontWeight: 700,
      marginBottom: 16,
    },
    topBar: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 20,
    },
    button: {
      padding: "10px 14px",
      border: "none",
      borderRadius: 8,
      cursor: "pointer",
      background: "#1f2937",
      color: "white",
      fontWeight: 600,
    },
    select: {
      padding: "10px 12px",
      borderRadius: 8,
      border: "1px solid #ccc",
      minWidth: 100,
      background: "white",
    },
    card: {
      background: "white",
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: 12,
      marginBottom: 16,
    },
    statBox: {
      background: "#eef2ff",
      borderRadius: 10,
      padding: 14,
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: 10,
      alignItems: "center",
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 8,
      border: "1px solid #ccc",
      boxSizing: "border-box",
      background: "white",
    },
    textarea: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 8,
      border: "1px solid #ccc",
      boxSizing: "border-box",
      minHeight: 110,
      background: "white",
    },
    listItem: {
      padding: "10px 12px",
      borderBottom: "1px solid #eee",
    },
    subtitle: {
      marginTop: 0,
      marginBottom: 12,
      fontSize: 20,
    },
    loginWrap: {
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#f3f4f6",
      padding: 20,
    },
    loginCard: {
      width: "100%",
      maxWidth: 420,
      background: "white",
      borderRadius: 14,
      padding: 24,
      boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
    },
  };

  if (!session) {
    return (
      <div style={styles.loginWrap}>
        <div style={styles.loginCard}>
          <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 16 }}>
            Şantiye Giriş
          </div>

          <input
            style={{ ...styles.input, marginBottom: 12 }}
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={{ ...styles.input, marginBottom: 12 }}
            placeholder="Şifre"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button style={{ ...styles.button, width: "100%" }} onClick={signIn}>
            Giriş Yap
          </button>

          {loginError ? (
            <div style={{ color: "red", marginTop: 12 }}>{loginError}</div>
          ) : null}
        </div>
      </div>
    );
  }

  const mode = userRole === "office" ? "office" : "chief";

  return (
    <div style={styles.page}>
      <div style={styles.title}>🏗️ Şantiye Takip Sistemi</div>

      <div style={styles.topBar}>
        <div style={{ ...styles.card, padding: 10, marginBottom: 0 }}>
          Giriş: <strong>{session.user.email}</strong> | Yetki: <strong>{userRole}</strong>
        </div>

        <select
          style={styles.select}
          value={selectedPier}
          onChange={(e) => setSelectedPier(e.target.value)}
        >
          <option value="P1">P1</option>
          <option value="P2">P2</option>
          <option value="P3">P3</option>
          <option value="P4">P4</option>
        </select>

        <button style={styles.button} onClick={exportExcel}>
          Excel İndir
        </button>

        <button style={styles.button} onClick={signOut}>
          Çıkış Yap
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.subtitle}>Genel Durum - {selectedPier}</h2>

        <div style={styles.statsGrid}>
          <div style={styles.statBox}>
            <strong>Toplam İmalat</strong>
            <div style={{ fontSize: 24, marginTop: 8 }}>{totalProduction}</div>
          </div>

          <div style={styles.statBox}>
            <strong>Toplam Demir Stok</strong>
            <div style={{ fontSize: 24, marginTop: 8 }}>{totalSteel}</div>
          </div>

          <div style={styles.statBox}>
            <strong>Ortalama Hakediş</strong>
            <div style={{ fontSize: 24, marginTop: 8 }}>%{avgProgress}</div>
          </div>
        </div>

        <div style={{ marginTop: 20, marginBottom: 30 }}>
          <h3>Tüm Ayaklar Karşılaştırma</h3>
          <Chart
            options={{
              chart: { id: "tum-ayaklar", toolbar: { show: false } },
              xaxis: { categories: ["P1", "P2", "P3", "P4"] },
              dataLabels: { enabled: true },
            }}
            series={[
              {
                name: "Toplam İmalat",
                data: pierTotals,
              },
            ]}
            type="bar"
            width="100%"
            height={320}
          />
        </div>

        <div style={{ marginTop: 20, marginBottom: 30 }}>
          <h3>{selectedPier} Günlük İmalat</h3>
          <Chart
            options={{
              chart: { id: "gunluk-imalat", toolbar: { show: false } },
              xaxis: { categories: productionByDay.categories },
              stroke: { curve: "smooth" },
              dataLabels: { enabled: true },
            }}
            series={[
              {
                name: "Günlük İmalat",
                data: productionByDay.values,
              },
            ]}
            type="line"
            width="100%"
            height={320}
          />
        </div>

        <div style={{ marginTop: 20 }}>
          <h3>{selectedPier} Günlük Rapor Sayısı</h3>
          <Chart
            options={{
              chart: { id: "gunluk-rapor", toolbar: { show: false } },
              xaxis: { categories: logsByDay.categories },
              stroke: { curve: "smooth" },
              dataLabels: { enabled: true },
            }}
            series={[
              {
                name: "Rapor Adedi",
                data: logsByDay.values,
              },
            ]}
            type="line"
            width="100%"
            height={320}
          />
        </div>
      </div>

      {mode === "chief" ? (
        <>
          <div style={styles.card}>
            <h2 style={styles.subtitle}>İmalat Girişi - {selectedPier}</h2>
            <div style={styles.formGrid}>
              <input
                style={styles.input}
                placeholder="İmalat adı"
                value={productionName}
                onChange={(e) => setProductionName(e.target.value)}
              />
              <input
                style={styles.input}
                placeholder="Miktar"
                type="number"
                value={productionQty}
                onChange={(e) => setProductionQty(e.target.value)}
              />
              <button style={styles.button} onClick={addProduction}>
                Kaydet
              </button>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.subtitle}>Demir Stok Girişi - {selectedPier}</h2>
            <div style={styles.formGrid}>
              <input
                style={styles.input}
                placeholder="Malzeme adı"
                value={steelName}
                onChange={(e) => setSteelName(e.target.value)}
              />
              <input
                style={styles.input}
                placeholder="Miktar"
                type="number"
                value={steelQty}
                onChange={(e) => setSteelQty(e.target.value)}
              />
              <select
                style={styles.select}
                value={steelType}
                onChange={(e) => setSteelType(e.target.value)}
              >
                <option value="giriş">giriş</option>
                <option value="çıkış">çıkış</option>
              </select>
              <button style={styles.button} onClick={addSteel}>
                Kaydet
              </button>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.subtitle}>Hakediş Girişi - {selectedPier}</h2>
            <div style={styles.formGrid}>
              <input
                style={styles.input}
                placeholder="İş kalemi"
                value={progressItem}
                onChange={(e) => setProgressItem(e.target.value)}
              />
              <input
                style={styles.input}
                placeholder="Toplam miktar"
                type="number"
                value={progressTotal}
                onChange={(e) => setProgressTotal(e.target.value)}
              />
              <input
                style={styles.input}
                placeholder="Tamamlanan miktar"
                type="number"
                value={progressDone}
                onChange={(e) => setProgressDone(e.target.value)}
              />
              <button style={styles.button} onClick={addProgress}>
                Kaydet
              </button>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.subtitle}>Günlük Rapor - {selectedPier}</h2>
            <textarea
              style={styles.textarea}
              value={logText}
              onChange={(e) => setLogText(e.target.value)}
              placeholder="Bugün yapılan işleri yaz"
            />
            <div style={{ marginTop: 10 }}>
              <button style={styles.button} onClick={addLog}>
                Kaydet
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={styles.card}>
            <h2 style={styles.subtitle}>İmalatlar - {selectedPier}</h2>
            {filteredProductions.length === 0 ? (
              <p>Kayıt yok</p>
            ) : (
              filteredProductions.map((item) => (
                <div key={item.id} style={styles.listItem}>
                  {item.name} - {item.quantity}
                </div>
              ))
            )}
          </div>

          <div style={styles.card}>
            <h2 style={styles.subtitle}>Demir Stok - {selectedPier}</h2>
            {filteredSteel.length === 0 ? (
              <p>Kayıt yok</p>
            ) : (
              filteredSteel.map((item) => (
                <div key={item.id} style={styles.listItem}>
                  {item.name} - {item.quantity} ({item.type})
                </div>
              ))
            )}
          </div>

          <div style={styles.card}>
            <h2 style={styles.subtitle}>Hakediş - {selectedPier}</h2>
            {filteredProgress.length === 0 ? (
              <p>Kayıt yok</p>
            ) : (
              filteredProgress.map((item) => {
                const total = Number(item.total_quantity || 0);
                const done = Number(item.completed_quantity || 0);
                const percent = total ? ((done / total) * 100).toFixed(1) : "0";
                return (
                  <div key={item.id} style={styles.listItem}>
                    {item.item} - %{percent}
                  </div>
                );
              })
            )}
          </div>

          <div style={styles.card}>
            <h2 style={styles.subtitle}>Günlük Raporlar - {selectedPier}</h2>
            {filteredLogs.length === 0 ? (
              <p>Rapor yok</p>
            ) : (
              filteredLogs.map((item) => (
                <div key={item.id} style={styles.listItem}>
                  <strong>{item.created_at}</strong>
                  <div style={{ marginTop: 6 }}>{item.description}</div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
