/**
 * ==========================================================================
 * THERMAL SERIAL PRINTER — Web Serial API
 * ==========================================================================
 * Berdasarkan test-serial.html yang TERBUKTI JALAN di RPP02 COM4.
 * Pola: requestPort() langsung di onclick, writer.releaseLock() setelah print.
 *
 * Tidak mengubah window.print(). Tidak mengubah print biasa.
 * ==========================================================================
 */

(function () {
  "use strict";

  // ---- State ----
  var _port = null;
  var _statusCb = null;

  // ---- Config ----
  var LINE_WIDTH = 32;
  var BAUD_RATE = 9600;

  // ---- ESC/POS ----
  var ESC = 0x1b;
  var GS = 0x1d;
  var INIT = [ESC, 0x40];
  var ALIGN_LEFT = [ESC, 0x61, 0x00];
  var ALIGN_CENTER = [ESC, 0x61, 0x01];
  var BOLD_ON = [ESC, 0x45, 0x01];
  var BOLD_OFF = [ESC, 0x45, 0x00];
  var DOUBLE_ON = [GS, 0x21, 0x11];
  var DOUBLE_OFF = [GS, 0x21, 0x00];

  var encoder = new TextEncoder();

  // ---- Helpers ----
  function setStatus(status, msg) {
    console.log("[ThermalSerial]", status, msg || "");
    if (_statusCb) {
      try { _statusCb(status, msg || ""); } catch (e) { console.warn(e); }
    }
  }

  function txt(s) { return encoder.encode(String(s)); }
  function nl() { return encoder.encode("\n"); }
  function cmd(arr) { return new Uint8Array(arr); }

  function formatNum(n) {
    return new Intl.NumberFormat("id-ID").format(Number(n) || 0);
  }

  function padRight(s, w) {
    s = String(s);
    return s.length >= w ? s.substring(0, w) : s + " ".repeat(w - s.length);
  }

  function padBetween(left, right, w) {
    left = String(left);
    right = String(right);
    var gap = w - left.length - right.length;
    if (gap <= 0) return (left + " " + right).substring(0, w);
    return left + " ".repeat(gap) + right;
  }

  function wrapText(text, maxW) {
    text = String(text || "");
    if (text.length <= maxW) return [text];
    var lines = [];
    var rem = text;
    while (rem.length > 0) {
      if (rem.length <= maxW) { lines.push(rem); break; }
      var bp = rem.lastIndexOf(" ", maxW);
      if (bp <= 0) bp = maxW;
      lines.push(rem.substring(0, bp));
      rem = rem.substring(bp).replace(/^\s+/, "");
    }
    return lines;
  }

  function safe(val) {
    return String(val == null ? "" : val).replace(/[^\x20-\x7E]/g, "").trim();
  }

  // ==================================================================
  // PUBLIC API — semua di-attach ke window.ThermalSerial
  // ==================================================================

  var API = {};

  API.isSupported = function () {
    return "serial" in navigator;
  };

  API.onStatusChange = function (cb) {
    _statusCb = cb;
  };

  API.getStatus = function () {
    return _port ? "connected" : "disconnected";
  };

  API.isConnected = function () {
    return _port !== null;
  };

  // ---- CONNECT ----
  // Persis pola test-serial.html: requestPort() LANGSUNG, tanpa apapun sebelumnya
  API.connect = async function () {
    if (!("serial" in navigator)) {
      setStatus("error", "Browser tidak support Web Serial. Pakai Chrome/Edge desktop.");
      return false;
    }

    if (_port) {
      setStatus("connected", "Printer sudah terhubung.");
      return true;
    }

    try {
      // LANGSUNG requestPort() — sama persis test-serial.html
      _port = await navigator.serial.requestPort();

      await _port.open({
        baudRate: BAUD_RATE,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        flowControl: "none",
      });

      setStatus("connected", "Thermal printer terhubung.");
      return true;
    } catch (err) {
      console.error("[ThermalSerial] connect error:", err);
      _port = null;

      if (err && err.name === "NotFoundError") {
        setStatus("disconnected", "Tidak ada printer yang dipilih.");
      } else {
        setStatus("error", "Connect error: " + (err.message || err));
      }
      return false;
    }
  };

  // ---- DISCONNECT ----
  API.disconnect = async function () {
    try {
      if (_port) {
        await _port.close();
        _port = null;
      }
      setStatus("disconnected", "Thermal printer terputus.");
    } catch (err) {
      console.error("[ThermalSerial] disconnect error:", err);
      _port = null;
      setStatus("disconnected", "Terputus (error: " + (err.message || err) + ")");
    }
  };

  // ---- PRINT ----
  // Pola persis test-serial.html: getWriter() → write → releaseLock()
  API.print = async function (data) {
    if (!_port) {
      setStatus("error", "Printer belum terhubung.");
      return false;
    }

    var writer = null;

    try {
      setStatus("printing", "Mencetak...");

      writer = _port.writable.getWriter();

      // === BUILD & SEND RECEIPT ===

      // Init
      await writer.write(cmd(INIT));

      // Header — center, bold, double
      await writer.write(cmd(ALIGN_CENTER));
      await writer.write(cmd(BOLD_ON));
      await writer.write(cmd(DOUBLE_ON));
      await writer.write(txt(safe(data.storeName || "TOKO")));
      await writer.write(nl());
      await writer.write(cmd(DOUBLE_OFF));
      await writer.write(cmd(BOLD_OFF));

      // Address
      if (data.storeAddress) {
        var addrLines = String(data.storeAddress).split("\n");
        for (var a = 0; a < addrLines.length; a++) {
          await writer.write(txt(addrLines[a].trim()));
          await writer.write(nl());
        }
      }

      // Phone
      if (data.storePhone) {
        await writer.write(txt(safe(data.storePhone)));
        await writer.write(nl());
      }

      await writer.write(txt("=".repeat(LINE_WIDTH)));
      await writer.write(nl());

      // Meta — left align
      await writer.write(cmd(ALIGN_LEFT));

      if (data.docNumber) {
        await writer.write(txt(padRight("No   : " + safe(data.docNumber), LINE_WIDTH)));
        await writer.write(nl());
      }
      if (data.dateTime) {
        await writer.write(txt(padRight("Tgl  : " + safe(data.dateTime), LINE_WIDTH)));
        await writer.write(nl());
      }
      if (data.kasir) {
        await writer.write(txt(padRight("Kasir: " + safe(data.kasir), LINE_WIDTH)));
        await writer.write(nl());
      }
      if (data.customerName) {
        await writer.write(txt(padRight("Kpd  : " + safe(data.customerName), LINE_WIDTH)));
        await writer.write(nl());
      }

      await writer.write(txt("-".repeat(LINE_WIDTH)));
      await writer.write(nl());

      // Items
      var items = data.items || [];
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var desc = safe(item.desc || item.name || "Item");
        var qty = Number(item.qty || 1);
        var price = Number(item.price || 0);
        var total = Number(item.total || qty * price);

        var descLines = wrapText(desc, LINE_WIDTH);
        for (var d = 0; d < descLines.length; d++) {
          await writer.write(txt(descLines[d]));
          await writer.write(nl());
        }

        var left = " " + qty + " x " + formatNum(price);
        var right = formatNum(total);
        await writer.write(txt(padBetween(left, right, LINE_WIDTH)));
        await writer.write(nl());
      }

      await writer.write(txt("-".repeat(LINE_WIDTH)));
      await writer.write(nl());

      // Totals
      var subtotal = Number(data.subtotal || 0);
      var grandTotal = Number(data.grandTotal || data.total || subtotal);

      await writer.write(txt(padBetween("SUBTOTAL", formatNum(subtotal), LINE_WIDTH)));
      await writer.write(nl());

      // Extra costs
      if (data.costs && data.costs.length > 0) {
        for (var c = 0; c < data.costs.length; c++) {
          var cost = data.costs[c];
          if (!cost || !cost.name) continue;
          var amt = Number(cost.amount || 0);
          var amtStr = amt < 0 ? "-" + formatNum(Math.abs(amt)) : formatNum(amt);
          await writer.write(txt(padBetween(safe(cost.name).toUpperCase(), amtStr, LINE_WIDTH)));
          await writer.write(nl());
        }
      }

      await writer.write(txt("=".repeat(LINE_WIDTH)));
      await writer.write(nl());

      // Grand total — bold
      await writer.write(cmd(BOLD_ON));
      await writer.write(txt(padBetween("TOTAL", formatNum(grandTotal), LINE_WIDTH)));
      await writer.write(nl());
      await writer.write(cmd(BOLD_OFF));

      // DP / Sisa
      var payStatus = safe(data.paymentStatus || "LUNAS").toUpperCase();
      if (payStatus === "DP" || payStatus === "CICILAN") {
        var dp = Number(data.dpAmount || 0);
        await writer.write(txt(padBetween("DP/BAYAR", formatNum(dp), LINE_WIDTH)));
        await writer.write(nl());
        await writer.write(txt(padBetween("SISA", formatNum(grandTotal - dp), LINE_WIDTH)));
        await writer.write(nl());
      }

      await writer.write(txt("=".repeat(LINE_WIDTH)));
      await writer.write(nl());

      // Payment method
      if (data.paymentMethod) {
        await writer.write(txt(padRight("Bayar: " + safe(data.paymentMethod), LINE_WIDTH)));
        await writer.write(nl());
      }

      // Status (LUNAS / DP)
      await writer.write(cmd(ALIGN_CENTER));
      await writer.write(cmd(BOLD_ON));
      await writer.write(txt(payStatus));
      await writer.write(nl());
      await writer.write(cmd(BOLD_OFF));

      await writer.write(cmd(ALIGN_LEFT));
      await writer.write(txt("-".repeat(LINE_WIDTH)));
      await writer.write(nl());

      // Footer notes
      await writer.write(cmd(ALIGN_CENTER));
      if (data.notes && data.notes.length > 0) {
        for (var n = 0; n < data.notes.length; n++) {
          if (data.notes[n]) {
            await writer.write(txt(safe(data.notes[n])));
            await writer.write(nl());
          }
        }
      } else {
        await writer.write(txt("Terima kasih"));
        await writer.write(nl());
      }

      // Feed paper
      await writer.write(nl());
      await writer.write(nl());
      await writer.write(nl());
      await writer.write(nl());
      await writer.write(nl());

      setStatus("connected", "Cetak thermal berhasil.");
      return true;

    } catch (err) {
      console.error("[ThermalSerial] print error:", err);

      if (err && err.message && err.message.toLowerCase().includes("disconnect")) {
        _port = null;
        setStatus("error", "Printer terputus saat mencetak.");
      } else {
        setStatus("error", "Print error: " + (err.message || err));
      }
      return false;

    } finally {
      // PENTING: releaseLock() — sama persis test-serial.html
      if (writer) {
        try { writer.releaseLock(); } catch (e) { console.warn(e); }
      }
    }
  };

  // ==================================================================
  // EXPOSE ke window — PASTI bisa diakses dari script manapun
  // ==================================================================
  window.ThermalSerial = API;

  console.log("[ThermalSerial] Module loaded. Web Serial supported:", API.isSupported());

})();