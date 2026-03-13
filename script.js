document.addEventListener("DOMContentLoaded", () => {
  // --- UTILS ---
  const formatCurrency = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    })
      .format(num)
      .replace("Rp", "Rp")
      .replace(/,00$/, "");
  };
  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  // ==========================================
  // NVY STORE LOGIC
  // ==========================================
  if (document.getElementById("nota-nvy")) {
      const inputsNvy = {
    noNota: document.getElementById("input-no-nota"),
    tanggal: document.getElementById("input-tanggal"),
    selesai: document.getElementById("input-selesai"),
    kepada: document.getElementById("input-kepada"),
    perusahaan: document.getElementById("input-perusahaan"),
    telp: document.getElementById("input-telp"),
    alamat: document.getElementById("input-alamat"),
    cs: document.getElementById("input-cs"),
    discount: document.getElementById("input-discount"),
    dp: document.getElementById("input-dp"),
    status: document.getElementById("input-status"),
  };

  const dispNvy = {
    noNota: document.getElementById("disp-no-nota"),
    tanggal: document.getElementById("disp-tanggal"),
    selesai: document.getElementById("disp-selesai"),
    kepada: document.getElementById("disp-kepada"),
    perusahaan: document.getElementById("disp-perusahaan"),
    telp: document.getElementById("disp-telp"),
    alamat: document.getElementById("disp-alamat"),
    cs: document.getElementById("disp-cs"),
    itemsBody: document.getElementById("disp-items-body"),
    subtotal: document.getElementById("disp-subtotal"),
    discount: document.getElementById("disp-discount"),
    totalAkhir: document.getElementById("disp-total-akhir"),
    dp: document.getElementById("disp-dp"),
    pelunasan: document.getElementById("disp-pelunasan"),
    status: document.getElementById("disp-status"),
    totalQty: document.getElementById("disp-total-qty"),
  };

  let nvyItems = [
    {
      judul: "ROLL BANNER KERIPIK KURIHING 60X160 CM",
      ket: "",
      ukuran: "1x1 m",
      jml: "1 Unit",
      biaya: 300000,
    },
  ];

  const renderNvyInputRows = () => {
    const container = document.getElementById("items-container");
    container.innerHTML = "";
    nvyItems.forEach((item, index) => {
      const row = document.createElement("div");
      row.classList.add("item-row");
      row.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <span style="font-weight: bold; font-size: 12px;">Item ${index + 1}</span>
                    <button type="button" class="btn-remove" data-index="${index}" style="background: #ff4d4d; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 10px;">Hapus</button>
                </div>
                <input type="text" class="input-judul" data-index="${index}" placeholder="Judul Barang" value="${item.judul}">
                <input type="text" class="input-ket" data-index="${index}" placeholder="Ket" value="${item.ket}">
                <input type="text" class="input-ukuran" data-index="${index}" placeholder="Ukuran" value="${item.ukuran}">
                <input type="text" class="input-jml" data-index="${index}" placeholder="Jml" value="${item.jml}">
                <input type="number" class="input-biaya" data-index="${index}" placeholder="Biaya" value="${item.biaya}">
            `;
      container.appendChild(row);
    });

    // Re-attach listeners
    container
      .querySelectorAll(".input-judul")
      .forEach((el) =>
        el.addEventListener("input", (e) => updateNvyItem(e, "judul")),
      );
    container
      .querySelectorAll(".input-ket")
      .forEach((el) =>
        el.addEventListener("input", (e) => updateNvyItem(e, "ket")),
      );
    container
      .querySelectorAll(".input-ukuran")
      .forEach((el) =>
        el.addEventListener("input", (e) => updateNvyItem(e, "ukuran")),
      );
    container
      .querySelectorAll(".input-jml")
      .forEach((el) =>
        el.addEventListener("input", (e) => updateNvyItem(e, "jml")),
      );
    container
      .querySelectorAll(".input-biaya")
      .forEach((el) =>
        el.addEventListener("input", (e) => updateNvyItem(e, "biaya")),
      );
    container
      .querySelectorAll(".btn-remove")
      .forEach((el) => el.addEventListener("click", (e) => removeNvyItem(e)));
  };

  const updateNvyItem = (e, field) => {
    const index = e.target.dataset.index;
    let value = e.target.value;
    if (field === "biaya") value = parseFloat(value) || 0;
    nvyItems[index][field] = value;
    updateNvyDisplay();
  };

  window.addNvyItem = () => {
    nvyItems.push({ judul: "", ket: "", ukuran: "", jml: "", biaya: 0 });
    renderNvyInputRows();
    updateNvyDisplay();
  };

  const removeNvyItem = (e) => {
    const index = parseInt(e.target.dataset.index);
    nvyItems.splice(index, 1);
    renderNvyInputRows();
    updateNvyDisplay();
  };

  const updateNvyDisplay = () => {
    dispNvy.noNota.textContent = inputsNvy.noNota.value;
    dispNvy.tanggal.textContent = inputsNvy.tanggal.value;
    dispNvy.selesai.textContent = inputsNvy.selesai.value;
    dispNvy.kepada.textContent = inputsNvy.kepada.value;
    dispNvy.perusahaan.textContent = inputsNvy.perusahaan.value;
    dispNvy.telp.textContent = inputsNvy.telp.value;
    dispNvy.alamat.textContent = inputsNvy.alamat.value;
    dispNvy.cs.textContent = inputsNvy.cs.value;
    dispNvy.status.textContent = inputsNvy.status.value;

    let itemsHtml = "";
    let totalBiaya = 0;

    nvyItems.forEach((item) => {
      totalBiaya += item.biaya;
      itemsHtml += `
                <tr>
                    <td>${item.judul}</td>
                    <td>${item.ket}</td>
                    <td>${item.ukuran}</td>
                    <td>${item.jml}</td>
                    <td class="text-right">${formatNumber(item.biaya)}</td>
                </tr>
            `;
    });
    dispNvy.itemsBody.innerHTML = itemsHtml;

    const discount = parseFloat(inputsNvy.discount.value) || 0;
    const dp = parseFloat(inputsNvy.dp.value) || 0;
    const subtotal = totalBiaya;
    const totalAkhir = subtotal - discount;
    const pelunasan = totalAkhir - dp;

    dispNvy.subtotal.textContent = formatNumber(subtotal);
    dispNvy.discount.textContent = formatNumber(discount);
    dispNvy.totalAkhir.textContent = formatNumber(totalAkhir);
    dispNvy.dp.textContent = formatNumber(dp);
    dispNvy.pelunasan.textContent = formatNumber(pelunasan);
    dispNvy.totalQty.textContent = nvyItems.length;
  };

    Object.values(inputsNvy).forEach((input) => {
      input.addEventListener("input", updateNvyDisplay);
    });

    renderNvyInputRows();
    updateNvyDisplay();
  }

  // ==========================================
  // ISTANA PRINT LOGIC
  // ==========================================
  if (document.getElementById("nota-istana")) {
      const inputsIstana = {
    noNota: document.getElementById("input-istana-no-nota"),
    tanggal: document.getElementById("input-istana-tanggal"),
    selesai: document.getElementById("input-istana-selesai"),
    kepada: document.getElementById("input-istana-kepada"),
    perusahaan: document.getElementById("input-istana-perusahaan"),
    telp: document.getElementById("input-istana-telp"),
    alamat: document.getElementById("input-istana-alamat"),
    cs: document.getElementById("input-istana-cs"),
    discount: document.getElementById("input-istana-discount"),
    dp: document.getElementById("input-istana-dp"),
    status: document.getElementById("input-istana-status"),
  };

  const dispIstana = {
    noNota: document.getElementById("disp-istana-no-nota"),
    tanggal: document.getElementById("disp-istana-tanggal"),
    selesai: document.getElementById("disp-istana-selesai"),
    kepada: document.getElementById("disp-istana-kepada"),
    perusahaan: document.getElementById("disp-istana-perusahaan"),
    telp: document.getElementById("disp-istana-telp"),
    alamat: document.getElementById("disp-istana-alamat"),
    cs: document.getElementById("disp-istana-cs"),
    itemsBody: document.getElementById("disp-istana-items-body"),
    subtotal: document.getElementById("disp-istana-subtotal"),
    discount: document.getElementById("disp-istana-discount"),
    totalAkhir: document.getElementById("disp-istana-total-akhir"),
    dp: document.getElementById("disp-istana-dp"),
    pelunasan: document.getElementById("disp-istana-pelunasan"),
    totalQty: document.getElementById("disp-istana-total-qty"),
  };

  let istanaItems = [
    {
      judul: "umpat",
      ket: "lk",
      ukuran: "2x1 m",
      jml: "1 Lembar",
      biaya: 40000,
    },
  ];

  const renderIstanaInputRows = () => {
    const container = document.getElementById("istana-items-container");
    container.innerHTML = "";
    istanaItems.forEach((item, index) => {
      const row = document.createElement("div");
      row.classList.add("item-row");
      row.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <span style="font-weight: bold; font-size: 12px;">Item ${index + 1}</span>
                    <button type="button" class="btn-remove" data-index="${index}" style="background: #ff4d4d; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 10px;">Hapus</button>
                </div>
                <input type="text" class="input-judul" data-index="${index}" placeholder="Judul Barang" value="${item.judul}">
                <input type="text" class="input-ket" data-index="${index}" placeholder="Ket" value="${item.ket}">
                <input type="text" class="input-ukuran" data-index="${index}" placeholder="Ukuran" value="${item.ukuran}">
                <input type="text" class="input-jml" data-index="${index}" placeholder="Jml" value="${item.jml}">
                <input type="number" class="input-biaya" data-index="${index}" placeholder="Biaya" value="${item.biaya}">
            `;
      container.appendChild(row);
    });

    container
      .querySelectorAll(".input-judul")
      .forEach((el) =>
        el.addEventListener("input", (e) => updateIstanaItem(e, "judul")),
      );
    container
      .querySelectorAll(".input-ket")
      .forEach((el) =>
        el.addEventListener("input", (e) => updateIstanaItem(e, "ket")),
      );
    container
      .querySelectorAll(".input-ukuran")
      .forEach((el) =>
        el.addEventListener("input", (e) => updateIstanaItem(e, "ukuran")),
      );
    container
      .querySelectorAll(".input-jml")
      .forEach((el) =>
        el.addEventListener("input", (e) => updateIstanaItem(e, "jml")),
      );
    container
      .querySelectorAll(".input-biaya")
      .forEach((el) =>
        el.addEventListener("input", (e) => updateIstanaItem(e, "biaya")),
      );
    container
      .querySelectorAll(".btn-remove")
      .forEach((el) => el.addEventListener("click", (e) => removeIstanaItem(e)));
  };

  const updateIstanaItem = (e, field) => {
    const index = e.target.dataset.index;
    let value = e.target.value;
    if (field === "biaya") value = parseFloat(value) || 0;
    istanaItems[index][field] = value;
    updateIstanaDisplay();
  };

  window.addIstanaItem = () => {
    istanaItems.push({ judul: "", ket: "", ukuran: "", jml: "", biaya: 0 });
    renderIstanaInputRows();
    updateIstanaDisplay();
  };

  const removeIstanaItem = (e) => {
    const index = parseInt(e.target.dataset.index);
    istanaItems.splice(index, 1);
    renderIstanaInputRows();
    updateIstanaDisplay();
  };

  window.updateIstanaDisplay = () => {
    dispIstana.noNota.textContent = inputsIstana.noNota.value;
    dispIstana.tanggal.textContent = inputsIstana.tanggal.value;
    dispIstana.selesai.textContent = inputsIstana.selesai.value;
    dispIstana.kepada.textContent = inputsIstana.kepada.value;
    dispIstana.perusahaan.textContent = inputsIstana.perusahaan.value;
    dispIstana.telp.textContent = inputsIstana.telp.value;
    dispIstana.alamat.textContent = inputsIstana.alamat.value;
    dispIstana.cs.textContent = inputsIstana.cs.value;
    
    let itemsHtml = "";
    let totalBiaya = 0;

    istanaItems.forEach((item) => {
      totalBiaya += item.biaya;
      itemsHtml += `
                <tr>
                    <td>${item.judul}</td>
                    <td>${item.ket}</td>
                    <td>${item.ukuran}</td>
                    <td>${item.jml}</td>
                    <td class="text-right">${formatNumber(item.biaya)}</td>
                </tr>
            `;
    });
    dispIstana.itemsBody.innerHTML = itemsHtml;

    const discount = parseFloat(inputsIstana.discount.value) || 0;
    const dp = parseFloat(inputsIstana.dp.value) || 0;
    const subtotal = totalBiaya;
    const totalAkhir = subtotal - discount;
    const pelunasan = totalAkhir - dp;

    dispIstana.subtotal.textContent = formatNumber(subtotal);
    dispIstana.discount.textContent = formatNumber(discount);
    dispIstana.totalAkhir.textContent = formatNumber(totalAkhir);
    dispIstana.dp.textContent = formatNumber(dp);
    dispIstana.pelunasan.textContent = formatNumber(pelunasan);
    dispIstana.totalQty.textContent = istanaItems.length;
  };

    Object.values(inputsIstana).forEach((input) => {
      input.addEventListener("input", updateIstanaDisplay);
    });

    renderIstanaInputRows();
    updateIstanaDisplay();
  }

  // ==========================================
  // SHOPEE LOGIC
  // ==========================================
  if (document.getElementById("nota-shopee")) {
      const inputsShopee = {
    namaPembeli: document.getElementById("shopee-nama-pembeli"),
    namaPenjual: document.getElementById("shopee-nama-penjual"),
    alamatPembeli: document.getElementById("shopee-alamat-pembeli"),
    noHpPembeli: document.getElementById("shopee-nohp-pembeli"),
    noPesanan: document.getElementById("shopee-no-pesanan"),
    waktuPembayaran: document.getElementById("shopee-waktu-pembayaran"),
    metodePembayaran: document.getElementById("shopee-metode-pembayaran"),
    jasaKirim: document.getElementById("shopee-jasa-kirim"),

    subtotalPengiriman: document.getElementById("shopee-subtotal-pengiriman"),
    biayaLayanan: document.getElementById("shopee-biaya-layanan"),
    diskonPengiriman: document.getElementById("shopee-diskon-pengiriman"),
    biayaPenanganan: document.getElementById("shopee-biaya-penanganan"),
    proteksiProduk: document.getElementById("shopee-proteksi-produk"),
    diskonToko: document.getElementById("shopee-diskon-toko"),
    diskonShopee: document.getElementById("shopee-diskon-shopee"),
  };

  const dispShopee = {
    namaPembeli: document.getElementById("disp-shopee-nama-pembeli"),
    namaPenjual: document.getElementById("disp-shopee-nama-penjual"),
    alamatPembeli: document.getElementById("disp-shopee-alamat-pembeli"),
    noHpPembeli: document.getElementById("disp-shopee-nohp-pembeli"),
    noPesanan: document.getElementById("disp-shopee-no-pesanan"),
    waktuPembayaran: document.getElementById("disp-shopee-waktu-pembayaran"),
    metodePembayaran: document.getElementById("disp-shopee-metode-pembayaran"),
    jasaKirim: document.getElementById("disp-shopee-jasa-kirim"),

    itemsBody: document.getElementById("disp-shopee-items-body"),
    subtotal: document.getElementById("disp-shopee-subtotal"),
    totalQty: document.getElementById("disp-shopee-total-qty"),

    totalsSubtotal: document.getElementById("disp-shopee-totals-subtotal"),
    subtotalPengiriman: document.getElementById(
      "disp-shopee-subtotal-pengiriman",
    ),
    biayaLayanan: document.getElementById("disp-shopee-biaya-layanan"),
    diskonPengiriman: document.getElementById("disp-shopee-diskon-pengiriman"),
    biayaPenanganan: document.getElementById("disp-shopee-biaya-penanganan"),
    proteksiProduk: document.getElementById("disp-shopee-proteksi-produk"),
    diskonToko: document.getElementById("disp-shopee-diskon-toko"),
    diskonShopee: document.getElementById("disp-shopee-diskon-shopee"),
    totalPembayaran: document.getElementById("disp-shopee-total-pembayaran"),
  };

  let shopeeItems = [
    {
      produk:
        "SHINPO Kontainer Plastik Dengan Roda Sky Container Box Kotak Penyimpanan SPO-SIP-111-CB-45",
      variasi: "Hijau",
      harga: 72200,
      qty: 1,
    },
    {
      produk:
        "SHINPO Kontainer Plastik Dengan Roda Sky Container Box Kotak Penyimpanan SPO-SIP-111-CB-45",
      variasi: "Orange",
      harga: 72700,
      qty: 1,
    },
  ];

  const renderShopeeInputRows = () => {
    const container = document.getElementById("shopee-items-container");
    container.innerHTML = "";
    shopeeItems.forEach((item, index) => {
      const row = document.createElement("div");
      row.classList.add("item-row");
      row.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <span style="font-weight: bold; font-size: 12px;">Item Pesanan ${index + 1}</span>
                    <button type="button" class="btn-remove-shopee" data-index="${index}" style="background: #ff4d4d; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 10px;">Hapus</button>
                </div>
                <input type="text" class="shopee-input-produk" data-index="${index}" placeholder="Produk" value="${item.produk}">
                <input type="text" class="shopee-input-variasi" data-index="${index}" placeholder="Variasi" value="${item.variasi}">
                <input type="number" class="shopee-input-harga" data-index="${index}" placeholder="Harga Produk" value="${item.harga}">
                <input type="number" class="shopee-input-qty" data-index="${index}" placeholder="Kuantitas" value="${item.qty}">
            `;
      container.appendChild(row);
    });

    // Re-attach listeners
    container
      .querySelectorAll(".shopee-input-produk")
      .forEach((el) =>
        el.addEventListener("input", (e) => updateShopeeItem(e, "produk")),
      );
    container
      .querySelectorAll(".shopee-input-variasi")
      .forEach((el) =>
        el.addEventListener("input", (e) => updateShopeeItem(e, "variasi")),
      );
    container
      .querySelectorAll(".shopee-input-harga")
      .forEach((el) =>
        el.addEventListener("input", (e) => updateShopeeItem(e, "harga")),
      );
    container
      .querySelectorAll(".shopee-input-qty")
      .forEach((el) =>
        el.addEventListener("input", (e) => updateShopeeItem(e, "qty")),
      );
    container
      .querySelectorAll(".btn-remove-shopee")
      .forEach((el) =>
        el.addEventListener("click", (e) => removeShopeeItem(e)),
      );
  };

  const updateShopeeItem = (e, field) => {
    const index = e.target.dataset.index;
    let value = e.target.value;
    if (field === "harga" || field === "qty") value = parseFloat(value) || 0;
    shopeeItems[index][field] = value;
    updateShopeeDisplay();
  };

  window.addShopeeItem = () => {
    shopeeItems.push({ produk: "", variasi: "", harga: 0, qty: 1 });
    renderShopeeInputRows();
    updateShopeeDisplay();
  };

  const removeShopeeItem = (e) => {
    const index = parseInt(e.target.dataset.index);
    shopeeItems.splice(index, 1);
    renderShopeeInputRows();
    updateShopeeDisplay();
  };

  const updateShopeeDisplay = () => {
    // Simple mappings
    dispShopee.namaPembeli.textContent = inputsShopee.namaPembeli.value;
    dispShopee.namaPenjual.textContent = inputsShopee.namaPenjual.value;
    dispShopee.alamatPembeli.textContent = inputsShopee.alamatPembeli.value;
    dispShopee.noHpPembeli.textContent = inputsShopee.noHpPembeli.value;
    dispShopee.noPesanan.textContent = inputsShopee.noPesanan.value;
    dispShopee.waktuPembayaran.textContent = inputsShopee.waktuPembayaran.value;
    dispShopee.metodePembayaran.textContent =
      inputsShopee.metodePembayaran.value;
    dispShopee.jasaKirim.textContent = inputsShopee.jasaKirim.value;

    // Items mapping
    let itemsHtml = "";
    let subtotalPesanan = 0;
    let totalQty = 0;

    shopeeItems.forEach((item, idx) => {
      const rowTotal = item.harga * item.qty;
      subtotalPesanan += rowTotal;
      totalQty += item.qty;
      itemsHtml += `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${item.produk}</td>
                    <td>${item.variasi}</td>
                    <td class="text-center">${formatCurrency(item.harga)}</td>
                    <td class="text-center">${item.qty}</td>
                    <td class="text-right">${formatCurrency(rowTotal)}</td>
                </tr>
            `;
    });
    dispShopee.itemsBody.innerHTML = itemsHtml;

    dispShopee.subtotal.textContent = formatCurrency(subtotalPesanan);
    dispShopee.totalQty.textContent = totalQty;

    // Totals Mapping
    const subtotalPengiriman =
      parseFloat(inputsShopee.subtotalPengiriman.value) || 0;
    const biayaLayanan = parseFloat(inputsShopee.biayaLayanan.value) || 0;
    const diskonPengiriman =
      parseFloat(inputsShopee.diskonPengiriman.value) || 0;
    const biayaPenanganan = parseFloat(inputsShopee.biayaPenanganan.value) || 0;
    const proteksiProduk = parseFloat(inputsShopee.proteksiProduk.value) || 0;
    const diskonToko = parseFloat(inputsShopee.diskonToko.value) || 0;
    const diskonShopee = parseFloat(inputsShopee.diskonShopee.value) || 0;

    const totalPembayaran =
      subtotalPesanan +
      subtotalPengiriman +
      biayaLayanan +
      diskonPengiriman +
      biayaPenanganan +
      proteksiProduk +
      diskonToko +
      diskonShopee;

    dispShopee.totalsSubtotal.textContent = formatCurrency(subtotalPesanan);
    dispShopee.subtotalPengiriman.textContent =
      formatCurrency(subtotalPengiriman);
    dispShopee.biayaLayanan.textContent = formatCurrency(biayaLayanan);

    const toggleRow = (rowId, value) => {
        const row = document.getElementById(rowId);
        if (row) {
            row.style.display = (value === 0 || isNaN(value)) ? "none" : "";
        }
    };
    
    toggleRow("row-shopee-subtotal-pengiriman", subtotalPengiriman);
    toggleRow("row-shopee-biaya-layanan", biayaLayanan);
    toggleRow("row-shopee-diskon-pengiriman", diskonPengiriman);
    toggleRow("row-shopee-biaya-penanganan", biayaPenanganan);
    toggleRow("row-shopee-proteksi-produk", proteksiProduk);
    toggleRow("row-shopee-diskon-toko", diskonToko);
    toggleRow("row-shopee-diskon-shopee", diskonShopee);

    // Handling negative values correctly (image shows -Rp30.000)
    dispShopee.diskonPengiriman.textContent =
      diskonPengiriman < 0
        ? "-" + formatCurrency(Math.abs(diskonPengiriman))
        : formatCurrency(diskonPengiriman);

    dispShopee.biayaPenanganan.textContent = formatCurrency(biayaPenanganan);
    dispShopee.proteksiProduk.textContent = formatCurrency(proteksiProduk);

    dispShopee.diskonToko.textContent =
      diskonToko < 0
        ? "-" + formatCurrency(Math.abs(diskonToko))
        : formatCurrency(diskonToko);
    dispShopee.diskonShopee.textContent =
      diskonShopee < 0
        ? "-" + formatCurrency(Math.abs(diskonShopee))
        : formatCurrency(diskonShopee);

    dispShopee.totalPembayaran.textContent = formatCurrency(totalPembayaran);
  };

    Object.values(inputsShopee).forEach((input) => {
      input.addEventListener("input", updateShopeeDisplay);
    });

    renderShopeeInputRows();
    updateShopeeDisplay();
  }
  // ==========================================
  // PNG TO PDF LOGIC
  // ==========================================
  if (document.getElementById("png-to-pdf-app")) {
    const uploadZone = document.getElementById("upload-zone");
    const fileInput = document.getElementById("file-input");
    const previewList = document.getElementById("image-preview-list");
    const actionBar = document.getElementById("action-bar");
    const pdfOptions = document.getElementById("pdf-options");
    const pdfFilenameInput = document.getElementById("pdf-filename");
    const btnClearAll = document.getElementById("btn-clear-all");
    const btnGeneratePdf = document.getElementById("btn-generate-pdf");

    let selectedFiles = [];

    // Get filename without extension
    const getBaseName = (filename) => {
      return filename.replace(/\.[^/.]+$/, "");
    };

    const handleFiles = (files) => {
      const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      if (validFiles.length > 0) {
        // If this is the first batch, auto-fill the filename from the first image
        if (selectedFiles.length === 0) {
          pdfFilenameInput.value = getBaseName(validFiles[0].name);
        }
        selectedFiles = [...selectedFiles, ...validFiles];
        renderPreview();
      }
    };

    uploadZone.addEventListener("click", () => fileInput.click());
    
    uploadZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadZone.classList.add("dragover");
    });

    uploadZone.addEventListener("dragleave", () => {
      uploadZone.classList.remove("dragover");
    });

    uploadZone.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadZone.classList.remove("dragover");
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    });

    fileInput.addEventListener("change", (e) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
      fileInput.value = ""; // reset so same file can be re-selected
    });

    const formatBytes = (bytes, decimals = 2) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const renderPreview = () => {
      previewList.innerHTML = "";
      
      const hasFiles = selectedFiles.length > 0;
      actionBar.style.display = hasFiles ? "flex" : "none";
      pdfOptions.style.display = hasFiles ? "block" : "none";

      selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const div = document.createElement("div");
          div.className = "image-preview-item";
          div.innerHTML = `
            <img src="${e.target.result}" alt="preview" />
            <div class="image-info">
              <p class="image-name">${file.name}</p>
              <p class="image-size">${formatBytes(file.size)}</p>
            </div>
            <button class="btn-remove-img" data-index="${index}">Hapus</button>
          `;
          previewList.appendChild(div);

          div.querySelector('.btn-remove-img').addEventListener('click', () => {
            selectedFiles.splice(index, 1);
            if (selectedFiles.length > 0) {
              pdfFilenameInput.value = getBaseName(selectedFiles[0].name);
            } else {
              pdfFilenameInput.value = "converted";
            }
            renderPreview();
          });
        };
        reader.readAsDataURL(file);
      });
    };

    btnClearAll.addEventListener("click", () => {
      selectedFiles = [];
      pdfFilenameInput.value = "converted";
      renderPreview();
    });

    // Helper: read file as data URL
    const readFileAsDataURL = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    // Helper: load an image element
    const loadImage = (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    // Helper: detect format from file type
    const getImageFormat = (file) => {
      if (file.type === 'image/png') return 'PNG';
      return 'JPEG';
    };

    btnGeneratePdf.addEventListener("click", async () => {
      if (selectedFiles.length === 0) return;

      // Check if jsPDF is available
      if (!window.jspdf) {
        alert("Library jsPDF belum dimuat. Pastikan Anda terhubung ke internet lalu muat ulang halaman.");
        return;
      }
      
      btnGeneratePdf.textContent = "Memproses...";
      btnGeneratePdf.disabled = true;

      try {
        const { jsPDF } = window.jspdf;
        
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const imgData = await readFileAsDataURL(file);
          const img = await loadImage(imgData);

          const imgWidth = img.naturalWidth;
          const imgHeight = img.naturalHeight;
          const format = getImageFormat(file);

          // Determine orientation: landscape or portrait
          const orientation = imgWidth > imgHeight ? 'l' : 'p';

          if (i === 0) {
            // Create the PDF with the first page matching the image orientation
            var pdf = new jsPDF({ orientation: orientation, unit: 'mm', format: 'a4' });
          } else {
            pdf.addPage('a4', orientation);
          }

          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();

          // Scale image to fit page while maintaining aspect ratio
          const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
          const scaledWidth = imgWidth * ratio;
          const scaledHeight = imgHeight * ratio;

          // Center the image on the page
          const x = (pageWidth - scaledWidth) / 2;
          const y = (pageHeight - scaledHeight) / 2;

          pdf.addImage(imgData, format, x, y, scaledWidth, scaledHeight);
        }

        // Use custom filename
        let filename = pdfFilenameInput.value.trim();
        if (!filename) filename = "converted";
        // Remove .pdf extension if user already typed it
        filename = filename.replace(/\.pdf$/i, "");

        pdf.save(filename + ".pdf");
      } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Terjadi kesalahan saat membuat PDF: " + error.message);
      } finally {
        btnGeneratePdf.textContent = "Buat PDF";
        btnGeneratePdf.disabled = false;
      }
    });
  }
  // ==========================================
  // CUSTOM NOTA LOGIC
  // ==========================================
  if (document.getElementById("nota-custom")) {
    const today = new Date();
    const localDateTime = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById("custom-date-time").value = localDateTime;

    let customItems = [{ desc: "Contoh Produk / Jasa", qty: 1, price: 50000 }];
    let customCosts = [];
    let customNotes = ["Terima Kasih Atas Kunjungan Anda"];

    const formatNum = (num) => new Intl.NumberFormat("id-ID").format(num);

    const presetSelect = document.getElementById("custom-preset");
    const docFormat = document.getElementById("custom-print-format");

    const grpMerchant = document.getElementById("grp-merchant");
    const grpNoTagihan = document.getElementById("grp-notagihan");
    const grpPonta = document.getElementById("grp-ponta");

    // --- Preset Data ---
    const presets = {
      indomaret: {
        name: "INDOMARET",
        addr: "MARCO FRISMATAMA / MENARA INDOMARET\nJL. TERATAI PUTIH RAYA NO. 11 RT.06/13",
        phone: "01.337.994.6-092.000",
        merchant: "Google Play Indonesia",
        items: [{ desc: "PMBYRN GOOGLE PLAY", qty: 1, price: 100000 }],
        notes: ["LAYANAN KONSUMEN SMS 0811 1500 280", "CALL 1500 280 - KONTAK@INDOMARET.CO.ID"],
        logo: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Indomaret_logo.svg"
      },
      alfamart: {
        name: "ALFAMART SUPRATMAN",
        addr: "PT.SUMBER ALFARIA TRIJAYA,TBK\nJL. SUPRATMAN NO 104 RT 01/12",
        phone: "081294657901",
        ponta: "0123456789",
        items: [{ desc: "SAMPOERNA MRH16", qty: 1, price: 33900 }, { desc: "ALFA AMP P90 10", qty: 1, price: 5200 }],
        notes: ["KRITIK&SARAN:1500959", "SMS/WA: 031110640888"],
        logo: "https://upload.wikimedia.org/wikipedia/commons/8/86/Alfamart_logo.svg"
      }
    };

    presetSelect.addEventListener("change", () => {
      const v = presetSelect.value;
      
      // Toggle field visibility
      grpMerchant.style.display = (v === "indomaret") ? "block" : "none";
      grpNoTagihan.style.display = (v === "indomaret") ? "block" : "none";
      grpPonta.style.display = (v === "alfamart") ? "block" : "none";

      if (presets[v]) {
        const p = presets[v];
        document.getElementById("custom-business-name").value = p.name;
        document.getElementById("custom-business-address").value = p.addr;
        document.getElementById("custom-business-phone").value = p.phone;
        if (p.merchant) document.getElementById("custom-merchant").value = p.merchant;
        if (p.ponta) document.getElementById("custom-ponta").value = p.ponta;
        customItems = [...p.items];
        customNotes = [...p.notes];
        renderCustomItems();
        renderCustomNotes();
      }
      updateCustomDisplay();
    });

    // --- Payment UI Toggles ---
    const paymentMethod = document.getElementById("custom-payment-method");
    const bankGroup = document.getElementById("custom-bank-group");
    const accountGroup = document.getElementById("custom-account-group");
    const accountHolderGroup = document.getElementById("custom-account-holder-group");
    const customPaymentGroup = document.getElementById("custom-payment-custom-group");

    paymentMethod.addEventListener("change", () => {
      const v = paymentMethod.value;
      bankGroup.style.display = (v === "transfer" || v === "ewallet" || v === "qris") ? "block" : "none";
      accountGroup.style.display = (v === "transfer" || v === "ewallet") ? "block" : "none";
      accountHolderGroup.style.display = (v === "transfer") ? "block" : "none";
      customPaymentGroup.style.display = (v === "custom") ? "block" : "none";
      updateCustomDisplay();
    });

    const paymentStatus = document.getElementById("custom-payment-status");
    const dpGroup = document.getElementById("custom-dp-group");
    paymentStatus.addEventListener("change", () => {
      dpGroup.style.display = (paymentStatus.value === "DP" || paymentStatus.value === "CICILAN") ? "block" : "none";
      updateCustomDisplay();
    });

    // --- Format Toggle ---
    docFormat.addEventListener("change", () => {
      const isThermal = docFormat.value.startsWith("thermal");
      document.getElementById("nota-custom").style.display = isThermal ? "none" : "block";
      const th = document.getElementById("nota-thermal");
      th.style.display = isThermal ? "block" : "none";
      if (isThermal) {
        th.classList.remove("thermal-58", "thermal-80");
        th.classList.add(docFormat.value);
      }
      updateCustomDisplay();
    });

    // --- Rendering Items/Notes ---
    const renderCustomItems = () => {
      const c = document.getElementById("custom-items-container");
      c.innerHTML = "";
      customItems.forEach((item, i) => {
        const row = document.createElement("div");
        row.classList.add("item-row");
        row.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
            <b>Item ${i + 1}</b>
            <button onclick="removeCIT(${i})" style="color:#ff6b6b;border:none;background:none;cursor:pointer;font-size:10px;">Hapus</button>
          </div>
          <input type="text" oninput="editCIT(${i},'desc',this.value)" placeholder="Deskripsi" value="${item.desc}">
          <input type="number" oninput="editCIT(${i},'qty',this.value)" placeholder="Qty" value="${item.qty}">
          <input type="number" oninput="editCIT(${i},'price',this.value)" placeholder="Harga" value="${item.price}">
        `;
        c.appendChild(row);
      });
    };
    window.editCIT = (i, k, v) => { customItems[i][k] = (k==="qty"||k==="price") ? parseFloat(v)||0 : v; updateCustomDisplay(); };
    window.removeCIT = (i) => { customItems.splice(i,1); renderCustomItems(); updateCustomDisplay(); };
    window.addCustomItem = () => { customItems.push({ desc: "", qty: 1, price: 0 }); renderCustomItems(); updateCustomDisplay(); };

    const renderCustomNotes = () => {
      const c = document.getElementById("custom-notes-container");
      c.innerHTML = "";
      customNotes.forEach((note, i) => {
        const row = document.createElement("div");
        row.classList.add("item-row");
        row.innerHTML = `<input type="text" oninput="editCN(${i},this.value)" value="${note}">`;
        c.appendChild(row);
      });
    };
    window.editCN = (i, v) => { customNotes[i] = v; updateCustomDisplay(); };
    window.addCustomNote = () => { customNotes.push(""); renderCustomNotes(); updateCustomDisplay(); };

    // --- Logo Upload ---
    const logoUpload = document.getElementById("custom-logo-upload");
    const a4LogoContainer = document.getElementById("a4-logo-container");
    const a4LogoImg = document.getElementById("a4-logo-img");
    const thLogoContainer = document.getElementById("th-logo-container");
    const thLogoImg = document.getElementById("th-logo-img");

    logoUpload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const src = event.target.result;
          a4LogoImg.src = src;
          a4LogoContainer.style.display = "block";
          thLogoImg.src = src;
          thLogoContainer.style.display = "block";
        };
        reader.readAsDataURL(file);
      }
    });

    // --- Main Display Update ---
    const updateCustomDisplay = () => {
      const preset = presetSelect.value;
      const name = document.getElementById("custom-business-name").value;
      const addr = document.getElementById("custom-business-address").value;
      const phone = document.getElementById("custom-business-phone").value;
      const docNum = document.getElementById("custom-doc-number").value;
      const dtVal = document.getElementById("custom-date-time").value;
      const kasir = document.getElementById("custom-kasir").value;

      // Update preset logos if no custom logo is uploaded
      if (presets[preset] && !logoUpload.files[0]) {
        const pLogo = presets[preset].logo;
        a4LogoImg.src = pLogo;
        a4LogoContainer.style.display = "block";
        thLogoImg.src = pLogo;
        thLogoContainer.style.display = "block";
      } else if (!presets[preset] && !logoUpload.files[0]) {
        a4LogoContainer.style.display = "none";
        thLogoContainer.style.display = "none";
      }

      // A4 Update
      document.getElementById("disp-custom-business-name").textContent = name;
      document.getElementById("disp-custom-business-address").textContent = addr;
      document.getElementById("disp-custom-business-phone").textContent = phone;
      document.getElementById("disp-custom-doc-number").textContent = docNum;
      document.getElementById("disp-custom-date").textContent = dtVal ? new Date(dtVal).toLocaleString("id-ID") : "-";
      
      let itemsHtml = ""; let subtotal = 0;
      customItems.forEach((it, i) => {
        const t = it.qty * it.price; subtotal += t;
        itemsHtml += `<tr><td>${i+1}</td><td>${it.desc}</td><td>${it.qty}</td><td class="text-right">${formatNum(it.price)}</td><td class="text-right">${formatNum(t)}</td></tr>`;
      });
      document.getElementById("disp-custom-items-body").innerHTML = itemsHtml;
      document.getElementById("disp-custom-subtotal").textContent = formatNum(subtotal);
      
      const total = subtotal; // Simplified for now
      document.getElementById("disp-custom-total").textContent = formatNum(total);

      // Thermal Update
      document.getElementById("th-store-name").textContent = name;
      document.getElementById("th-store-addr").textContent = addr;
      document.getElementById("th-store-phone").textContent = phone;

      const thMeta = document.getElementById("th-meta-custom");
      thMeta.innerHTML = `
        <div><span class="th-label">No</span>: ${docNum}</div>
        <div><span class="th-label">Tgl</span>: ${dtVal ? new Date(dtVal).toLocaleString("id-ID") : "-"}</div>
        <div><span class="th-label">Kasir</span>: ${kasir}</div>
      `;

      if (preset === "indomaret") {
        const merchant = document.getElementById("custom-merchant").value;
        const noTagihan = document.getElementById("custom-notagihan").value;
        thMeta.innerHTML += `
          <div><hr style="border:none; border-top:1px dashed #000; margin:2px 0;"></div>
          <div>Merchant: ${merchant}</div>
          <div>No. Tagihan: ${noTagihan}</div>
        `;
        document.getElementById("th-barcode-area").style.display = "block";
        document.getElementById("th-barcode-area").querySelector("div:last-child").textContent = noTagihan;
      } else {
        document.getElementById("th-barcode-area").style.display = "none";
      }

      if (preset === "alfamart") {
        const ponta = document.getElementById("custom-ponta").value;
        if (ponta) thMeta.innerHTML += `<div>No. Ponta: ${ponta}</div>`;
      }

      let thItemsHtml = "";
      customItems.forEach(it => {
        thItemsHtml += `
          <div class="thermal-item">
            <div class="thermal-item-name">${it.desc}</div>
            <div class="thermal-item-detail">
              <span>${it.qty} x ${formatNum(it.price)}</span>
              <span>${formatNum(it.qty * it.price)}</span>
            </div>
          </div>
        `;
      });
      document.getElementById("th-items").innerHTML = thItemsHtml;

      document.getElementById("th-totals").innerHTML = `
        <div class="thermal-total-row"><span>SUBTOTAL</span><span>${formatNum(subtotal)}</span></div>
        <div class="thermal-total-row grand-total"><span>TOTAL</span><span>${formatNum(total)}</span></div>
      `;

      document.getElementById("th-payment-method").textContent = "Metode: " + paymentMethod.value.toUpperCase();
      document.getElementById("th-status").textContent = paymentStatus.value;

      // Logo handling
      const logoContainer = document.getElementById("th-logo-container");
      const logoImg = document.getElementById("th-logo-img");
      if (presets[preset] && presets[preset].logo) {
        logoImg.src = presets[preset].logo;
        logoContainer.style.display = "block";
      } else {
        logoContainer.style.display = "none";
      }

      let thFooter = "";
      customNotes.forEach(n => thFooter += `<p>${n}</p>`);
      document.getElementById("th-footer").innerHTML = thFooter;
    };

    [ "custom-business-name", "custom-business-address", "custom-business-phone", "custom-doc-number", "custom-date-time", "custom-kasir", "custom-merchant", "custom-notagihan", "custom-ponta", "custom-payment-method", "custom-payment-status" ].forEach(id => {
      const el = document.getElementById(id); if (el) el.addEventListener("input", updateCustomDisplay);
    });

    renderCustomItems(); renderCustomNotes(); updateCustomDisplay();
  }
});
