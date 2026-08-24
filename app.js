const gallery = document.getElementById("gallery");
const statusText = document.getElementById("status");
const empty = document.getElementById("empty");
const refreshButton = document.getElementById("refreshButton");

async function loadPhotos() {
    statusText.textContent = "Memuat foto...";

    gallery.innerHTML = "";

    empty.hidden = true;

    try {
        const response = await fetch("/api/photos");

        if (!response.ok) {
            throw new Error("Gagal mengambil foto.");
        }

        const data = await response.json();

        if (!data.photos || data.photos.length === 0) {
            empty.hidden = false;

            statusText.textContent = "Belum ada foto.";

            return;
        }

        data.photos.forEach(photo => {
            const item = document.createElement("div");

            item.className = "photo";

            const img = document.createElement("img");

            img.src = photo.url;

            img.alt = photo.name;

            img.loading = "lazy";

            /*
             * Klik foto
             * untuk membuka ukuran asli.
             */

            img.addEventListener("click", () => {
                window.open(photo.url, "_blank");
            });

            item.appendChild(img);

            gallery.appendChild(item);
        });

        statusText.textContent = `${data.photos.length} foto terbaru`;
    } catch (error) {
        console.error(error);

        statusText.textContent = "Gagal memuat foto.";
    }
}

refreshButton.addEventListener("click", loadPhotos);

/*
 * Jalankan ketika halaman dibuka.
 */

loadPhotos();

/*
 * Otomatis refresh setiap 10 detik.
 *
 * Jadi client tidak perlu terus
 * menekan tombol Refresh.
 */

setInterval(loadPhotos, 10000);
