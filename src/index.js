export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // API: daftar foto
        if (url.pathname === "/api/photos") {
            return getPhotos(env);
        }

        // API: mengambil foto dari R2
        if (url.pathname.startsWith("/api/image/")) {
            return getImage(request, env);
        }

        // Selain API, biarkan static assets menangani request
        return env.ASSETS.fetch(request);
    },
};

// =====================================================
// DAFTAR FOTO
// =====================================================

async function getPhotos(env) {
    const listed = await env.MEDIA.list({
        limit: 1000,
    });

    const photos = listed.objects
        .filter(object => {
            const key = object.key.toLowerCase();

            return (
                key.endsWith(".jpg") ||
                key.endsWith(".jpeg") ||
                key.endsWith(".png")
            );
        })
        .map(object => ({
            name: object.key,
            size: object.size,
            uploaded: object.uploaded.toISOString(),
            url: "/api/image/" + encodeURIComponent(object.key),
        }));

    // Foto terbaru di atas
    photos.sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded));

    return Response.json(photos);
}

// =====================================================
// AMBIL FOTO DARI R2
// =====================================================

async function getImage(request, env) {
    const url = new URL(request.url);

    const encodedPath = url.pathname.replace("/api/image/", "");

    const key = decodeURIComponent(encodedPath);

    const object = await env.MEDIA.get(key);

    if (!object) {
        return new Response("Foto tidak ditemukan", {
            status: 404,
        });
    }

    const headers = new Headers();

    object.writeHttpMetadata(headers);

    headers.set("etag", object.httpEtag);

    // Browser boleh cache foto
    headers.set("Cache-Control", "public, max-age=3600");

    return new Response(object.body, {
        headers,
    });
}
