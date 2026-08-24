async function loadPhotos() {
    const loading = document.getElementById("loading");

    const gallery = document.getElementById("gallery");

    const empty = document.getElementById("empty");

    try {
        const response = await fetch("/api/photos");

        if (!response.ok) {
            throw new Error("Gagal mengambil daftar foto");
        }

        const photos = await response.json();

        loading.hidden = true;

        if (photos.length === 0) {
            empty.hidden = false;

            return;
        }

        gallery.innerHTML = "";

        photos.forEach(photo => {
            const item = document.createElement("div");

            item.className = "photo";

            item.innerHTML = `
                <img
                    src="${photo.url}"
                    alt="${escapeHtml(photo.name)}"
                    loading="lazy"
                >

                <div class="photo-name">
                    ${escapeHtml(photo.name)}
                </div>
            `;

            gallery.appendChild(item);
        });
    } catch (error) {
        loading.textContent = "Gagal memuat foto.";

        console.error(error);
    }
}

function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

loadPhotos();
