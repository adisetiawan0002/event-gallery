const params = new URLSearchParams(window.location.search);
const eventId = params.get("event");

const gallery = document.getElementById("gallery");
const eventTitle = document.getElementById("eventTitle");

if (!eventId) {
    gallery.innerHTML = `
    <div class="empty">
      <h2>Event tidak ditemukan</h2>
      <p>Gunakan QR Code atau link event.</p>
    </div>
  `;
} else {
    eventTitle.textContent = `Event: ${eventId}`;

    loadPhotos();
}

async function loadPhotos() {
    try {
        const response = await fetch(
            `/api/photos?event=${encodeURIComponent(eventId)}`
        );

        if (!response.ok) {
            throw new Error("Gagal mengambil foto");
        }

        const data = await response.json();

        if (!data.photos || data.photos.length === 0) {
            gallery.innerHTML = `
        <div class="empty">
          <h2>Belum ada foto</h2>
          <p>Foto akan muncul di sini setelah diupload.</p>
        </div>
      `;

            return;
        }

        gallery.innerHTML = "";

        data.photos.forEach(photo => {
            const card = document.createElement("div");

            card.className = "photo-card";

            card.innerHTML = `
        <img
          src="${photo.url}"
          alt="${photo.name}"
          loading="lazy"
        >
        <div class="photo-name">
          ${photo.name}
        </div>
      `;

            gallery.appendChild(card);
        });
    } catch (error) {
        console.error(error);

        gallery.innerHTML = `
      <div class="empty">
        <h2>Gagal memuat foto</h2>
        <p>Silakan coba lagi.</p>
      </div>
    `;
    }
}
